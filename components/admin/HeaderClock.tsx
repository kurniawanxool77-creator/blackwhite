"use client";

import { useEffect, useState } from "react";

const now = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" }),
  };
};

// Tanggal & jam berjalan (WIB) di bar atas panel. Kosong saat render server agar tidak beda dengan browser.
export function HeaderClock() {
  const [t, setT] = useState<{ date: string; time: string } | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setT(now()), 0);
    const id = setInterval(() => setT(now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return (
    <div className="hidden text-right leading-tight lg:block" aria-label="Waktu sekarang (WIB)">
      <p className="text-sm font-semibold text-gray-900 tabular-nums">{t ? `${t.time} WIB` : "--.--.--"}</p>
      <p className="text-xs text-gray-500">{t?.date ?? ""}</p>
    </div>
  );
}
