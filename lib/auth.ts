import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { db } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { HOME } from "./roles";

// Selama belum ada superadmin, login pertama dengan kredensial dari .env membuat akun superadmin.
async function bootstrapSuperadmin(email: string, password: string) {
  const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) return null;
  if (email !== SUPERADMIN_EMAIL.toLowerCase() || password !== SUPERADMIN_PASSWORD) return null;
  if ((await db.admin.count({ where: { role: "superadmin" } })) > 0) return null;
  return db.admin.create({
    data: { email, name: "Superadmin", role: "superadmin", passwordHash: hashPassword(password) },
  });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    // Peserta dengan email + password. Akun yang hanya pernah memakai Google tidak punya password.
    CredentialsProvider({
      id: "user",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(password, user.passwordHash)) return null;
        return { id: user.id, name: user.name, email: user.email, role: "user" as const };
      },
    }),
    CredentialsProvider({
      id: "admin",
      // portal: "superadmin" (login di /superadmin) atau "admin" (login panitia di /admin)
      credentials: { email: {}, password: {}, portal: {} },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const portal = credentials?.portal === "superadmin" ? "superadmin" : "scanner";
        if (!email || !password) return null;
        const admin =
          (await db.admin.findUnique({ where: { email } })) ??
          (portal === "superadmin" ? await bootstrapSuperadmin(email, password) : null);
        if (!admin?.active) return null;
        if (!verifyPassword(password, admin.passwordHash)) return null;
        if (admin.role !== portal) return null;
        return { id: admin.id, name: admin.name, email: admin.email, role: admin.role as "superadmin" | "scanner" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const email = token.email.toLowerCase();
        const existing = await db.user.findUnique({ where: { email } });
        // Google membuktikan pemilik email. Password yang dibuat sebelum bukti itu dihapus, agar orang yang
        // mendaftarkan email milik orang lain tidak bisa tetap masuk. Nama dari profil peserta tidak ditimpa.
        const dbUser = existing
          ? await db.user.update({
              where: { id: existing.id },
              data: { image: token.picture, emailVerified: true, ...(existing.emailVerified ? {} : { passwordHash: null }) },
            })
          : await db.user.create({ data: { email, name: token.name ?? email, image: token.picture, emailVerified: true } });
        token.id = dbUser.id;
        token.role = "user";
      } else if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id ?? "";
      session.user.role = token.role;
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireUser() {
  const session = await getSession();
  if (session?.user.role !== "user") redirect("/login");
  return session.user;
}

// Admin aktif dari sesi, atau null. Untuk route handler yang menjawab 401 sendiri.
export async function getActiveAdmin() {
  const session = await getSession();
  const admin = session?.user.id ? await db.admin.findUnique({ where: { id: session.user.id } }) : null;
  return admin?.active ? admin : null;
}

// role "scanner" = admin/panitia. Tanpa role: superadmin atau panitia boleh.
export async function requireAdmin(role?: "superadmin" | "scanner") {
  const admin = await getActiveAdmin();
  if (!admin) redirect(role === "scanner" ? "/admin" : "/superadmin");
  if (role && admin.role !== role) redirect(HOME[admin.role]);
  return admin;
}
