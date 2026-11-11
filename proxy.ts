import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { HOME } from "@/lib/roles";

// Tiga pintu: /login (peserta), /admin (panitia, role "scanner"), /superadmin.
// Lapisan pertama saja; halaman dan server action tetap memeriksa sesi sendiri (lib/auth.ts).
const AREAS = [
  { prefix: "/superadmin", role: "superadmin" },
  { prefix: "/admin", role: "scanner" },
] as const;

export async function proxy(req: NextRequest) {
  const role = (await getToken({ req }))?.role;
  const { pathname } = req.nextUrl;
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  for (const area of AREAS) {
    if (pathname === area.prefix) return role === area.role ? to(HOME[area.role]) : NextResponse.next();
    if (pathname.startsWith(`${area.prefix}/`)) {
      return role === area.role ? NextResponse.next() : to(area.prefix);
    }
  }
  if (role !== "user") return to(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tiket/:path*", "/akun", "/superadmin", "/superadmin/:path*", "/admin", "/admin/:path*"],
};
