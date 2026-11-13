"use client";

import { useState, type SubmitEvent } from "react";
import { splitBankLine } from "@/lib/site-defaults";
import type { Site } from "@/lib/site";
import { saveSite } from "@/src/lib/actions/superadmin";
import { BankAccountsInput } from "./BankAccountsInput";
import { ImageUpload } from "./ImageUpload";

function Field({ label, name, value, rows }: { label: string; name: string; value: string; rows?: number }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {rows ? (
        <textarea id={name} name={name} rows={rows} defaultValue={value} className="input" />
      ) : (
        <input id={name} name={name} defaultValue={value} className="input" />
      )}
    </div>
  );
}

export function SiteForm({ site }: { site: Site }) {
  const [pending, setPending] = useState(false);
  const [showBankErrors, setShowBankErrors] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bankRows = String(formData.get("banks") ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map(splitBankLine);
    if (bankRows.some((b) => !b.bank || !b.number)) {
      setShowBankErrors(true);
      setStatus({ ok: false, text: "Lengkapi nama bank dan nomor rekening untuk setiap baris yang diisi." });
      return;
    }
    setShowBankErrors(false);
    setPending(true);
    setStatus(null);
    try {
      const msg = await saveSite(null, formData);
      setStatus({ ok: true, text: msg ?? "Tersimpan. Halaman depan sudah diperbarui." });
    } catch (err) {
      setStatus({ ok: false, text: err instanceof Error ? err.message : "Gagal menyimpan perubahan." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {status && (
        <div className={`rounded-md border p-3.5 text-sm font-medium ${status.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {status.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="text-xs text-gray-600">Setelah memilih gambar atau mengubah teks, klik simpan agar langsung aktif di website.</span>
        <button type="submit" className="btn btn-primary btn-sm shrink-0" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold text-gray-900">Identitas & hero</h2>
        <Field label="Nama perusahaan / brand" name="name" value={site.name} />
        <Field label="Judul hero" name="tagline" value={site.tagline} rows={2} />
        <ImageUpload name="heroImage" label="Foto hero (tampil di samping judul)" hint="Disarankan 4:3." defaultValue={site.heroImage} maxWidth={1400} />
        <Field label="Tentang perusahaan" name="about" value={site.about} rows={4} />
        <ImageUpload name="aboutImage" label="Foto bagian Tentang kami" hint="Disarankan 4:3." defaultValue={site.aboutImage} maxWidth={1400} />
        <ImageUpload name="loginImage" label="Foto halaman Masuk / Daftar" hint="Tampil di separuh kanan layar (potret atau persegi lebih cocok). Kosong = memakai foto hero." defaultValue={site.loginImage} maxWidth={1400} />
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold text-gray-900">Layanan (maks. 3, kosongkan judul untuk menyembunyikan)</h2>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 border-t border-gray-100 pt-4 first:border-0 first:pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={`Layanan ${i + 1}`} name={`service${i}Title`} value={site.services[i]?.title ?? ""} />
              <div className="sm:col-span-2">
                <Field label="Keterangan" name={`service${i}Body`} value={site.services[i]?.body ?? ""} />
              </div>
            </div>
            <ImageUpload name={`service${i}Image`} label="Foto layanan" hint="Disarankan 16:10." defaultValue={site.services[i]?.image} maxWidth={900} />
          </div>
        ))}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold text-gray-900">Cara kerja untuk peserta</h2>
        <Field label="Satu langkah per baris" name="steps" value={site.steps.join("\n")} rows={4} />
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-3">
        <h2 className="font-semibold text-gray-900 sm:col-span-3">Kontak</h2>
        <Field label="Email" name="email" value={site.contact.email} />
        <Field label="Telepon" name="phone" value={site.contact.phone} />
        <Field label="Alamat" name="address" value={site.contact.address} />
      </section>

      <section className="card space-y-3 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">Rekening pembayaran</h2>
          <p className="mt-0.5 text-sm text-gray-600">Tampil di langkah Pembayaran saat peserta mendaftar dan di halaman tiket.</p>
        </div>
        <BankAccountsInput defaultValue={site.banks} showErrors={showBankErrors} />
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {status && <p className={`text-sm ${status.ok ? "text-green-700" : "text-red-700"}`}>{status.text}</p>}
        <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}
