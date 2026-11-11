"use client";

import { usePathname } from "next/navigation";

// Halaman masuk/daftar tampil bersih tanpa footer website (kontak, akses portal).
export const AUTH_PAGES = ["/login", "/daftar"];

export function FooterGate({ children }: { children: React.ReactNode }) {
  return AUTH_PAGES.includes(usePathname()) ? null : children;
}
