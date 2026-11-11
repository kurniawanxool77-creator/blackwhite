import type { Metadata } from "next";
import { ContactForm } from "@/components/landing/ContactForm";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pusat Bantuan & Kontak",
  description: "Hubungi sekretariat dan panitia pelaksana kegiatan untuk informasi pendaftaran dan bantuan teknis.",
};

const FAQS = [
  {
    q: "Kapan QR Code presensi saya akan diterbitkan?",
    a: "Kode QR tiket resmi akan terbit secara otomatis di menu 'Tiket Saya' setelah panitia penyelenggara menyetujui pendaftaran Anda.",
  },
  {
    q: "Bagaimana jika ponsel saya mati atau barcode tidak bisa dipindai di pos?",
    a: "Jangan khawatir. Petugas panitia di setiap pos checkpoint memiliki fitur Check-in Manual untuk memverifikasi data Anda berdasarkan nama atau alamat email terdaftar.",
  },
  {
    q: "Apakah pendaftaran yang sudah diajukan dapat dibatalkan?",
    a: "Anda dapat membatalkan pendaftaran secara mandiri melalui halaman detail tiket selama statusnya masih berstatus 'Menunggu Persetujuan'.",
  },
  {
    q: "Berapa lama batas waktu respon panitia?",
    a: "Untuk pesan melalui WhatsApp dan telepon kami merespons secara langsung pada jam kerja (08.30 – 17.00 WIB). Pesan via email dibalas maksimal dalam 1x24 jam kerja.",
  },
];

export default async function ContactPage() {
  const { name, contact } = await getSite();

  const phoneClean = contact.phone.replace(/[^\d+]/g, "").replace(/^0/, "62");
  const waUrl = phoneClean
    ? `https://wa.me/${phoneClean.replace("+", "")}?text=Halo%20Admin%20${encodeURIComponent(
        name
      )}%2C%20saya%20ingin%20bertanya%20seputar%20pelatihan...`
    : null;

  const mapsUrl = contact.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-12">
      {/* 1. Judul & Header Halaman */}
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wider text-brand uppercase">Pusat Layanan & Bantuan</p>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-gray-900 md:text-3xl">
          Hubungi Kami
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tim panitia dan sekretariat {name} siap membantu kendala pendaftaran, informasi jadwal pelatihan, atau kerja sama instansi.
        </p>
      </div>

      {/* 2. Kartu Saluran Komunikasi Utama (3 Kolom) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* WhatsApp & Telepon */}
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Respon Cepat
              </span>
              <span className="text-xs text-gray-400">WhatsApp & Telepon</span>
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.phone || "Belum diatur"}</h2>
            <p className="mt-1 text-xs text-gray-500">
              Layanan chat langsung untuk pertanyaan cepat seputar verifikasi pendaftaran & barcode.
            </p>
          </div>
          {waUrl && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-xs"
              >
                Chat WhatsApp Sekarang
              </a>
            </div>
          )}
        </div>

        {/* Email Resmi */}
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-brand">
                Sekretariat
              </span>
              <span className="text-xs text-gray-400">Email Resmi</span>
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.email || "Belum diatur"}</h2>
            <p className="mt-1 text-xs text-gray-500">
              Untuk pengiriman berkas, proposal in-house training, konfirmasi pembayaran, dan administrasi resmi.
            </p>
          </div>
          {contact.email && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a
                href={`mailto:${contact.email}`}
                className="btn btn-secondary w-full text-xs"
              >
                Kirim Pesan Email
              </a>
            </div>
          )}
        </div>

        {/* Alamat Kantor & Jam Operasional */}
        <div className="card flex flex-col justify-between p-5 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                Kantor / Lokasi
              </span>
              <MapPinIcon className="h-4 w-4 text-gray-400" />
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.address || "Belum diatur"}</h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <ClockIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Senin – Jumat, 08.30 – 17.00 WIB</span>
            </div>
          </div>
          {mapsUrl && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full text-xs"
              >
                Buka di Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 3. Grid Dua Kolom: Formulir Kirim Pesan & FAQ */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm siteName={name} />
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className="card p-5">
            <div className="mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Pertanyaan yang Sering Diajukan</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Klik pada pertanyaan untuk membuka atau menutup penjelasan.
              </p>
            </div>

            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </div>
    </div>
  );
}
