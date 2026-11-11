"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, QrCodeIcon } from "@/components/ui/icons";
import { useInstallHint } from "@/components/ui/useInstallHint";

// Event Chrome/Android; belum ada di lib.dom.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AdminPwaPrompt() {
  const { show, dismiss: handleDismiss } = useInstallHint("admin_pwa_dismissed");
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") handleDismiss();
      setDeferredPrompt(null);
    } else {
      alert("Untuk memasang WebApp di ponsel: Buka menu browser (ikon titik tiga atau tombol Share di Safari/Chrome) lalu klik 'Tambahkan ke Layar Utama' (Add to Home Screen).");
    }
  };

  if (!show) return null;

  return (
    <div className="mb-4 rounded-md border border-brand/20 bg-green-50/90 p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-white">
            <QrCodeIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-gray-900">WebApp Panitia Scanner Siap Dipasang</p>
            <p className="text-[11px] text-gray-600">Pasang di ponsel untuk akses pemindaian barcode cepat di pos acara tanpa bilah browser.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs py-1"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Pasang WebApp</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xs px-1.5"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
