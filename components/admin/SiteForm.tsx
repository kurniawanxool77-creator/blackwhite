"use client";

import { useActionState } from "react";
import type { Site } from "@/lib/site";
import { saveSite } from "@/src/lib/actions/superadmin";
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
  const [message, action, pending] = useActionState(saveSite, null);

  return (
    <form action={action} className="mt-6 space-y-6">
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

      <section className="card space-y-2 p-5">
        <h2 className="font-semibold text-gray-900">Rekening pembayaran</h2>
        <p className="text-sm text-gray-600">Tampil di langkah Pembayaran saat peserta mendaftar dan di halaman tiket. Satu rekening per baris: <span className="font-mono text-xs">Bank | Nomor rekening | Atas nama</span></p>
        <textarea name="banks" rows={3} className="input font-mono text-sm" defaultValue={site.banks.join("\n")} placeholder="Bank Mandiri | 137-00-1928374-1 | Panitia Penyelenggara" aria-label="Rekening pembayaran" />
      </section>

      <div className="flex items-center justify-end gap-3">
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}
