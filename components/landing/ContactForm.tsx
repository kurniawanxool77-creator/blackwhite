"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@/components/ui/icons";

export function ContactForm({ siteName }: { siteName: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulasi respons cepat
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="card rounded-md border border-emerald-200 bg-emerald-50/50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-green-200 bg-green-50 text-brand">
          <CheckCircleIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-gray-900">Pesan Anda Berhasil Terkirim</h3>
        <p className="mt-1 text-xs text-gray-600">
          Terima kasih telah menghubungi {siteName}. Tim panitia kami akan segera membalas pertanyaan Anda melalui email atau WhatsApp.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="btn btn-secondary btn-sm mt-4 text-xs"
        >
          Kirim Pesan Lainnya
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-base font-bold text-gray-900">Kirim Pertanyaan / Pesan</h2>
        <p className="text-xs text-gray-500">
          Isi formulir di bawah ini dan tim sekretariat kami akan merespons dalam 1x24 jam kerja.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label text-xs">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="contoh: Budi Pratama"
            className="input text-xs"
          />
        </div>

        <div>
          <label htmlFor="email" className="label text-xs">
            Alamat Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="contoh: budi@instansi.co.id"
            className="input text-xs"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label text-xs">
            Nomor WhatsApp / HP
          </label>
          <input
            id="phone"
            name="phone"
            placeholder="contoh: 081234567890"
            className="input text-xs"
          />
        </div>

        <div>
          <label htmlFor="category" className="label text-xs">
            Kategori Keperluan <span className="text-red-500">*</span>
          </label>
          <select id="category" name="category" required className="input text-xs">
            <option value="pendaftaran">Pendaftaran Event / Acara</option>
            <option value="kendala-qr">Kendala QR Code / Presensi</option>
            <option value="pembayaran">Konfirmasi Pembayaran</option>
            <option value="kerjasama">Kerja Sama In-House Training</option>
            <option value="lainnya">Pertanyaan Lainnya</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="label text-xs">
          Isi Pesan / Pertanyaan <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="Tuliskan pertanyaan atau kendala yang Anda alami secara rinci..."
          className="input text-xs"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full text-xs sm:w-auto"
      >
        {loading ? "Mengirim Pesan..." : "Kirim Pesan Sekarang"}
      </button>
    </form>
  );
}
