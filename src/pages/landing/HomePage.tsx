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

const HOME_LIMIT = 6;

export function HomePage() {
  const state = useApiData<HomePayload>("/api/public/home");

  return (
    <DataGate state={state}>
      {({ site, banners, articles, results, categories, locations, total }) => (
        <>
          <Hero site={site} />

          {banners.length > 0 && (
            <section className="border-b border-gray-200 bg-white">
              <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
                <BannerCarousel banners={banners} />
              </div>
            </section>
          )}

          <section id="event" className="scroll-mt-16 border-b border-gray-200 bg-white py-6 md:py-14">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="hidden text-xs font-semibold tracking-wider text-brand uppercase md:block">Pendaftaran Terbuka</p>
                  <h2 className="text-base font-bold tracking-tight text-gray-900 md:mt-1 md:text-3xl">
                    Pelatihan & Event Tersedia
                  </h2>
                  <p className="mt-1 hidden text-sm text-gray-600 md:block">
                    Pilih program pelatihan, lakukan pendaftaran, dan dapatkan QR e-pass resmi Anda.
                  </p>
                </div>
                <Link to="/event" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                  <span className="md:hidden">Semua</span>
                  <span className="hidden md:inline">Lihat semua agenda</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-4 md:mt-8">
                <EventBrowser results={results} categories={categories} locations={locations} total={total} limit={HOME_LIMIT} />
              </div>
            </div>
          </section>

          <div className="hidden md:block">
            <Features />

            {site.steps.length > 0 && (
              <section className="border-b border-gray-200 bg-gray-50/60 py-14">
                <div className="mx-auto max-w-6xl px-4">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold tracking-wider text-brand uppercase">Alur Presensi</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      Bagaimana Sistem Bekerja untuk Anda
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Langkah mudah dari tahap pendaftaran hingga penyelesaian seluruh checkpoint kegiatan.
                    </p>
                  </div>
                  <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {site.steps.map((step, i) => (
                      <li key={step} className="card relative flex flex-col p-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-xs font-bold text-white">
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

