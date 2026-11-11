import { ContactForm } from "@/components/landing/ContactForm";
import { FaqAccordion, type FaqItem } from "@/components/landing/FaqAccordion";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { useAuth } from "@/src/lib/auth-client";

const FAQS: FaqItem[] = [
  {
    q: "Bagaimana cara mendaftar sebagai peserta kegiatan atau pelatihan?",
    a: "Anda cukup membuka halaman Pelatihan, memilih acara yang sedang dibuka, lalu klik tombol Masuk atau Daftar Akun untuk mengisi formulir pendaftaran online secara mandiri.",
  },
  {
    q: "Bagaimana mekanisme absensi dan pembagian fasilitas melalui barcode?",
    a: "Setelah pendaftaran disetujui oleh panitia, akun Anda otomatis menerbitkan kode QR resmi di halaman Tiket. Tunjukkan barcode tersebut saat tiba di lokasi atau ketika mengambil fasilitas di setiap pos checkpoint.",
  },
  {
    q: "Apakah saya bisa mengakses materi pembelajaran dan kuis secara online?",
    a: "Ya. Pelatihan tertentu menyediakan materi video/modul yang dapat diakses kapan saja melalui dasbor peserta, dilengkapi ujian kuis untuk memenuhi syarat kelulusan.",
  },
  {
    q: "Bagaimana cara mengunduh dan memverifikasi keaslian e-sertifikat?",
    a: "E-Sertifikat terbit otomatis begitu Anda memenuhi kehadiran minimum serta kelulusan kuis. Keaslian sertifikat dapat dicek langsung oleh publik menggunakan nomor sertifikat di portal verifikasi.",
  },
];

export function ContactPage() {
  const { site } = useAuth();
  const { contact, name } = site;
  const digits = contact.phone.replace(/\D/g, "");
  const waNum = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const waUrl = waNum ? `https://wa.me/${waNum}?text=${encodeURIComponent(`Halo admin ${name}, saya ingin bertanya mengenai pelatihan / acara.`)}` : null;
  const mapsUrl = contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-wider text-brand uppercase">Bantuan & Komunikasi</p>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-gray-900 md:text-3xl">Hubungi Kami</h1>
        <p className="mt-2 text-sm text-gray-600">
          Hubungi tim penyelenggara {name} apabila Anda membutuhkan informasi pendaftaran, administrasi peserta, atau kendala akses barcode kegiatan.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">Respon Cepat</span>
              <span className="text-xs text-gray-400">WhatsApp & Telepon</span>
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.phone || "Belum diatur"}</h2>
            <p className="mt-1 text-xs text-gray-500">
              Layanan chat langsung untuk pertanyaan cepat seputar verifikasi pendaftaran & barcode.
            </p>
          </div>
          {waUrl && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full text-xs">
                Chat WhatsApp Sekarang
              </a>
            </div>
          )}
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-brand">Sekretariat</span>
              <span className="text-xs text-gray-400">Email Resmi</span>
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.email || "Belum diatur"}</h2>
            <p className="mt-1 text-xs text-gray-500">
              Untuk pengiriman berkas, proposal in-house training, konfirmasi pembayaran, dan administrasi resmi.
            </p>
          </div>
          {contact.email && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a href={`mailto:${contact.email}`} className="btn btn-secondary w-full text-xs">
                Kirim Pesan Email
              </a>
            </div>
          )}
        </div>

        <div className="card flex flex-col justify-between p-5 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">Kantor / Lokasi</span>
              <MapPinIcon className="h-4 w-4 text-gray-400" />
            </div>
            <h2 className="mt-3 text-base font-bold text-gray-900">{contact.address || "Belum diatur"}</h2>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <ClockIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>Senin – Jumat, 08.30 – 17.00 WIB</span>
            </div>
          </div>
          {mapsUrl && (
            <div className="mt-5 border-t border-gray-100 pt-3">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full text-xs">
                Buka di Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm siteName={name} />
        </div>
        <div className="space-y-4 lg:col-span-5">
          <div className="card p-5">
            <div className="mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Pertanyaan yang Sering Diajukan</h2>
              <p className="mt-0.5 text-xs text-gray-500">Klik pada pertanyaan untuk membuka atau menutup penjelasan.</p>
            </div>
            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </div>
    </div>
  );
}

