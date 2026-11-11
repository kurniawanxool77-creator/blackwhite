"use client";

import { useEffect, useState } from "react";

const fmt = () => new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

// Jam berjalan (WIB) untuk kartu absensi. Kosong saat render server agar tidak beda dengan browser.
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState("");
  useEffect(() => {
    const first = setTimeout(() => setNow(fmt()), 0);
    const id = setInterval(() => setNow(fmt()), 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {now || "--.--"}
    </span>
  );
}
