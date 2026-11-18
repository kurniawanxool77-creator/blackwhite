import { useSearchParams } from "react-router-dom";
import { EventBrowser } from "@/components/landing/EventBrowser";
import type { EventFilters, ReadyEvent } from "@/lib/event-filters";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useSeo } from "@/src/lib/use-seo";

type EventsPayload = {
  results: ReadyEvent[];
  categories: string[];
  locations: string[];
  total: number;
  filters: EventFilters;
};

export function EventsPage() {
  useSeo({
    title: "Daftar Event & Tiket Barcode Online",
    description: "Jelajahi dan daftar berbagai event, seminar, olahraga, dan pelatihan terkini di BlackWhite Event. Dapatkan tiket resmi dengan kode QR unik.",
    url: "/event",
  });
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const state = useApiData<EventsPayload>(qs ? `/api/public/events?${qs}` : "/api/public/events");

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-10">
      <h1 className="text-lg font-bold tracking-tight text-gray-900 md:text-3xl">Event</h1>
      <p className="mt-0.5 mb-4 text-sm text-gray-600 md:mb-6">Event & acara yang sedang membuka pendaftaran.</p>

      <DataGate state={state}>
        {({ results, categories, locations, total, filters }) => (
          <EventBrowser results={results} categories={categories} locations={locations} total={total} filters={filters} showFilters />
        )}
      </DataGate>
    </div>
  );
}

