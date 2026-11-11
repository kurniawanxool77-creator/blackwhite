"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/ui/icons";
import { LIVE_EVENT } from "@/components/ui/LiveSync";
import type { Notice } from "@/lib/notifications";

const REFRESH_MS = 60_000;

// Lonceng notifikasi: jumlah hal yang perlu ditindaklanjuti + daftar singkat. Diperbarui saat ada perubahan data (LiveSync).
export function NotificationBell() {
  const [data, setData] = useState<{ total: number; items: Notice[] } | null>(null);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // jaringan putus: biarkan data terakhir
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, REFRESH_MS);
    window.addEventListener(LIVE_EVENT, load);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener(LIVE_EVENT, load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const total = data?.total ?? 0;
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label={total ? `Notifikasi, ${total} baru` : "Notifikasi"}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <BellIcon width={22} height={22} />
        {total > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white tabular-nums">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifikasi" className="card animate-rise absolute top-full right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] shadow-lg">
          <p className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Notifikasi</p>
          {!data ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Memuat...</p>
          ) : data.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Tidak ada yang perlu ditindaklanjuti.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {data.items.map((n) => (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-gray-50">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.tone === "warn" ? "bg-amber-500" : "bg-brand"}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                      <span className="block truncate text-xs text-gray-500">{n.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data && data.total > data.items.length && (
            <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">+{data.total - data.items.length} lainnya di halaman event</p>
          )}
        </div>
      )}
    </div>
  );
}
