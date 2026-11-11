"use client";

import { useRef, useState } from "react";
import { shrink } from "@/components/admin/ImageUpload";
import { fmtRupiah } from "@/lib/format";
import { parsePackage, type FormField } from "@/lib/registration-form";
import { NO_SHUTTLE, NO_SHUTTLE_LABEL } from "@/lib/schedule";
import type { ShuttleOption } from "@/lib/shuttle";

const Req = () => <span className="text-red-600"> *</span>;

// Foto diunggah saat dipilih; formulir hanya mengirim URL-nya (input tersembunyi).
// data-required: dicek saat pindah langkah pendaftaran (input tersembunyi tidak bisa memakai atribut required).
export function FileField({ name, required, label = "Pilih foto" }: { name: string; required?: boolean; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", await shrink(file, 1600), "foto.webp");
      const res = await fetch("/api/upload/form", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Gagal mengunggah foto.");
      setUrl(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} data-required={required ? "true" : undefined} />
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex items-center gap-3">
        {url && (
          <img src={url} alt="" className="h-14 w-14 rounded-md border border-gray-200 object-cover" />
        )}
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Mengunggah..." : url ? "Ganti foto" : label}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

// Isian formulir pendaftaran yang disusun Superadmin. onPackage: harga paket yang dipilih (untuk total biaya).
// routes: rute shuttle event untuk isian tipe "shuttle" (rute penuh tidak bisa dipilih).
export function RegistrationFields({ fields, onPackage, routes = [] }: { fields: FormField[]; onPackage: (price: number) => void; routes?: ShuttleOption[] }) {
  return fields.map((f) => {
    const name = `f_${f.id}`;
    const hint = f.hint && <p className="mt-1 text-xs text-gray-500">{f.hint}</p>;

    if (f.type === "shuttle") {
      const card = "flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 has-checked:border-brand has-checked:bg-green-50/60 has-disabled:cursor-not-allowed has-disabled:opacity-60";
      return (
        <fieldset key={f.id}>
          <legend className="label">{f.label}{f.required && <Req />}</legend>
          <div className="space-y-2">
            {routes.map((r) => (
              <label key={r.id} className={card}>
                <input type="radio" name={name} value={r.id} required={f.required} disabled={r.seatsLeft === 0} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
                <span className="min-w-0 text-sm">
                  <span className="block font-medium text-gray-900">{r.origin} → {r.destination}</span>
                  <span className="block text-xs font-medium text-brand">{r.depart}</span>
                  {r.note && <span className="block text-xs text-gray-600">{r.note}</span>}
                  <span className={`block text-xs ${r.seatsLeft === 0 ? "font-semibold text-red-700" : "text-gray-500"}`}>
                    {r.seatsLeft == null ? "Kursi tersedia" : r.seatsLeft === 0 ? "Penuh" : `Sisa ${r.seatsLeft} kursi`}
                  </span>
                </span>
              </label>
            ))}
            <label className={card}>
              <input type="radio" name={name} value={NO_SHUTTLE} required={f.required} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
              <span className="text-sm font-medium text-gray-900">{NO_SHUTTLE_LABEL}</span>
            </label>
          </div>
          {hint}
        </fieldset>
      );
    }

    if (f.type === "checkbox") {
      return (
        <label key={f.id} className="flex items-start gap-2.5 text-sm text-gray-800">
          <input type="checkbox" name={name} required={f.required} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
          <span>{f.label}{f.required && <Req />}</span>
        </label>
      );
    }

    if (f.type === "radio" || f.type === "package") {
      return (
        <fieldset key={f.id}>
          <legend className="label">{f.label}{f.required && <Req />}</legend>
          <div className="space-y-2">
            {f.options.map((o) => {
              const p = f.type === "package" ? parsePackage(o) : { name: o, price: 0, note: "" };
              return (
                <label key={o} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 has-checked:border-brand has-checked:bg-green-50/60">
                  <input
                    type="radio"
                    name={name}
                    value={p.name}
                    required={f.required}
                    onChange={() => f.type === "package" && onPackage(p.price)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium text-gray-900">{p.name}</span>
                    {p.note && <span className="block text-xs text-gray-600">{p.note}</span>}
                    {f.type === "package" && <span className="block font-semibold text-brand">{p.price ? fmtRupiah(p.price) : "Gratis"}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          {hint}
        </fieldset>
      );
    }

    const common = { id: name, name, required: f.required, className: "input" };
    return (
      <div key={f.id}>
        <label className="label" htmlFor={name}>{f.label}{f.required && <Req />}</label>
        {f.type === "file" ? (
          <FileField name={name} required={f.required} />
        ) : f.type === "textarea" ? (
          <textarea {...common} rows={3} />
        ) : f.type === "select" ? (
          <select {...common} defaultValue="">
            <option value="" disabled>Pilih...</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            {...common}
            type={f.type === "number" ? "text" : f.type}
            inputMode={f.type === "number" ? "numeric" : f.type === "tel" ? "tel" : undefined}
            autoComplete={f.type === "tel" ? "tel" : f.type === "email" ? "email" : "off"}
          />
        )}
        {hint}
      </div>
    );
  });
}
