"use client";

import { useRef, useState } from "react";
import { formatBankLine, splitBankLine, type BankAccount } from "@/lib/site-defaults";

const MAX_BANKS = 10;

type Row = { key: number } & BankAccount;

function toRows(lines: string[]): Row[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_BANKS)
    .map((l, i) => ({ key: i + 1, ...splitBankLine(l) }));
}

export function BankAccountsInput({
  defaultValue,
  showErrors = false,
}: {
  defaultValue: string[];
  showErrors?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(defaultValue));
  const nextKey = useRef(rows.length + 1);

  function add() {
    if (rows.length >= MAX_BANKS) return;
    setRows((prev) => [...prev, { key: nextKey.current++, bank: "", number: "", holder: "" }]);
  }

  function update(key: number, field: keyof BankAccount, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function remove(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const serialized = rows.map(formatBankLine).filter(Boolean).join("\n");

  return (
    <div className="space-y-3">
      <input type="hidden" name="banks" value={serialized} />
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-600">
          Belum ada rekening pembayaran. Klik <span className="font-medium text-gray-800">+ Tambah rekening</span> bila pendaftaran berbayar memakai transfer manual.
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row, idx) => {
            const hasAny = Boolean(row.bank.trim() || row.number.trim() || row.holder.trim());
            const badBank = showErrors && hasAny && !row.bank.trim();
            const badNumber = showErrors && hasAny && !row.number.trim();
            return (
              <div key={row.key} className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1.15fr_1.15fr_auto] sm:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`bank-name-${row.key}`}>
                      Nama bank
                    </label>
                    <input
                      id={`bank-name-${row.key}`}
                      className={`input ${badBank ? "border-red-500" : ""}`}
                      value={row.bank}
                      maxLength={60}
                      onChange={(e) => update(row.key, "bank", e.target.value)}
                      placeholder="Bank Mandiri"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`bank-number-${row.key}`}>
                      Nomor rekening
                    </label>
                    <input
                      id={`bank-number-${row.key}`}
                      className={`input font-mono ${badNumber ? "border-red-500" : ""}`}
                      value={row.number}
                      maxLength={60}
                      onChange={(e) => update(row.key, "number", e.target.value)}
                      placeholder="137-00-1928374-1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor={`bank-holder-${row.key}`}>
                      Atas nama
                    </label>
                    <input
                      id={`bank-holder-${row.key}`}
                      className="input"
                      value={row.holder}
                      maxLength={100}
                      onChange={(e) => update(row.key, "holder", e.target.value)}
                      placeholder="Panitia Penyelenggara"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm w-full sm:w-auto"
                    onClick={() => remove(row.key)}
                    aria-label={`Hapus rekening ${idx + 1}`}
                  >
                    Hapus
                  </button>
                </div>
                {(badBank || badNumber) && (
                  <p className="text-xs text-red-700">Nama bank dan nomor rekening wajib diisi untuk menyimpan baris ini.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button type="button" className="btn btn-secondary btn-sm" disabled={rows.length >= MAX_BANKS} onClick={add}>
          + Tambah rekening
        </button>
        <span className="text-xs text-gray-500 tabular-nums">{rows.length}/{MAX_BANKS} rekening</span>
      </div>
    </div>
  );
}

