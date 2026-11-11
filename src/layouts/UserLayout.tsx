import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ProfileMenu } from "@/components/account/ProfileMenu";
import { CalendarIcon, TicketIcon } from "@/components/ui/icons";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";
import { PageLoader } from "@/src/components/RouteState";
import { useAuth } from "@/src/lib/auth-client";

export function UserLayout() {
  const { loading, user, profile, site } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) return <PageLoader />;
  if (!user || user.role !== "user") {
    return <Navigate to={`/login?callbackUrl=${encodeURIComponent(pathname + search)}`} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/70">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <span className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">{site.name}</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi Pengguna">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <TicketIcon className="h-4 w-4 text-gray-500" />
                <span>Tiket</span>
              </Link>
              <Link
                to="/event"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>Pelatihan</span>
              </Link>
            </nav>
          </div>

          {profile && <ProfileMenu profile={profile} />}
        </div>
      </header>

      <div className="pt-4 md:hidden">
        <PwaInstallPrompt />
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
}
