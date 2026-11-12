"use client";

import { useState } from "react";
import { fmtNum } from "@/lib/format";
import { NumInput } from "./EventFormParts";
import {
  FIELD_GROUPS,
  FIELD_TYPES,
  hasOptions,
  parsePackage,
  type FieldGroup,
  type FieldType,
  type FormField,
} from "@/lib/registration-form";

type Props = {
  field: FormField;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<FormField>) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

const stripPipe = (s: string) => s.replace(/\|/g, " ").trimStart();

function OptionListEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addDraft = () => {
    const items = draft
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return;
    const merged = [...options];
    for (const item of items) {
      if (!merged.some((o) => o.toLowerCase() === item.toLowerCase())) merged.push(item);
    }
    onChange(merged);
    setDraft("");
  };

  const move = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= options.length) return;
    const copy = [...options];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-700">
          Daftar pilihan jawaban ({fmtNum(options.filter((o) => o.trim()).length)})
        </p>
        <p className="text-xs text-gray-500">Ubah nama pilihan, atur urutan, atau tambah baru di bawah.</p>
      </div>

      {options.length > 0 ? (
        <div className="space-y-1.5">
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                {idx + 1}
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => onChange(options.map((v, j) => (j === idx ? e.target.value : v)))}
                placeholder={`Pilihan ${idx + 1}`}
                className="input py-1.5 text-sm flex-1"
              />
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="btn btn-secondary btn-sm px-2" aria-label="Naikkan pilihan">↑</button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === options.length - 1} className="btn btn-secondary btn-sm px-2" aria-label="Turunkan pilihan">↓</button>
              <button
                type="button"
                onClick={() => onChange(options.filter((_, j) => j !== idx))}
                className="btn btn-secondary btn-sm px-2 text-red-700 hover:bg-red-50"
                aria-label="Hapus pilihan"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Belum ada pilihan. Ketik pilihan pertama di bawah lalu tekan Enter atau klik Tambah.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Tambah pilihan baru, mis. Gravel / E-Bike"
          className="input flex-1 min-w-48 py-1.5 text-sm"
        />
        <button type="button" onClick={addDraft} className="btn btn-secondary btn-sm">
          + Tambah pilihan
        </button>
      </div>
    </div>
  );
}

function PackageListEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  const formatPkg = (name: string, price: number, note: string) =>
    `${stripPipe(name)} | ${Math.max(0, price)} | ${stripPipe(note)}`;

  const updateRow = (idx: number, patch: Partial<{ name: string; price: number; note: string }>) => {
    const curr = parsePackage(options[idx] ?? "");
    const next = { ...curr, ...patch };
    onChange(options.map((v, j) => (j === idx ? formatPkg(next.name, next.price, next.note) : v)));
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-700">Daftar paket & harga</p>
        <button
          type="button"
          onClick={() => onChange([...options, "Paket baru | 0 | "])}
          className="btn btn-secondary btn-sm"
        >
          + Tambah paket
        </button>
      </div>
      {options.length === 0 ? (
        <p className="rounded border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Belum ada paket. Klik + Tambah paket untuk membuat pilihan berbayar/varian.
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const pkg = parsePackage(opt);
            return (
              <div key={idx} className="grid gap-2 rounded border border-gray-200 bg-gray-50 p-2 sm:grid-cols-[1.2fr_140px_1.3fr_auto] sm:items-center">
                <input
                  type="text"
                  value={pkg.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="Nama paket"
                  className="input bg-white py-1.5 text-sm"
                />
                <NumInput
                  value={pkg.price ? fmtNum(pkg.price) : ""}
                  onChange={(v) => updateRow(idx, { price: Number(v.replace(/\D/g, "")) || 0 })}
                  placeholder="Harga Rp (0 = gratis)"
                  className="input bg-white py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={pkg.note}
                  onChange={(e) => updateRow(idx, { note: e.target.value })}
                  placeholder="Keterangan singkat (opsional)"
                  className="input bg-white py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onChange(options.filter((_, j) => j !== idx))}
                  className="btn btn-secondary btn-sm px-2 text-red-700 hover:bg-red-50"
                  aria-label="Hapus paket"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FormFieldEditor({
  field,
  index,
  total,
  expanded,
  onToggle,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const withOptions = hasOptions(field.type);
  const nonEmptyOptions = field.options.filter((o) => o.trim()).length;

  return (
    <div className={`rounded-md border bg-white transition ${expanded ? "border-brand/50 shadow-xs" : "border-gray-200"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 min-w-52 items-center gap-2 text-left"
        >
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-gray-200 bg-gray-50 px-1.5 text-xs font-semibold text-gray-700">
            #{index + 1}
          </span>
          <span className={`font-medium text-sm ${field.label.trim() ? "text-gray-900" : "italic text-gray-400"}`}>
            {field.label.trim() || "Isian baru tanpa judul"}
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {FIELD_TYPES[field.type]}
          </span>
          <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-800">
            {FIELD_GROUPS[field.group]}
          </span>
          {withOptions && (
            <span className={`rounded px-2 py-0.5 text-xs ${nonEmptyOptions > 0 ? "bg-gray-100 text-gray-700" : "bg-amber-50 text-amber-800"}`}>
              {nonEmptyOptions > 0 ? `${nonEmptyOptions} pilihan` : "Belum ada pilihan"}
            </span>
          )}
          {field.required && <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Wajib</span>}
        </button>

        <div className="flex items-center gap-1">
          <button type="button" onClick={onToggle} className="btn btn-secondary btn-sm">
            {expanded ? "Tutup" : "Atur"}
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="btn btn-secondary btn-sm px-2" aria-label="Naikkan">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="btn btn-secondary btn-sm px-2" aria-label="Turunkan">↓</button>
          <button type="button" onClick={onRemove} className="btn btn-secondary btn-sm text-red-700 hover:bg-red-50">Hapus</button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-3.5 space-y-3.5">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <label className="label text-xs">Judul pertanyaan / isian</label>
              <input
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="Mis. Kategori sepeda, Ukuran jersey, Riwayat alergi"
                className="input bg-white"
              />
            </div>
            <div>
              <label className="label text-xs">Tipe isian</label>
              <select
                value={field.type}
                onChange={(e) => {
                  const nextType = e.target.value as FieldType;
                  onChange({
                    type: nextType,
                    options:
                      nextType === "package" && field.options.length === 0
                        ? ["Paket reguler | 0 | Standar"]
                        : hasOptions(nextType)
                          ? field.options
                          : [],
                  });
                }}
                className="input bg-white"
              >
                {Object.entries(FIELD_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {field.type === "package" && (
            <PackageListEditor
              options={field.options}
              onChange={(options) => onChange({ options })}
            />
          )}

          {(field.type === "select" || field.type === "radio") && (
            <OptionListEditor
              options={field.options}
              onChange={(options) => onChange({ options })}
            />
          )}

          <div>
            <label className="label text-xs">Keterangan kecil di bawah isian (opsional)</label>
            <input
              value={field.hint}
              onChange={(e) => onChange({ hint: e.target.value })}
              placeholder="Contoh: Pilih sesuai sepeda yang dibawa saat hari-H"
              className="input bg-white text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
              <span className="block text-xs font-medium text-gray-600 mb-1.5">Kelompok data di daftar peserta</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kelompok data">
                {Object.entries(FIELD_GROUPS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={field.group === k}
                    onClick={() => onChange({ group: k as FieldGroup })}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                      field.group === k
                        ? "border-brand bg-green-50 text-brand"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onChange({ required: e.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Wajib diisi peserta
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

