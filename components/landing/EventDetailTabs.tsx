"use client";

import { useState } from "react";
import { CalendarIcon, MapPinIcon } from "@/components/ui/icons";
import { fmtDateRange } from "@/lib/format";
import { audienceLabel } from "@/lib/rundown";
import { dayKey, fmtDay } from "@/lib/schedule";

// Item rundown berurutan → kelompok per tanggal (item tanpa tanggal di kelompok "Jadwal menyusul").
function groupByDay<T extends { date: Date | null }>(items: T[]) {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const it of items) {
    const key = it.date ? dayKey(it.date) : "tanpa";
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(it);
    else groups.push({ key, label: it.date ? fmtDay(it.date) : "Jadwal menyusul", items: [it] });
  }
  return groups;
}

type Checkpoint = {
  id: string;
  name: string;
  kind: string;
  order: number;
  audience: string;
  date: Date | null;
  startTime: string;
  endTime: string;
  place: string;
  description: string;
};

type Props = {
  description: string;
  category?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  days: number;
  checkpoints: Checkpoint[];
  useQr: boolean;
};

type TabKey = "deskripsi" | "rundown" | "lokasi" | "semua";

export function EventDetailTabs({
  description,
  category,
  location,
  startDate,
  endDate,
  days,
  checkpoints,
  useQr,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("deskripsi");

  return (
    <div className="mt-5 space-y-4 md:mt-8">
      {/* Sub-Navbar / Tab Navigation: satu baris, geser bila sempit */}
      <div className="border-b border-gray-200">
        <nav className="no-scrollbar -mb-px flex gap-4 overflow-x-auto sm:gap-6 [&>button]:shrink-0 [&>button]:whitespace-nowrap" aria-label="Navigasi Informasi Event">
          <button
            type="button"
            onClick={() => setActiveTab("deskripsi")}
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "deskripsi"
                ? "border-brand text-brand font-semibold"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span>Deskripsi Kegiatan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rundown")}
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "rundown"
                ? "border-brand text-brand font-semibold"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span>Rundown Acara</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lokasi")}
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "lokasi"
                ? "border-brand text-brand font-semibold"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span>Lokasi & Jadwal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("semua")}
            className={`inline-flex items-center gap-1.5 border-b-2 py-3 px-1 text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "semua"
                ? "border-brand text-brand font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <span>Semua Rincian</span>
          </button>
        </nav>
      </div>

      {/* Konten Tab: Deskripsi */}
      {(activeTab === "deskripsi" || activeTab === "semua") && (
        <section className="card space-y-4 p-4 md:p-6">
          <h2 className="border-b border-gray-100 pb-3 text-base font-bold text-gray-900">Deskripsi</h2>

          <div className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed text-gray-700 whitespace-pre-line">
            {description || "Belum ada deskripsi rincian yang ditambahkan untuk kegiatan ini."}
          </div>

          <div className="grid gap-3 pt-3 sm:grid-cols-3 border-t border-gray-100 text-xs">
            <div className="rounded border border-gray-100 bg-gray-50/70 p-3">
              <span className="text-[11px] font-medium text-gray-400 block">Kategori Acara</span>
              <span className="font-semibold text-gray-800 mt-0.5 block">{category || "Umum / Publik"}</span>
            </div>
            <div className="rounded border border-gray-100 bg-gray-50/70 p-3">
              <span className="text-[11px] font-medium text-gray-400 block">Durasi Pelaksanaan</span>
              <span className="font-semibold text-gray-800 mt-0.5 block">{days} Hari Kegiatan</span>
            </div>
            <div className="rounded border border-gray-100 bg-gray-50/70 p-3">
              <span className="text-[11px] font-medium text-gray-400 block">Verifikasi Peserta</span>
              <span className="font-semibold text-brand mt-0.5 block">{useQr ? "QR code" : "Dicatat panitia"}</span>
            </div>
          </div>
        </section>
      )}

      {/* Konten Tab: Rundown & Checkpoint */}
      {(activeTab === "rundown" || activeTab === "semua") && (
        <section className="card space-y-4 p-4 md:p-6">
          <h2 className="border-b border-gray-100 pb-3 text-base font-bold text-gray-900">Rundown acara</h2>

          {checkpoints.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-500">
              Rundown belum tersedia.
            </p>
          ) : (
            // Dikelompokkan per hari; tiap item menampilkan jam, tempat, dan penjelasan.
            <div className="space-y-4">
              {groupByDay(checkpoints).map((g) => (
                <div key={g.key}>
                  <p className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">{g.label}</p>
                  <ol className="divide-y divide-gray-100 border-l-2 border-brand/30 pl-3">
                    {g.items.map((cp) => (
                      <li key={cp.id} className="flex items-start gap-3 py-2.5">
                        <span className="w-24 shrink-0 text-xs font-semibold text-brand tabular-nums">{cp.startTime ? (cp.endTime ? `${cp.startTime}–${cp.endTime}` : cp.startTime) : "–"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {cp.name}
                            {audienceLabel(cp) && <span className="ml-2 text-xs font-normal text-gray-500">khusus {audienceLabel(cp)}</span>}
                          </p>
                          {cp.place && <p className="text-xs text-gray-600">{cp.place}</p>}
                          {cp.description && <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{cp.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Konten Tab: Lokasi & Jadwal */}
      {(activeTab === "lokasi" || activeTab === "semua") && (
        <section className="card space-y-4 p-4 md:p-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">Lokasi Venue & Waktu Pelaksanaan</h2>
            <p className="text-xs text-gray-500">Titik kumpul dan jadwal waktu kegiatan resmi</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-md border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <MapPinIcon className="h-4 w-4 text-brand" />
                <span>Alamat & Lokasi Venue</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{location}</p>
              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm text-[11px]"
                >
                  Buka di Google Maps ↗
                </a>
              </div>
            </div>

            <div className="rounded-md border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <CalendarIcon className="h-4 w-4 text-brand" />
                <span>Rentang Waktu Kegiatan</span>
              </div>
              <p className="text-gray-700 font-medium">
                {fmtDateRange(startDate, endDate)} ({days} hari)
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Peserta disarankan tiba 15 menit sebelum rangkaian acara dimulai untuk proses registrasi dan check-in barcode.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
