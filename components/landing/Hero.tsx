import Link from "next/link";
import { ArrowRightIcon, QrCodeIcon } from "@/components/ui/icons";
import type { Site } from "@/lib/site";

export function Hero({ site }: { site: Site }) {
  return (
    // HP: hero promosi disembunyikan; kotak cari ada di daftar pelatihan di bawahnya.
    <section className="relative hidden overflow-hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Sisi kiri: satu judul (h1) dan satu kalimat berisi kata kunci utama untuk mesin pencari. */}
          <div className="lg:col-span-7">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:leading-tight">
              {site.tagline || "Pelatihan bersertifikat dengan pendaftaran online dan absensi QR"}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Daftar pelatihan, seminar, dan workshop secara online di {site.name}. Dapatkan tiket QR, materi video, kuis, dan sertifikat resmi dalam satu akun.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/event" className="btn btn-primary shadow-sm">
                Lihat pelatihan
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Sisi Kanan: Visual Preview atau Hero Image */}
          <div className="lg:col-span-5">
            {site.heroImage ? (
              <img
                src={site.heroImage}
                alt={site.name}
                className="aspect-[4/3] w-full rounded-md border border-gray-200 object-cover shadow-sm"
              />
            ) : (
              <div className="card rounded-md border border-gray-200 bg-gray-50/60 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-xs font-bold text-white">
                      QR
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">E-Pass Peserta</p>
                      <p className="text-[11px] text-gray-500">Tiket Terverifikasi</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                    Aktif
                  </span>
                </div>

                <div className="my-5 flex flex-col items-center justify-center rounded border border-gray-200 bg-white p-5 text-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                    <QrCodeIcon className="h-24 w-24 text-gray-800" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">Ahmad Fauzi, S.Kom</p>
                  <p className="text-xs text-gray-500">PT Industri Mandiri Jaya</p>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-3 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Pos 1: Registrasi Ulang</span>
                    <span className="font-medium text-emerald-700">✓ Selesai (08:15)</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Pos 2: Seminar Utama</span>
                    <span className="font-medium text-brand">Berikutnya</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Pos 3: Konsumsi Siang</span>
                    <span>Menunggu</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
