import Link from "next/link";
import { FooterGate } from "@/components/landing/FooterGate";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { getSession } from "@/lib/auth";
import { userProfile } from "@/lib/profile";
import { getSite } from "@/lib/site";

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const [site, session] = await Promise.all([getSite(), getSession()]);
  const profile = session?.user.role === "user" ? await userProfile(session.user.id) : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/70">
      <SiteHeader name={site.name} profile={profile} />
      <main className="flex-1">{children}</main>
      <FooterGate>
        {/* Di HP tampilan aplikasi (tab bawah), tanpa footer website. */}
        <footer className="hidden border-t border-gray-200 bg-white md:block">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-gray-600 sm:grid-cols-3">
            <div>
              <p className="font-bold text-gray-900">{site.name}</p>
              <p className="mt-2.5 text-xs leading-relaxed text-gray-500">{site.tagline}</p>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-900 uppercase">Kontak & Sekretariat</p>
              <div className="mt-2.5 space-y-1 text-xs text-gray-600">
                <p>{site.contact.email}</p>
                <p>{site.contact.phone}</p>
                <p>{site.contact.address}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:items-end">
              <p className="text-xs font-semibold tracking-wider text-gray-900 uppercase">Akses Portal</p>
              <div className="mt-1 flex flex-col gap-1.5 text-xs sm:items-end">
                <Link href="/login" className="text-gray-600 hover:text-brand">
                  Portal Peserta
                </Link>
                <Link href="/admin" className="text-gray-600 hover:text-brand">
                  Login panitia
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} {site.name}. Seluruh hak cipta dilindungi.
          </div>
        </footer>
      </FooterGate>
      <MobileTabBar />
    </div>
  );
}
