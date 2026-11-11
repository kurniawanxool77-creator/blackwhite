import Link from "next/link";
import { ProfileMenu } from "@/components/account/ProfileMenu";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { CalendarIcon, TicketIcon } from "@/components/ui/icons";
import { requireUser } from "@/lib/auth";
import { userProfile } from "@/lib/profile";
import { getSite } from "@/lib/site";

import { PwaInstallPrompt } from "@/components/ui/PwaInstallPrompt";

// Area pribadi: jangan muncul di hasil pencarian.
export const metadata = { robots: { index: false, follow: false } };

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const [user, site] = await Promise.all([requireUser(), getSite()]);
  const profile = await userProfile(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/70">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <span className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">
                {site.name}
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi Pengguna">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <TicketIcon className="h-4 w-4 text-gray-500" />
                <span>Tiket</span>
              </Link>
              <Link
                href="/event"
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-24 md:py-8 md:pb-8">{children}</main>
      <MobileTabBar />
    </div>
  );
}
