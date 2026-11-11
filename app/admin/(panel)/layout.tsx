import type { PanelLink } from "@/components/admin/PanelFrame";
import { PanelShell } from "@/components/admin/PanelShell";
import { AdminMobileTabBar } from "@/components/admin/AdminMobileTabBar";
import { AdminPwaPrompt } from "@/components/admin/AdminPwaPrompt";
import { requireAdmin } from "@/lib/auth";

// Area pribadi: jangan muncul di hasil pencarian.
export const metadata = { robots: { index: false, follow: false } };

const LINKS: PanelLink[] = [
  { href: "/admin/dashboard", label: "Home", icon: "home" },
  { href: "/admin/absensi", label: "Absensi", icon: "check" },
  { href: "/admin/events", label: "Event", icon: "calendar" },
  { href: "/admin/riwayat", label: "Riwayat", icon: "clock" },
  { href: "/admin/tim", label: "Tim panitia", icon: "users" },
  { href: "/admin/materi", label: "Materi", icon: "doc" },
  { href: "/admin/darurat", label: "Darurat", icon: "shield" },
  { href: "/admin/akun", label: "Profil", icon: "user" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin("scanner");
  return (
    <>
      <PanelShell admin={admin} links={LINKS}>
        <AdminPwaPrompt />
        <div className="pb-16 md:pb-0">{children}</div>
      </PanelShell>
      <AdminMobileTabBar />
    </>
  );
}
