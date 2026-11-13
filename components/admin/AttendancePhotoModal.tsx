"use client";

import { useEffect } from "react";
import { ClockIcon, CloseIcon, MapPinIcon } from "@/components/ui/icons";

export type AttendanceDetailPopupData = {
  adminName: string;
  adminPosition?: string;
  eventName: string;
  dateLabel: string;
  location: string;
  checkInTime?: string;
  checkOutTime?: string;
  duration?: string;
  status: string;
  statusTone?: "green" | "gray" | "amber" | "red";
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  // Fallback untuk single photo preview
  src?: string;
  title?: string;
  subtitle?: string;
  time?: string;
};

export function AttendancePhotoModal({
  data,
  onClose,
}: {
  data: AttendanceDetailPopupData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [data, onClose]);

  if (!data) return null;

  const toneClass = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[data.statusTone ?? "gray"];

  // Jika cuma single photo view sederhana
  if (data.src && !data.checkInTime) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Preview Foto Presensi"
      >
        <div className="animate-rise relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-md bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900">{data.title || data.adminName}</h3>
              {data.subtitle && <p className="truncate text-xs text-gray-500">{data.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center bg-gray-950 p-2">
            <img src={data.src} alt={data.title || "Foto"} className="max-h-[65vh] w-auto max-w-full rounded object-contain" />
          </div>
          {data.time && (
            <div className="border-t border-gray-200 px-4 py-2.5 text-xs text-gray-600">
              Waktu: <b className="text-gray-900">{data.time}</b>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Detail Kehadiran dan Foto"
    >
      <div className="animate-rise relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-md bg-white shadow-2xl">
        {/* Header Popup */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{data.adminName}</h3>
            <p className="text-xs text-gray-500 truncate">{data.adminPosition || "Tim"} · {data.eventName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${toneClass}`}>
              {data.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Isi Popup: Info Lokasi, Waktu, dan Foto Selfie */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Card Info Lokasi & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <MapPinIcon width={14} height={14} className="text-brand" />
                Lokasi Event / Check-in
              </span>
              <p className="font-semibold text-gray-900">{data.location || "Lokasi Acara"}</p>
              <p className="text-xs text-gray-500 mt-0.5">{data.dateLabel}</p>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <ClockIcon width={14} height={14} className="text-brand" />
                Waktu & Durasi Kerja
              </span>
              <p className="font-semibold text-gray-900 font-mono">
                {data.checkInTime ? `Datang: ${data.checkInTime}` : "Belum datang"}
              </p>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                {data.checkOutTime ? `Selesai: ${data.checkOutTime}` : "Belum selesai"}
                {data.duration && ` · ${data.duration}`}
              </p>
            </div>
          </div>

          {/* Area Foto Selfie: Datang & Selesai */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Bukti Foto Selfie Presensi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto Datang */}
              <div className="rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                <div className="border-b border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white flex justify-between">
                  <span>Foto Datang</span>
                  {data.checkInTime && <span className="font-mono text-brand">{data.checkInTime}</span>}
                </div>
                <div className="flex items-center justify-center p-2 min-h-48 bg-gray-950">
                  {data.checkInPhoto ? (
                    <img
                      src={data.checkInPhoto}
                      alt={`Foto datang ${data.adminName}`}
                      className="max-h-52 w-auto max-w-full rounded object-contain"
                    />
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-8">
                      Tidak ada foto datang
                    </div>
                  )}
                </div>
              </div>

              {/* Foto Selesai */}
              <div className="rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                <div className="border-b border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white flex justify-between">
                  <span>Foto Selesai</span>
                  {data.checkOutTime && <span className="font-mono text-brand">{data.checkOutTime}</span>}
                </div>
                <div className="flex items-center justify-center p-2 min-h-48 bg-gray-950">
                  {data.checkOutPhoto ? (
                    <img
                      src={data.checkOutPhoto}
                      alt={`Foto selesai ${data.adminName}`}
                      className="max-h-52 w-auto max-w-full rounded object-contain"
                    />
                  ) : (
                    <div className="text-center text-xs text-gray-400 py-8">
                      {data.checkOutTime ? "Tanpa foto selesai" : "Belum absen selesai"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Popup */}
        <div className="border-t border-gray-200 px-5 py-3 flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
