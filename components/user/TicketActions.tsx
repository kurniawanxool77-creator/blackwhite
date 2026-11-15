"use client";

import { useState } from "react";
import { DownloadIcon, MapPinIcon, PrinterIcon, QrCodeIcon } from "@/components/ui/icons";

type Props = {
  qrDataUrl: string;
  code?: string | null;
  eventName: string;
  eventSlug: string;
  userName: string;
  location: string;
};

export function TicketActions({ qrDataUrl, code, eventName, eventSlug, userName, location }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!code) {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `tiket-${eventSlug}.png`;
      a.click();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 520;
      canvas.height = 660;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background card
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 520, 660);

      // Draw QR centered
      ctx.drawImage(img, 40, 20, 440, 440);

      // Code box
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(70, 480, 380, 52, 8);
      } else {
        ctx.rect(70, 480, 380, 52);
      }
      ctx.fill();
      ctx.stroke();

      // Code text
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 28px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(code, 260, 506);

      // Name
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(userName, 260, 565);

      // Event
      ctx.fillStyle = "#64748b";
      ctx.font = "500 14px sans-serif";
      ctx.fillText(eventName, 260, 598);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `tiket-${eventSlug}-${code}.png`;
      link.click();
    };
    img.src = qrDataUrl;
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 w-full text-xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-secondary text-xs"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Simpan QR</span>
          </button>

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

            <span className="rounded border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-brand">
              Siap Dipindai Petugas
            </span>

            <div className="my-4 flex flex-col items-center rounded border-2 border-gray-900 bg-white p-3 w-full">
              <img src={qrDataUrl} alt="QR Code Fullscreen" className="h-64 w-64 max-w-full" />
              {code && (
                <div className="mt-3 w-full border-t border-gray-200 pt-2.5 text-center">
                  <span className="inline-block rounded border border-gray-900 bg-gray-50 px-4 py-1.5 font-mono text-xl sm:text-2xl font-bold tracking-widest text-gray-900">
                    {code}
                  </span>
                </div>
              )}
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
