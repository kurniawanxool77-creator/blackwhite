"use client";

import type QrScannerType from "qr-scanner";
import { useEffect, useRef, useState } from "react";

// Kamera belakang HP. Butuh HTTPS (atau localhost) agar browser mengizinkan kamera.
export function CameraScanner({ onDecode }: { onDecode: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodeRef = useRef(onDecode);
  const [error, setError] = useState("");

  useEffect(() => {
    onDecodeRef.current = onDecode;
  });

  useEffect(() => {
    let scanner: QrScannerType | undefined;
    let cancelled = false;
    import("qr-scanner").then(({ default: QrScanner }) => {
      if (cancelled || !videoRef.current) return;
      scanner = new QrScanner(videoRef.current, (r) => onDecodeRef.current(r.data), {
        preferredCamera: "environment",
        highlightScanRegion: true,
        maxScansPerSecond: 5,
      });
      scanner.start().catch(() => setError("Kamera tidak bisa dibuka. Izinkan akses kamera, atau gunakan input manual."));
    });
    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-md bg-gray-900">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
      {error && <p className="absolute inset-x-0 bottom-0 bg-red-700 px-3 py-2 text-sm text-white">{error}</p>}
    </div>
  );
}
