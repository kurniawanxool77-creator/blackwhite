"use client";

import { useState } from "react";
import { DownloadIcon, MapPinIcon, PrinterIcon, QrCodeIcon } from "@/components/ui/icons";

type Props = {
  qrDataUrl: string;
  eventName: string;
  eventSlug: string;
  userName: string;
  location: string;
};

export function TicketActions({ qrDataUrl, eventName, eventSlug, userName, location }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 w-full text-xs">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={qrDataUrl}
            download={`tiket-${eventSlug}.png`}
            className="btn btn-secondary text-xs"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Simpan QR</span>
          </a>

          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="btn btn-primary text-xs"
          >
            <QrCodeIcon className="h-3.5 w-3.5" />
            <span>Layar Penuh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-secondary text-xs"
          >
            <PrinterIcon className="h-3.5 w-3.5" />
            <span>Cetak Tiket</span>
          </button>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs"
          >
            <MapPinIcon className="h-3.5 w-3.5" />
            <span>Peta Lokasi</span>
          </a>
        </div>
      </div>

      {/* Fullscreen High-Contrast QR Popup */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6 animate-rise"
          onClick={() => setFullscreen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex flex-col items-center rounded-lg bg-white p-6 shadow-2xl text-center max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100"
              aria-label="Tutup"
            >
              ✕
            </button>

            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Siap Dipindai Petugas
            </span>

            <div className="my-4 p-2 border-2 border-gray-900 rounded bg-white">
              <img src={qrDataUrl} alt="QR Code Fullscreen" className="h-64 w-64 max-w-full" />
            </div>

            <p className="text-base font-bold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{eventName}</p>
            <p className="mt-3 text-[11px] text-gray-400">
              Ketuk di luar area untuk kembali ke halaman tiket
            </p>
          </div>
        </div>
      )}
    </>
  );
}
