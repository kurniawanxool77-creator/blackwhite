import type { PanelLink } from "@/components/admin/PanelFrame";
import { PanelShell } from "@/components/admin/PanelShell";
import { requireAdmin } from "@/lib/auth";

// Area pribadi: jangan muncul di hasil pencarian.
export const metadata = { robots: { index: false, follow: false } };

const LINKS: PanelLink[] = [
  { href: "/superadmin/dashboard", label: "Dasbor", icon: "home" },
  { href: "/superadmin/events", label: "Event", icon: "calendar" },
  { href: "/superadmin/kategori", label: "Kategori", icon: "tag" },
  { href: "/superadmin/peserta", label: "Manajemen user", icon: "user" },
  { href: "/superadmin/admins", label: "Tim & admin", icon: "users" },
  { href: "/superadmin/absensi", label: "Absensi tim", icon: "check" },
  { href: "/superadmin/keuangan", label: "Keuangan", icon: "wallet" },
  { href: "/superadmin/site", label: "Halaman depan", icon: "layout" },
  { href: "/superadmin/banners", label: "Banner", icon: "megaphone" },
  { href: "/superadmin/articles", label: "Artikel", icon: "news" },
  { href: "/superadmin/audit", label: "Riwayat", icon: "list" },
  { href: "/superadmin/akun", label: "Akun", icon: "shield" },
];

export default async function SuperadminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin("superadmin");
  return <PanelShell admin={admin} links={LINKS}>{children}</PanelShell>;
}
