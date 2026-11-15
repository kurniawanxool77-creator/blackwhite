"use client";

import { AwardIcon } from "@/components/ui/icons";

export function CourseCertificateInline({
  certificateNo,
  userName,
  eventName,
  locked,
}: {
  certificateNo: string | null;
  userName?: string;
  eventName: string;
  locked: boolean;
}) {
  return (
    <div className="card p-3.5 sm:p-6 space-y-4 sm:space-y-6">
      <div className="border-b border-gray-100 pb-3 sm:pb-4">
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-brand uppercase">
          Hasil Akhir
        </span>
        <h3 className="mt-0.5 text-base sm:text-xl font-bold text-gray-900">
          Sertifikat Kelulusan Resmi
        </h3>
        <p className="mt-1 text-[11px] sm:text-xs text-gray-600">
          Bukti penyelesaian resmi kegiatan pelatihan & evaluasi kompetensi.
        </p>
      </div>

      {locked || !certificateNo ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50/70 p-6 sm:p-8 text-center">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 text-sm sm:text-base">
            🔒
          </div>
          <h4 className="mt-2.5 text-xs sm:text-sm font-semibold text-gray-900">
            Sertifikat Belum Terbuka
          </h4>
          <p className="mt-1 max-w-sm text-[11px] sm:text-xs leading-relaxed text-gray-500">
            Harap selesaikan seluruh materi video dan lulus evaluasi kuis untuk menerbitkan sertifikat kelulusan Anda secara otomatis.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-white shadow-xs text-brand">
              <AwardIcon width={22} height={22} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-800">
                ✓ Terverifikasi & Diterbitkan
              </span>
              <h4 className="mt-1.5 text-xs sm:text-base font-bold text-gray-900 leading-snug">
                Sertifikat Atas Nama {userName || "Peserta"}
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 line-clamp-2">
                Kegiatan: <span className="font-semibold text-gray-800">{eventName}</span>
              </p>
              <div className="mt-2.5 inline-block rounded border border-gray-200 bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 font-mono text-[11px] sm:text-xs font-bold text-gray-900 shadow-2xs">
                No: {certificateNo}
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2.5 border-t border-emerald-100 pt-4 sm:pt-5">
            <a
              href={`/sertifikat/${certificateNo}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-sm text-xs font-semibold inline-flex items-center gap-1.5 w-full sm:w-auto"
            >
              <AwardIcon width={14} height={14} /> Buka & Unduh Sertifikat (PDF/Cetak) ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
