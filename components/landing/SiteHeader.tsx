"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/account/ProfileMenu";
import { LoginIcon } from "@/components/ui/icons";
import { AUTH_PAGES } from "./FooterGate";
import type { ProfileInfo } from "@/lib/profile";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/event", label: "Pelatihan" },
  { href: "/galeri", label: "Galeri" },
  { href: "/blog", label: "Artikel" },
  { href: "/kontak", label: "Kontak" },
];

export function SiteHeader({ name, profile }: { name: string; profile: ProfileInfo | null }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const linkClass = (href: string) =>
    `whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors rounded ${
      active(href)
        ? "bg-gray-100 text-gray-900 font-semibold"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  // Di HP header jadi app bar (nama + avatar); navigasi lewat tab bawah, Masuk lewat tab Akun.
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center">
          <span className="text-sm font-bold tracking-tight text-gray-900 sm:text-base">{name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Menu Halaman">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        {profile ? (
          <ProfileMenu profile={profile} />
        ) : AUTH_PAGES.includes(pathname) ? null : (
          // Satu pintu: halaman Masuk (Google / email); daftar akun ada di sana.
          <Link href="/login" className="btn btn-primary hidden font-semibold md:inline-flex">
            <LoginIcon width={18} height={18} strokeWidth={2.2} />
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
