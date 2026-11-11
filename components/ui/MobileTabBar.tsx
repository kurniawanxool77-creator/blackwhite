"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, PhotoIcon, TicketIcon, UserIcon } from "./icons";

const TABS = [
  { href: "/", label: "Beranda", Icon: HomeIcon, active: (p: string) => p === "/" || p.startsWith("/blog") },
  { href: "/event", label: "Pelatihan", Icon: CalendarIcon, active: (p: string) => p.startsWith("/event") },
  { href: "/galeri", label: "Galeri", Icon: PhotoIcon, active: (p: string) => p.startsWith("/galeri") },
  { href: "/dashboard", label: "Tiket", Icon: TicketIcon, active: (p: string) => p.startsWith("/dashboard") || p.startsWith("/tiket") },
  { href: "/akun", label: "Akun", Icon: UserIcon, active: (p: string) => p === "/akun" || p === "/login" || p === "/daftar" },
];

// Bar menu bawah ala aplikasi HP. Hanya tampil di layar kecil; spacer mencegah konten tertutup.
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <>
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
      <nav
        aria-label="Menu utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        <ul className="grid grid-cols-5">
          {TABS.map(({ href, label, Icon, active }) => {
            const on = active(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex h-15 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors active:bg-gray-50 ${
                    on ? "text-brand font-semibold" : "text-gray-500"
                  }`}
                >
                  <span
                    className={`absolute top-0 h-0.5 rounded-full bg-brand transition-all duration-300 ${
                      on ? "w-6" : "w-0"
                    }`}
                  />
                  <Icon
                    key={String(on)}
                    className={`h-4.5 w-4.5 ${on ? "animate-pop" : ""}`}
                    strokeWidth={on ? 2.2 : 1.8}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
