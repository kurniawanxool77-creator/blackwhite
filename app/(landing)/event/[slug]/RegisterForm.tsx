"use client";

import { useActionState, useRef, useState } from "react";
import { FileField, RegistrationFields } from "@/components/landing/RegistrationFields";
import { fmtRupiah } from "@/lib/format";
import { hasOptions, parsePackage, type FormField } from "@/lib/registration-form";
import { NO_SHUTTLE_LABEL } from "@/lib/schedule";
import type { ShuttleOption } from "@/lib/shuttle";
import type { BankAccount } from "@/lib/site";
import { registerForEvent } from "./actions";

type Props = {
  eventId: string;
  phone: string;
  organization: string;
  price: number; // harga pelatihan (sudah didiskon); diganti harga paket bila formulir punya isian paket
  fields: FormField[];
  banks: BankAccount[];
  routes: ShuttleOption[]; // rute shuttle untuk isian tipe "shuttle"
};

type StepKey = "data" | "pilihan" | "bayar";
const noop = () => {};

// Pendaftaran bertahap: 1) Data diri → 2) Pilihan & paket (baju, shuttle, penginapan, ...) → 3) Ringkasan & pembayaran.
// Langkah berikutnya baru terbuka bila isian wajib di langkah ini lengkap; server tetap memeriksa ulang semuanya.
export function RegisterForm({ eventId, phone, organization, price, fields, banks, routes }: Props) {
  const [error, action, pending] = useActionState(registerForEvent.bind(null, eventId), null);
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ label: string; value: string }[]>([]);
  const [packagePrice, setPackagePrice] = useState<number | null>(null);

  const hasPackage = fields.some((f) => f.type === "package");
  const total = (hasPackage ? packagePrice : price) ?? 0;
  const isChoice = (f: FormField) => hasOptions(f.type) || f.type === "shuttle";
  const dataFields = fields.filter((f) => !isChoice(f) && f.type !== "checkbox");
  const choiceFields = fields.filter(isChoice);
  const agreeFields = fields.filter((f) => f.type === "checkbox");
  // Berbayar bila harga event > 0, atau (bila ada isian paket) salah satu paket berharga.
  const paid = hasPackage ? fields.some((f) => f.type === "package" && f.options.some((o) => parsePackage(o).price > 0)) : price > 0;
  const steps: { key: StepKey; title: string }[] = [
    { key: "data", title: "Data diri" },
    ...(choiceFields.length ? [{ key: "pilihan" as const, title: "Pilihan & paket" }] : []),
    { key: "bayar", title: paid ? "Pembayaran" : "Konfirmasi" },
  ];
  const current = steps[step].key;
  const last = step === steps.length - 1;

  // Periksa isian langkah aktif dengan validasi bawaan browser (required, tipe email/tel, dll.).
  function validate(): boolean {
    const box = form.current?.querySelector(`[data-step="${current}"]`);
    for (const el of box?.querySelectorAll<HTMLInputElement>("input, select, textarea") ?? []) {
      if (el.type === "hidden") {
        if (el.dataset.required === "true" && !el.value) {
          setStepError("Unggah foto yang wajib diisi terlebih dahulu.");
          return false;
        }
        continue;
      }
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    setStepError(null);
    return true;
  }

  // Ringkasan isian untuk diperiksa ulang sebelum membayar.
  function buildSummary() {
    const fd = new FormData(form.current!);
    const rows = [{ label: "Nomor WhatsApp", value: String(fd.get("phone") ?? "") }];
    for (const f of fields) {
      const v = String(fd.get(`f_${f.id}`) ?? "").trim();
      if (!v || f.type === "checkbox") continue;
      if (f.type === "file") rows.push({ label: f.label, value: "Foto terunggah" });
      else if (f.type === "shuttle") rows.push({ label: f.label, value: routes.find((r) => r.id === v)?.label ?? NO_SHUTTLE_LABEL });
      else if (f.type === "package") {
        const p = f.options.map(parsePackage).find((o) => o.name === v);
        rows.push({ label: f.label, value: p ? `${p.name} · ${p.price ? fmtRupiah(p.price) : "Gratis"}` : v });
      } else rows.push({ label: f.label, value: v });
    }
    setSummary(rows);
  }

  function next() {
    if (!validate()) return;
    if (steps[step + 1]?.key === "bayar") buildSummary();
    setStep((s) => s + 1);
    form.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  return (
    <form
      ref={form}
      action={action}
      // Enter di langkah awal = lanjut, bukan kirim pendaftaran.
      onSubmit={(e) => {
        if (!last) {
          e.preventDefault();
          next();
        }
      }}
      className="scroll-mt-24 space-y-4"
    >
      <ol className="flex items-center gap-2 text-xs" aria-label="Langkah pendaftaran">
        {steps.map((s, i) => (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1.5" aria-current={i === step ? "step" : undefined}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i < step ? "bg-brand text-white" : i === step ? "border-2 border-brand text-brand" : "border border-gray-300 text-gray-400"}`}>
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`truncate ${i === step ? "font-semibold text-gray-900" : "text-gray-500"}`}>{s.title}</span>
          </li>
        ))}
      </ol>

      {/* 1. Data diri */}
      <div data-step="data" className={current === "data" ? "space-y-4" : "hidden"}>
        <div>
          <label className="label" htmlFor="phone">Nomor WhatsApp<span className="text-red-600"> *</span></label>
          <input id="phone" name="phone" className="input" inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" required pattern="\+?[\d\s\-]{8,20}" title="Angka 8–20 digit, boleh diawali +" defaultValue={phone} />
        </div>
        {fields.length === 0 && (
          <div>
            <label className="label" htmlFor="organization">Instansi (opsional)</label>
            <input id="organization" name="organization" className="input" placeholder="Kosongkan jika perorangan" defaultValue={organization} />
          </div>
        )}
        <RegistrationFields fields={dataFields} onPackage={noop} />
      </div>

      {/* 2. Pilihan & paket: ukuran baju, shuttle, penginapan, paket harga, dll. */}
      {choiceFields.length > 0 && (
        <div data-step="pilihan" className={current === "pilihan" ? "space-y-4" : "hidden"}>
          <RegistrationFields fields={choiceFields} onPackage={setPackagePrice} routes={routes} />
        </div>
      )}

      {/* 3. Ringkasan, pembayaran, dan pernyataan */}
      <div data-step="bayar" className={current === "bayar" ? "space-y-4" : "hidden"}>
        <div className="rounded-md border border-gray-200">
          <p className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900">Periksa data Anda</p>
          <dl className="divide-y divide-gray-100 text-sm">
            {summary.map((r) => (
              <div key={r.label} className="flex justify-between gap-3 px-3 py-2">
                <dt className="text-gray-600">{r.label}</dt>
                <dd className="text-right font-medium break-words text-gray-900">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {total > 0 ? (
          <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3.5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-sm font-semibold text-gray-900">Total bayar</span>
              <span className="text-lg font-bold text-brand tabular-nums">{fmtRupiah(total)}</span>
            </div>
            {banks.length > 0 && (
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-gray-800">Transfer ke salah satu rekening:</p>
                {banks.map((b) => (
                  <p key={b.number} className="rounded border border-gray-200 bg-white px-2.5 py-1.5">
                    <span className="font-medium text-gray-900">{b.bank}</span> <span className="font-mono">{b.number}</span>
                    {b.holder && <span className="block text-xs text-gray-600">a.n {b.holder}</span>}
                  </p>
                ))}
              </div>
            )}
            <div>
              <p className="label">Bukti transfer<span className="text-red-600"> *</span></p>
              <FileField name="paymentProofUrl" label="Unggah bukti transfer" />
            </div>
            <div>
              <label className="label" htmlFor="paymentProof">No. referensi transfer</label>
              <input id="paymentProof" name="paymentProof" className="input" placeholder="Contoh: Mandiri ref 982183" />
              <p className="mt-1 text-xs text-gray-500">Wajib salah satu: unggah bukti transfer atau isi nomor referensi. Panitia memeriksa sebelum menyetujui.</p>
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-900">Pelatihan ini gratis. Kirim pendaftaran untuk menunggu persetujuan panitia.</p>
        )}

        <RegistrationFields fields={agreeFields} onPackage={noop} />
      </div>

      {(stepError || error) && <p className="rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{stepError ?? error}</p>}

      <div className="flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-secondary">
            Kembali
          </button>
        )}
        {last ? (
          <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
            {pending ? "Mengirim..." : "Kirim pendaftaran"}
          </button>
        ) : (
          <button type="button" onClick={next} className="btn btn-primary flex-1">
            Lanjut ke {steps[step + 1].title.toLowerCase()}
          </button>
        )}
      </div>
      <p className="text-center text-xs text-gray-500">Tiket terbit setelah disetujui panitia.</p>
    </form>
  );
}
