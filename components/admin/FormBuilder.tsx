"use client";

import { useActionState, useState } from "react";
import { EVENT_FORM_TEMPLATE, FIELD_PRESETS } from "@/lib/event-types";
import { FIELD_GROUPS, FIELD_TYPES, hasOptions, newFieldId, SAMPLE_FIELDS, type FieldGroup, type FieldType, type FormField } from "@/lib/registration-form";

type Action = (prev: string | null, f: FormData) => Promise<string | null>;

// Superadmin menyusun isian formulir pendaftaran per pelatihan: judul, tipe, pilihan, wajib/tidak, urutan.
export function FormBuilder({ action, defaultValue }: { action: Action; defaultValue: FormField[] }) {
  const [message, formAction, pending] = useActionState(action, null);
  const [fields, setFields] = useState(defaultValue);
  const update = (i: number, patch: Partial<FormField>) => setFields((fs) => fs.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) =>
    setFields((fs) => {
      const next = [...fs];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const add = () => setFields((fs) => [...fs, { id: newFieldId(), label: "", type: "text", group: "umum", required: false, options: [], hint: "" }]);
  const addMany = (list: Omit<FormField, "id">[]) => setFields((fs) => [...fs, ...list.map((f) => ({ ...f, options: [...f.options], id: newFieldId() }))]);

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <p className="text-sm text-gray-600">
        Nama, email, dan No. WhatsApp otomatis ditanyakan. Kelompok Kesehatan dan Barang bawaan tampil sebagai tanda khusus di daftar peserta panitia.
      </p>
      <input type="hidden" name="formFields" value={JSON.stringify(fields)} />

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-600">Belum ada isian tambahan. Peserta cukup daftar cepat.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => addMany(EVENT_FORM_TEMPLATE)}>
              Pakai formulir event (baju, shuttle, penginapan)
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addMany(SAMPLE_FIELDS)}>
              Pakai contoh formulir lengkap
            </button>
          </div>
        </div>
      ) : (
        <ol className="space-y-2">
          {fields.map((f, i) => (
            <li key={f.id} className="rounded-md border border-gray-200 bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <span className="w-6 shrink-0 text-center text-xs font-semibold text-gray-500 tabular-nums">{i + 1}</span>
                <input
                  className="input min-w-0 flex-1 basis-40"
                  value={f.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Judul isian, mis. Tanggal lahir"
                  aria-label={`Judul isian ${i + 1}`}
                />
                <select className="input basis-full sm:w-44 sm:basis-auto sm:shrink-0" value={f.type} onChange={(e) => update(i, { type: e.target.value as FieldType })} aria-label={`Tipe isian ${i + 1}`}>
                  {Object.entries(FIELD_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="mt-2 space-y-2 pl-8">
                {f.type === "shuttle" && (
                  <p className="rounded border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-600">
                    Pilihan rute diambil dari bagian <strong>Shuttle</strong> di halaman event (dari, ke, jadwal, kapasitas). Peserta juga bisa memilih &quot;Tidak menggunakan shuttle&quot;.
                  </p>
                )}
                {hasOptions(f.type) && (
                  <textarea
                    className="input"
                    rows={Math.max(3, f.options.length)}
                    value={f.options.join("\n")}
                    onChange={(e) => update(i, { options: e.target.value.split("\n") })}
                    placeholder={f.type === "package" ? "Satu paket per baris: Nama | harga | keterangan\nReguler | 550.000 | Hanya pelatihan" : "Satu pilihan per baris"}
                    aria-label={`Pilihan isian ${i + 1}`}
                  />
                )}
                <input
                  className="input"
                  value={f.hint}
                  onChange={(e) => update(i, { hint: e.target.value })}
                  placeholder="Keterangan kecil di bawah isian (opsional)"
                  aria-label={`Keterangan isian ${i + 1}`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="input w-auto"
                    value={f.group}
                    onChange={(e) => update(i, { group: e.target.value as FieldGroup })}
                    aria-label={`Kelompok isian ${i + 1}`}
                    title="Kelompok: menentukan di bagian mana jawaban tampil untuk panitia"
                  >
                    {Object.entries(FIELD_GROUPS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={f.required} onChange={(e) => update(i, { required: e.target.checked })} className="h-4 w-4 accent-brand" />
                    Wajib diisi
                  </label>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">↑</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="Turunkan">↓</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}>Hapus</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-semibold text-gray-700">Tambah cepat</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FIELD_PRESETS.map((p) => (
            <button key={p.label} type="button" className="btn btn-secondary btn-sm" onClick={() => addMany(p.fields)}>+ {p.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-secondary" onClick={add}>+ Tambah isian kosong</button>
        <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan formulir"}</button>
        {message && <p className={`text-sm ${message === "Tersimpan." ? "text-green-700" : "text-red-700"}`}>{message}</p>}
      </div>
      <p className="text-xs text-gray-500">Isian tanpa judul, atau pilihan tanpa opsi, tidak disimpan. Mengubah formulir tidak mengubah jawaban peserta yang sudah mendaftar.</p>
    </form>
  );
}
