import { Link } from "react-router-dom";
import type { Article, Banner } from "@prisma/client";
import { About } from "@/components/landing/About";
import { EventBrowser } from "@/components/landing/EventBrowser";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Services } from "@/components/landing/Services";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { BannerCarousel } from "@/components/ui/BannerCarousel";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { ReadyEvent } from "@/lib/event-filters";
import type { Site } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type HomePayload = {
  site: Site;
  banners: Banner[];
  articles: Article[];
  results: ReadyEvent[];
  categories: string[];
  locations: string[];
  total: number;
};

export function HomePage() {
  const state = useApiData<HomePayload>("/api/public/home");

  return (
    <DataGate state={state}>
      {({ site, banners, articles, results, categories, locations, total }) => (
        <>
          <Hero site={site} />

          {banners.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-8">
              <BannerCarousel banners={banners} />
            </section>
          )}

          <div className="hidden md:block">
            <Features />
          </div>

          <section id="acara" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-6 md:py-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="hidden text-xs font-semibold tracking-wider text-brand uppercase md:block">Katalog Pelatihan</p>
                <h2 className="text-base font-bold tracking-tight text-gray-900 md:mt-1 md:text-3xl">Pelatihan & Event Terbuka</h2>
                <p className="mt-1 hidden text-sm text-gray-600 md:block">
                  Pilih pelatihan yang sedang membuka pendaftaran online atau gunakan pencarian.
                </p>
              </div>
              <Link to="/event" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                <span className="md:hidden">Semua</span>
                <span className="hidden md:inline">Semua pelatihan</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 md:mt-6">
              <EventBrowser results={results} categories={categories} locations={locations} total={total} limit={3} />
            </div>
          </section>

          <div className="hidden md:block">
            {site.steps.length > 0 && (
              <section className="border-t border-gray-200 bg-gray-50/70 py-14">
                <div className="mx-auto max-w-6xl px-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold tracking-wider text-brand uppercase">Alur Peserta</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Cara Mengikuti Kegiatan</h2>
                    <p className="mt-2 text-sm text-gray-600">Proses mudah mulai dari pendaftaran akun hingga mendapatkan sertifikat resmi.</p>
                  </div>
                  <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {site.steps.map((step, i) => (
                      <li key={i} className="card p-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded border border-brand/20 bg-green-50 text-xs font-bold text-brand">
                          0{i + 1}
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-gray-900">Tahap {i + 1}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            <Services services={site.services} />
            <About site={site} />
          </div>

          {articles.length > 0 && (
            <section id="blog" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-6 md:py-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="hidden text-xs font-semibold tracking-wider text-brand uppercase md:block">Informasi & Wawasan</p>
                  <h2 className="text-base font-bold tracking-tight text-gray-900 md:mt-1 md:text-3xl">Blog & Berita Acara</h2>
                  <p className="mt-1 hidden text-sm text-gray-600 md:block">Kabar terbaru, dokumentasi, dan panduan seputar kegiatan.</p>
                </div>
                <Link to="/blog" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                  <span className="md:hidden">Semua</span>
                  <span className="hidden md:inline">Semua artikel</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:mt-8 md:gap-5 lg:grid-cols-3">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}

          <nav aria-label="Info perusahaan" className="flex justify-center gap-5 px-4 pb-6 text-sm text-gray-600 md:hidden">
            <Link to="/tentang" className="py-2 hover:text-gray-900">Tentang</Link>
            <Link to="/blog" className="py-2 hover:text-gray-900">Artikel</Link>
            <Link to="/kontak" className="py-2 hover:text-gray-900">Kontak</Link>
          </nav>
        </>
      )}
    </DataGate>
  );
}

