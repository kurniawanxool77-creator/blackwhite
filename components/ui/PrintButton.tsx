"use client";

import { PrinterIcon } from "./icons";

export function PrintButton({ label = "Cetak / simpan PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary print:hidden">
      <PrinterIcon width={18} height={18} />
      {label}
    </button>
  );
}
