"use client";

import type QrScannerType from "qr-scanner";
import { useEffect, useRef, useState } from "react";

// Kamera scanner barcode peserta. Menggunakan web worker dedicated & full-region decoding
// agar pemindaian QR berlangsung instan sekali arah tanpa delay.
export function CameraScanner({
  onDecode,
  isScanning = true,
}: {
  onDecode: (text: string) => void;
  isScanning?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodeRef = useRef(onDecode);
  const [error, setError] = useState("");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<QrScannerType | null>(null);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  });

  useEffect(() => {
    let scanner: QrScannerType | undefined;
    let cancelled = false;

    import("qr-scanner").then(({ default: QrScanner }) => {
      if (cancelled || !videoRef.current) return;

      // Pastikan worker path menunjuk ke file worker di root public/
      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

      scanner = new QrScanner(
        videoRef.current,
        (r) => {
          if (r?.data) {
            onDecodeRef.current(r.data);
          }
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: false,
          highlightCodeOutline: true,
          maxScansPerSecond: 25,
          calculateScanRegion: (video: HTMLVideoElement) => {
            const width = video.videoWidth || 640;
            const height = video.videoHeight || 480;
            return {
              x: 0,
              y: 0,
              width,
              height,
              downScaledWidth: Math.min(width, 800),
              downScaledHeight: Math.min(height, 800),
            };
          },
        }
      );
      scannerRef.current = scanner;

      scanner
        .start()
        .then(() => {
          if (!cancelled && scanner) {
            scanner.hasFlash().then((has) => setHasTorch(has)).catch(() => {});
          }
        })
        .catch(() => setError("Kamera tidak bisa dibuka. Izinkan akses kamera, atau gunakan input manual."));
    });

    return () => {
      cancelled = true;
      if (scanner) {
        scanner.destroy();
      }
      scannerRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.toggleFlash();
      setTorchOn(scannerRef.current.isFlashOn());
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative overflow-hidden rounded-md bg-gray-950 shadow-inner">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />

      {/* Enterprise Viewfinder Overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
        <div className="relative h-60 w-60 sm:h-72 sm:w-72 max-h-full max-w-full">
          {/* Corner Guides */}
          <div className="absolute top-0 left-0 h-6 w-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
          <div className="absolute top-0 right-0 h-6 w-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

          {/* Animated Scanning Laser Line */}
          {isScanning && !error && (
            <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-scanline" />
          )}
        </div>
      </div>

      {/* Top Banner Indicator */}
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Kamera Aktif · Siap Scan Seketika
        </span>
      </div>

      {/* Flashlight toggle button */}
      {hasTorch && (
        <button
          type="button"
          onClick={toggleTorch}
          className={`absolute top-3 right-3 rounded-md px-2.5 py-1 text-xs font-semibold backdrop-blur-xs transition ${
            torchOn ? "bg-amber-400 text-gray-900 shadow-md" : "bg-black/60 text-white hover:bg-black/80"
          }`}
          title={torchOn ? "Matikan lampu flash" : "Nyalakan lampu flash"}
        >
          {torchOn ? "⚡ Flash Nyala" : "💡 Lampu Flash"}
        </button>
      )}

      {error && <p className="absolute inset-x-0 bottom-0 bg-red-700 px-3 py-2 text-sm text-white">{error}</p>}
    </div>
  );
}
