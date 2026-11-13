import type { Admin } from "@prisma/client";
import { db } from "./db";
import { fmtDate, fmtNum } from "./format";
import { ROLE_LABEL } from "./roles";

// Data untuk menu profil di header (dikirim ke komponen client, jadi tanpa hash password).
export type ProfileInfo = {
  kind: "admin" | "user";
  name: string;
  email: string;
  roleLabel: string;
  image: string | null;
  details: { label: string; value: string }[];
  links: { href: string; label: string }[];
  hasPassword: boolean;
  logoutUrl: string;
};

export async function adminProfile(admin: Admin): Promise<ProfileInfo> {
  const isSuper = admin.role === "superadmin";
  const assigned = isSuper ? 0 : await db.event.count({ where: { admins: { some: { id: admin.id } } } });
  return {
    kind: "admin",
    name: admin.name,
    email: admin.email,
    roleLabel: admin.position || (ROLE_LABEL[admin.role] ?? admin.role),
    image: admin.image,
    details: [
      { label: "Peran", value: isSuper ? "Superadmin (semua event)" : `Panitia · ${fmtNum(assigned)} event ditugaskan` },
      ...(admin.position ? [{ label: "Jabatan", value: admin.position }] : []),
      { label: "No. HP", value: admin.phone ?? "Belum diisi" },
      { label: "Bergabung", value: fmtDate(admin.createdAt) },
    ],
    links: [{ href: isSuper ? "/superadmin/akun" : "/admin/akun", label: "Halaman akun" }],
    hasPassword: true,
    logoutUrl: isSuper ? "/superadmin" : "/admin",
  };
}

export async function userProfile(userId: string): Promise<ProfileInfo | null> {
  const user = await db.user.findUnique({ where: { id: userId }, include: { _count: { select: { registrations: true } } } });
  if (!user) return null;
  return {
    kind: "user",
    name: user.name,
    email: user.email,
    roleLabel: "Peserta",
    image: user.image,
    details: [
      { label: "No. HP", value: user.phone ?? "Belum diisi" },
      { label: "Instansi", value: user.organization ?? "Belum diisi" },
      { label: "Pendaftaran", value: `${fmtNum(user._count.registrations)} event` },
      { label: "Metode masuk", value: user.passwordHash ? (user.emailVerified ? "Email & password, Google" : "Email & password") : "Google" },
      { label: "Bergabung", value: fmtDate(user.createdAt) },
    ],
    links: [
      { href: "/dashboard", label: "Tiket saya" },
      { href: "/akun", label: user.image ? "Ubah profil & foto" : "Tambah foto profil" },
    ],
    hasPassword: !!user.passwordHash,
    logoutUrl: "/",
  };
}
