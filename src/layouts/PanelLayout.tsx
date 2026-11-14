import { Navigate, Outlet } from "react-router-dom";
import { AdminMobileTabBar } from "@/components/admin/AdminMobileTabBar";
import { AdminPwaPrompt } from "@/components/admin/AdminPwaPrompt";
import { PanelFrame, type PanelLink } from "@/components/admin/PanelFrame";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

const ADMIN_LINKS: PanelLink[] = [
  { href: "/admin/dashboard", label: "Home", icon: "home" },
  { href: "/admin/absensi", label: "Absensi", icon: "check" },
  { href: "/admin/events", label: "Event", icon: "calendar" },
  { href: "/admin/riwayat", label: "Riwayat", icon: "clock" },
  { href: "/admin/tim", label: "Tim panitia", icon: "users" },
  { href: "/admin/materi", label: "Materi", icon: "doc" },
  { href: "/admin/darurat", label: "Darurat", icon: "shield" },
  { href: "/admin/akun", label: "Profil", icon: "user" },
];

const SUPERADMIN_LINKS: PanelLink[] = [
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

export function PanelLayout({ role }: { role: "scanner" | "superadmin" }) {
  const { loading, user, profile, site } = useAuth();

  if (loading) return <PageLoader />;
  const allowed = role === "superadmin" ? user?.role === "superadmin" : user?.role === "scanner" || user?.role === "superadmin";
  if (!user || !allowed || !profile) {
    return <Navigate to={role === "superadmin" ? "/superadmin" : "/admin"} replace />;
  }

  const links = role === "superadmin" ? SUPERADMIN_LINKS : ADMIN_LINKS;

  if (role === "scanner") {
    return (
      <>
        <PanelFrame siteName={site.name} links={links} profile={profile} logoImage={site.logoImage}>
          <AdminPwaPrompt />
          <div className="pb-16 md:pb-0">
            <Outlet />
          </div>
        </PanelFrame>
        <AdminMobileTabBar />
      </>
    );
  }

  return (
    <PanelFrame siteName={site.name} links={links} profile={profile} logoImage={site.logoImage}>
      <Outlet />
    </PanelFrame>
  );
}

