"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircleIcon,
  ClockIcon,
  HomeIcon,
  QrCodeIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";

const TABS = [
  { href: "/admin/dashboard", label: "Home", icon: HomeIcon },
  { href: "/admin/absensi", label: "Absensi", icon: CheckCircleIcon },
  { href: "/admin/events", label: "Event", icon: QrCodeIcon, highlight: true },
  { href: "/admin/riwayat", label: "Riwayat", icon: ClockIcon },
  { href: "/admin/darurat", label: "Darurat", icon: ShieldCheckIcon },
];

export function AdminMobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Bawah Panitia"
      className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white/95 px-2 backdrop-blur-md md:hidden"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/admin/dashboard" && pathname.startsWith(tab.href));
        const Icon = tab.icon;

        if (tab.highlight) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-md active:scale-95 transition-transform">
                <Icon className="h-6 w-6" />
              </div>
              <span className="mt-1 text-[10px] font-bold text-brand">{tab.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
              isActive ? "text-brand font-semibold" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-1 text-[10px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
