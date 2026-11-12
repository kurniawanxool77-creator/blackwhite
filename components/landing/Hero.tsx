import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { Site } from "@/lib/site";

export function Hero({ site }: { site: Site }) {
  return (
    // HP: hero promosi disembunyikan; kotak cari ada di daftar pelatihan di bawahnya.
    <section className="relative hidden overflow-hidden border-b border-gray-200 bg-white md:block">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className={site.heroImage ? "grid items-center gap-12 lg:grid-cols-12" : "max-w-3xl"}>
          {/* Sisi kiri: satu judul (h1) dan satu kalimat berisi kata kunci utama untuk mesin pencari. */}
          <div className={site.heroImage ? "lg:col-span-7" : ""}>
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

          {site.heroImage && (
            <div className="lg:col-span-5">
              <img
                src={site.heroImage}
                alt={site.name}
                className="aspect-[4/3] w-full rounded-md border border-gray-200 object-cover shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
