"use client";

import { useEffect } from "react";
import { CloseIcon, PrinterIcon } from "@/components/ui/icons";
import { fmtDate, fmtDateRange } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  eventName: string;
  location: string;
  startDate: Date | string;
  endDate: Date | string;
  sampleName?: string;
  siteName?: string;
};

export function CertificatePreviewModal({
  open,
  onClose,
  eventName,
  location,
  startDate,
  endDate,
  sampleName = "Nama Peserta (Contoh)",
  siteName = "BlackWhite Activation",
}: Props) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Tutup preview"
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Preview Desain Sertifikat</h2>
            <p className="text-xs text-gray-500">Pratinjau sertifikat resmi yang akan diterbitkan untuk peserta lulus.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary btn-sm"
              title="Cetak sertifikat"
            >
              <PrinterIcon width={14} height={14} /> Cetak
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Isi Preview Sertifikat */}
        <div className="overflow-y-auto bg-gray-100 p-4 sm:p-6">
          <article className="mx-auto aspect-[297/210] w-full bg-white p-[3%] shadow-md">
            <div className="flex h-full flex-col items-center justify-between border-[6px] border-double border-gray-900 px-[6%] py-[4%] text-center">
              <p className="text-xs font-bold tracking-tight text-gray-900 sm:text-sm">{siteName}</p>

              <div>
                <p className="text-[clamp(1.2rem,3.5vw,2.3rem)] font-bold tracking-[0.2em] text-gray-900">SERTIFIKAT</p>
                <p className="mt-[1%] text-[clamp(0.65rem,1.2vw,0.875rem)] text-gray-600">Diberikan kepada</p>
                <p className="mt-[0.5%] border-b border-gray-300 px-6 pb-[0.5%] text-[clamp(1rem,3.2vw,2rem)] font-semibold text-gray-900">
                  {sampleName}
                </p>
                <p className="mt-[1.5%] text-[clamp(0.65rem,1.2vw,0.875rem)] text-gray-600">atas keikutsertaan dan kelulusan dalam</p>
                <p className="mt-[0.5%] text-[clamp(0.85rem,2vw,1.3rem)] font-semibold text-gray-900">{eventName}</p>
                <p className="mt-[0.5%] text-[clamp(0.6rem,1.1vw,0.8rem)] text-gray-600">
                  {location} · {fmtDateRange(startDate, endDate)}
                </p>
              </div>

              <div className="flex w-full items-end justify-between gap-4 text-left text-[clamp(0.55rem,1vw,0.75rem)] text-gray-600">
                <div>
                  <p>No. sertifikat</p>
                  <p className="font-mono font-semibold text-gray-900">CERT-PREVIEW-2026</p>
                  <p className="mt-0.5">Diterbitkan {fmtDate(new Date())}</p>
                </div>
                <div className="text-center">
                  <div className="mb-1 h-[clamp(1.2rem,4vw,2.5rem)] w-[clamp(6rem,15vw,10rem)] border-b border-gray-400" />
                  <p className="font-semibold text-gray-900">Penyelenggara</p>
                  <p>{siteName}</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-5 py-3">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

