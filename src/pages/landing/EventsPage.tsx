import { useSearchParams } from "react-router-dom";
import { EventBrowser } from "@/components/landing/EventBrowser";
import type { EventFilters, ReadyEvent } from "@/lib/event-filters";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type EventsPayload = {
  results: ReadyEvent[];
  categories: string[];
  locations: string[];
  total: number;
  filters: EventFilters;
};

export function EventsPage() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const state = useApiData<EventsPayload>(qs ? `/api/public/events?${qs}` : "/api/public/events");

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-10">
      <div className="mb-6">
        <p className="hidden text-xs font-semibold tracking-wider text-brand uppercase md:block">Katalog Lengkap</p>
        <h1 className="text-lg font-bold tracking-tight text-gray-900 md:mt-1 md:text-3xl">Pelatihan & Event</h1>
        <p className="mt-1 text-sm text-gray-600">Cari berdasarkan judul, kategori, lokasi, atau metode pelaksanaan.</p>
      </div>

      <DataGate state={state}>
        {({ results, categories, locations, total, filters }) => (
          <EventBrowser results={results} categories={categories} locations={locations} total={total} filters={filters} showFilters />
        )}
      </DataGate>
    </div>
  );
}

