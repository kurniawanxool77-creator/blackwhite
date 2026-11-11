"use client";

import { useEffect, useState } from "react";
import { CloseIcon, PrinterIcon } from "@/components/ui/icons";
import { fmtDate, fmtDateRange, fmtNum, fmtTime } from "@/lib/format";
import type { EventAttendanceReport } from "@/lib/attendance";
import { AttendancePhotoModal, type AttendanceDetailPopupData } from "./AttendancePhotoModal";

type Props = {
  report: EventAttendanceReport;
  open: boolean;
  onClose: () => void;
};

export function AttendancePreviewModal({ report, open, onClose }: Props) {
  const [photoPreview, setPhotoPreview] = useState<AttendanceDetailPopupData | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const { event, days, members, summary } = report;

  // Kumpulkan foto selfie untuk galeri pratinjau
  const selfies: Array<{
    src: string;
    adminName: string;
    type: "Datang" | "Selesai";
    dateLabel: string;
    time: string;
  }> = [];

  for (const day of days) {
    for (const m of members) {
      const att = m.attendanceByDate[day.dateKey];
      if (att?.checkInPhoto) {
        selfies.push({
          src: att.checkInPhoto,
          adminName: m.admin.name,
          type: "Datang",
          dateLabel: day.shortLabel,
          time: fmtTime(att.checkIn),
        });
      }
      if (att?.checkOutPhoto && att.checkOut) {
        selfies.push({
          src: att.checkOutPhoto,
          adminName: m.admin.name,
          type: "Selesai",
          dateLabel: day.shortLabel,
          time: fmtTime(att.checkOut),
        });
      }
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-2 sm:p-4 print:p-0 print:bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Pratinjau Rekapitulasi Presensi"
      >
        <div className="animate-rise relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-md bg-white shadow-2xl print:max-h-none print:shadow-none print:w-full">
          {/* Header Modal (disembunyikan saat print) */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 print:hidden">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Pratinjau Rekap Presensi Tim</h2>
              <p className="text-xs text-gray-500">Rekapitulasi resmi kehadiran panitia dari mulai sampai selesai acara.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary btn-sm"
              >
                <PrinterIcon width={16} height={16} />
                Cetak / Simpan PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
          </div>

          {/* Konten Lembar Rekap / Preview */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 text-gray-900 print:overflow-visible print:p-0">
            {/* Header Dokumen Laporan */}
            <div className="border-b-2 border-gray-800 pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-bold tracking-wider text-brand uppercase">L-Event Management System</span>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">REKAPITULASI PRESENSI TIM</h1>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p>Dicetak: {fmtDate(new Date())}</p>
                  <p className="font-mono">ID: {event.id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Nama Acara / Pelatihan</p>
                  <p className="font-semibold text-gray-900">{event.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Periode Acara (Mulai s/d Selesai)</p>
                  <p className="font-semibold text-gray-900">
                    {fmtDateRange(event.startDate, event.endDate)} ({summary.totalDays} hari)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Lokasi Pelaksanaan</p>
                  <p className="font-semibold text-gray-900">{event.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Kategori & Mode</p>
                  <p className="font-semibold text-gray-900">
                    {event.category || "Umum"} · {event.mode.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Ringkasan Statistik */}
            <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Total Tim</span>
                <p className="text-lg font-bold text-gray-900">{fmtNum(summary.totalTeam)}</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Durasi Acara</span>
                <p className="text-lg font-bold text-gray-900">{summary.totalDays} Hari</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Tingkat Kehadiran</span>
                <p className="text-lg font-bold text-brand">{summary.attendanceRate}%</p>
                <p className="text-[10px] text-gray-500">{summary.totalPresent} dari {summary.totalMandays} kehadiran</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3">
                <span className="text-xs text-gray-500">Total Jam Kerja</span>
                <p className="text-lg font-bold text-gray-900">{summary.formattedTotalWork}</p>
              </div>
            </div>

            {/* Tabel Matriks Kehadiran dari Mulai sampai Selesai */}
            <div className="my-5">
              <h3 className="mb-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                1. Matriks Presensi Seluruh Periode Acara
              </h3>
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="border-b border-gray-200 px-3 py-2 font-semibold">No</th>
                      <th className="border-b border-gray-200 px-3 py-2 font-semibold">Nama Anggota Tim</th>
                      <th className="border-b border-gray-200 px-3 py-2 font-semibold">Jabatan</th>
                      {days.map((d) => (
                        <th key={d.dateKey} className="border-b border-gray-200 px-2 py-2 text-center font-semibold whitespace-nowrap">
                          {d.shortLabel}
                        </th>
                      ))}
                      <th className="border-b border-gray-200 px-2 py-2 text-center font-semibold">Hadir</th>
                      <th className="border-b border-gray-200 px-2 py-2 text-right font-semibold">Total Jam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={5 + days.length} className="px-3 py-4 text-center text-gray-500">
                          Belum ada anggota tim yang ditugaskan ke event ini.
                        </td>
                      </tr>
                    )}
                    {members.map((m, idx) => (
                      <tr key={m.admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{m.admin.name}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{m.admin.position || "Tim"}</td>
                        {days.map((d) => {
                          const att = m.attendanceByDate[d.dateKey];
                          if (!att) {
                            return (
                              <td key={d.dateKey} className="px-2 py-2 text-center text-gray-400 whitespace-nowrap">
                                {d.isFuture ? "—" : d.isToday ? "Belum" : "Alpha"}
                              </td>
                            );
                          }
                          const checkInStr = fmtTime(att.checkIn);
                          const checkOutStr = att.checkOut ? fmtTime(att.checkOut) : "…";
                          return (
                            <td key={d.dateKey} className="px-2 py-2 text-center whitespace-nowrap font-mono text-[11px] text-gray-800">
                              <span className="font-semibold text-green-700">{checkInStr}</span>
                              <span className="text-gray-400"> - </span>
                              <span>{checkOutStr}</span>
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-semibold text-gray-900 whitespace-nowrap">
                          {m.presentDays} / {days.length}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-gray-800 whitespace-nowrap">
                          {m.formattedWork}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Galeri Preview Foto Selfie Presensi */}
            {selfies.length > 0 && (
              <div className="my-6 print:break-inside-avoid">
                <h3 className="mb-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
                  2. Pratinjau Foto Selfie Kehadiran ({selfies.length} foto)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {selfies.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setPhotoPreview({
                          src: s.src,
                          adminName: s.adminName,
                          eventName: event.name,
                          dateLabel: s.dateLabel,
                          location: event.location,
                          status: s.type === "Datang" ? "Hadir" : "Selesai",
                          title: `${s.adminName} (${s.type})`,
                          subtitle: `${s.dateLabel} · Pukul ${s.time}`,
                          time: `${s.dateLabel} ${s.time}`,
                        })
                      }
                      className="group flex flex-col items-center rounded border border-gray-200 bg-gray-50 p-1.5 text-center transition hover:border-brand hover:shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.src}
                        alt={s.adminName}
                        className="h-20 w-full rounded object-cover"
                      />
                      <span className="mt-1 line-clamp-1 text-[11px] font-semibold text-gray-900 group-hover:text-brand">
                        {s.adminName}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {s.type} · {s.time}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kolom Tanda Tangan / Persetujuan untuk Cetak Fisik */}
            <div className="mt-8 pt-4 border-t border-gray-200 hidden print:grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-gray-600">Dibuat oleh,</p>
                <div className="h-16" />
                <p className="font-semibold text-gray-900 border-t border-gray-400 pt-1 inline-block px-8">
                  Koordinator Acara
                </p>
              </div>
              <div>
                <p className="text-gray-600">Mengetahui & Menyetujui,</p>
                <div className="h-16" />
                <p className="font-semibold text-gray-900 border-t border-gray-400 pt-1 inline-block px-8">
                  Superadmin / Penanggung Jawab
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AttendancePhotoModal
        data={photoPreview}
        onClose={() => setPhotoPreview(null)}
      />
    </>

  );
}
