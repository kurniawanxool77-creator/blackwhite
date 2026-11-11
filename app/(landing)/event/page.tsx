import type { Metadata } from "next";
import { EventBrowser } from "@/components/landing/EventBrowser";
import { findReadyEvents, queryParam } from "@/lib/event-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pelatihan" };

export default async function EventsPage({ searchParams }: PageProps<"/event">) {
  const sp = await searchParams;
  const q = queryParam(sp.q);
  const filters = {
    q,
    kategori: queryParam(sp.kategori),
    lokasi: queryParam(sp.lokasi),
    mode: ["offline", "online", "hybrid"].includes(queryParam(sp.mode) ?? "") ? queryParam(sp.mode) : undefined,
    harga: ["gratis", "berbayar"].includes(queryParam(sp.harga) ?? "") ? queryParam(sp.harga) : undefined,
    urut: queryParam(sp.urut) === "harga" ? "harga" : "tanggal",
  };
  const ready = await findReadyEvents(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-10">
      <h1 className="text-lg font-bold tracking-tight text-gray-900 md:text-3xl">Pelatihan</h1>
      <p className="mt-0.5 mb-4 text-sm text-gray-600 md:mb-6">Yang sedang membuka pendaftaran.</p>
      <EventBrowser results={ready.results} categories={ready.categories} locations={ready.locations} total={ready.total} filters={filters} showFilters />
    </div>
  );
}
