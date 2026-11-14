"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileMenu } from "@/components/account/ProfileMenu";
import { HeaderClock } from "./HeaderClock";
import { NotificationBell } from "./NotificationBell";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  DocumentIcon,
  HomeIcon,
  LayoutIcon,
  ListIcon,
  MegaphoneIcon,
  MenuIcon,
  NewspaperIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import type { ProfileInfo } from "@/lib/profile";

const ICONS = {
  home: HomeIcon,
  calendar: CalendarIcon,
  check: CheckCircleIcon,
  scan: QrCodeIcon,
  clock: ClockIcon,
  doc: DocumentIcon,
  shield: ShieldCheckIcon,
  user: UserIcon,
  users: UsersIcon,
  layout: LayoutIcon,
  megaphone: MegaphoneIcon,
  news: NewspaperIcon,
  list: ListIcon,
  tag: TagIcon,
  wallet: WalletIcon,
};
export type PanelLink = { href: string; label: string; icon: keyof typeof ICONS };

type Props = { siteName: string; links: PanelLink[]; profile: ProfileInfo; logoImage?: string; children: React.ReactNode };

// Tata letak panel ala HRIS: sidebar kiri (desktop) / laci menu (HP), top bar dengan profil di kanan atas.
export function PanelFrame({ siteName, links, profile, logoImage, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // laci menu (HP)
  const [collapsed, setCollapsed] = useState(false); // sidebar disembunyikan (desktop)
  const toggleMenu = () =>
    window.matchMedia("(min-width: 768px)").matches ? setCollapsed((v) => !v) : setOpen(true);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const brand = (
    <Link href={links[0]?.href ?? "/"} className="flex items-center gap-2.5 px-4 py-4" aria-label={siteName}>
      <img src={logoImage || "/logo.png"} alt={siteName} className="h-8 w-auto max-w-[170px] object-contain" />
    </Link>
  );

  const nav = (
    <nav aria-label="Menu panel" className="flex flex-col gap-0.5 px-3 pb-4">
      {links.map((l) => {
        const Icon = ICONS[l.icon];
        const on = active(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors ${
              on ? "bg-green-50 font-semibold text-brand" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon width={18} height={18} className={on ? "text-brand" : "text-gray-500"} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className={`sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white ${collapsed ? "" : "md:flex"}`}>
        {brand}
        {nav}
      </aside>

      {/* Laci menu HP */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu panel">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-gray-900/40" onClick={() => setOpen(false)} />
          <aside className="animate-rise absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between pr-2">
              {brand}
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="flex h-11 w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100">
                <CloseIcon width={20} height={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={toggleMenu} aria-label="Buka menu" aria-expanded={open || !collapsed} className="flex h-11 w-11 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100">
              <MenuIcon width={22} height={22} />
            </button>
            <span className={`truncate text-base font-bold text-gray-900 ${collapsed ? "" : "md:hidden"}`}>
              {links.find((l) => active(l.href))?.label ?? siteName}
            </span>
            <span className="hidden truncate text-sm font-semibold text-gray-700 md:inline">
              {links.find((l) => active(l.href))?.label ?? ""}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <HeaderClock />
            <NotificationBell />
            <ProfileMenu profile={profile} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
