"use client";

import { useMemo, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtTime } from "@/lib/format";

export type RosterItem = {
  id: string;
  code: string;
  tokens: string[];
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  image: string | null;
  eligible: boolean;
  scanned: boolean;
  scannedAt: string | null;
  scannedBy: string | null;
};

type Props = {
  roster: RosterItem[];
  onManualCheckin: (participant: RosterItem) => Promise<void> | void;
  isSyncing?: boolean;
};

type FilterTab = "all" | "scanned" | "unscanned";

export function ScannerRosterList({ roster, onManualCheckin, isSyncing }: Props) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const scannedCount = useMemo(() => roster.filter((r) => r.scanned).length, [roster]);
  const unscannedCount = roster.length - scannedCount;
  const percent = roster.length > 0 ? Math.round((scannedCount / roster.length) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter((item) => {
      if (tab === "scanned" && !item.scanned) return false;
      if (tab === "unscanned" && item.scanned) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.phone && item.phone.includes(q)) ||
        (item.organization && item.organization.toLowerCase().includes(q)) ||
        item.email.toLowerCase().includes(q)
      );
    });
  }, [roster, tab, search]);

  const handleManual = async (item: RosterItem) => {
    if (item.scanned || busyId) return;
    setBusyId(item.id);
    try {
      await onManualCheckin(item);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header Panel */}
      <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Daftar Peserta Pos Ini</h2>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
                Singkron 0.5s Realtime
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {scannedCount} dari {roster.length} peserta ({percent}%) sudah melewati pos ini
            </p>
          </div>

          {/* Tab Filter Pills */}
          <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded px-2.5 py-1 transition ${tab === "all" ? "bg-gray-900 font-semibold text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
            >
              Semua ({roster.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("scanned")}
              className={`rounded px-2.5 py-1 transition ${tab === "scanned" ? "bg-emerald-600 font-semibold text-white shadow-xs" : "text-gray-600 hover:text-emerald-700"}`}
            >
              Sudah Scan ({scannedCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("unscanned")}
              className={`rounded px-2.5 py-1 transition ${tab === "unscanned" ? "bg-amber-600 font-semibold text-white shadow-xs" : "text-gray-600 hover:text-amber-700"}`}
            >
              Belum Scan ({unscannedCount})
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama peserta, nomor tiket (mis: PST-001), atau instansi..."
            className="input w-full text-xs pl-8 pr-8"
          />
          <span className="pointer-events-none absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-700"
              title="Hapus pencarian"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Peserta List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            {search ? "Tidak ada peserta yang cocok dengan pencarian." : "Belum ada data peserta untuk pos ini."}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-3 p-3 transition ${
                item.scanned ? "bg-emerald-50/20 hover:bg-emerald-50/40" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={item.name} image={item.image} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.code && (
                      <span className="font-mono text-xs font-bold text-gray-900 rounded bg-gray-100 px-1.5 py-0.5 border border-gray-200">
                        {item.code}
                      </span>
                    )}
                    <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {item.organization || item.email}
                  </p>
                </div>
              </div>

              {/* Status & Action */}
              <div className="shrink-0 text-right">
                {item.scanned ? (
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <span>✓</span> Sudah Scan
                    </span>
                    <span className="mt-0.5 text-[10px] text-gray-500 tabular-nums">
                      {item.scannedAt ? fmtTime(new Date(item.scannedAt)) : ""} · {item.scannedBy || "Panitia"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Belum Scan
                    </span>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleManual(item)}
                      className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 font-medium hover:border-brand hover:text-brand"
                      title="Tandai hadir manual tanpa kamera"
                    >
                      {busyId === item.id ? "Menyimpan..." : "Check-in Manual"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

