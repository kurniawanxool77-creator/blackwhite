"use client";

import { QrCodeIcon } from "./icons";
import { useInstallHint } from "./useInstallHint";

export function PwaInstallPrompt() {
  const { show, dismiss: handleDismiss } = useInstallHint("pwa_prompt_dismissed");

  if (!show) return null;

  return (
    <div className="mx-auto mb-4 max-w-5xl px-4 md:hidden">
      <div className="flex items-center justify-between gap-3 rounded-md border border-brand/20 bg-green-50/80 px-3.5 py-2.5 text-xs text-brand">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-brand text-white">
            <QrCodeIcon className="h-4 w-4" />
          </div>
          <p className="truncate text-[11px] leading-tight">
            <strong>Pasang Aplikasi:</strong> Buka menu browser lalu pilih <em>Tambahkan ke Layar Utama</em> untuk akses QR instan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-800"
          aria-label="Tutup petunjuk"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
