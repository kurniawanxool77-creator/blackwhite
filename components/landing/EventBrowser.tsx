import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import { PRICE_FILTERS, SORTS, type EventFilters, type ReadyEvent } from "@/lib/event-search";
import { EVENT_MODE } from "@/lib/format";
import { EventCard } from "./EventCard";

type Props = {
  results: ReadyEvent[];
  categories: string[];
  locations: string[];
  total: number; // jumlah semua pelatihan yang sedang dibuka (tanpa filter)
  filters?: EventFilters;
  showFilters?: boolean; // halaman Pelatihan: lokasi, mode, harga, urutan
  limit?: number; // batasi jumlah kartu (beranda); tanpa batas di halaman Pelatihan
};

const chip = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded border px-3 py-1.5 text-sm transition-colors ${
    active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-900"
  }`;

// Cari + filter (kategori, lokasi, offline/online, harga, urutan) + kartu pelatihan. Semua filter dikirim (GET) ke /event.
export function EventBrowser({ results, categories, locations, total, filters = {}, showFilters, limit }: Props) {
  const { q, kategori, lokasi, mode, harga, urut } = filters;
  const shown = limit ? results.slice(0, limit) : results;
  const href = (change: Partial<EventFilters>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, ...change })) if (v && !(k === "urut" && v === "tanggal")) params.set(k, v);
    const qs = params.toString();
    return qs ? `/event?${qs}` : "/event";
  };
  const active = [
    q && `"${q}"`,
    kategori,
    lokasi,
    mode && EVENT_MODE[mode],
    harga && PRICE_FILTERS[harga],
  ].filter(Boolean);

  return (
    <div>
      <form action="/event" method="get" role="search" className="space-y-2">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon width={18} height={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari pelatihan atau kota"
              aria-label="Cari pelatihan"
              autoComplete="off"
              className="input pl-10"
            />
          </div>
          <button className="btn btn-primary shrink-0 px-5">Cari</button>
        </div>
        {kategori && <input type="hidden" name="kategori" value={kategori} />}
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select name="lokasi" defaultValue={lokasi ?? ""} aria-label="Lokasi" className="input">
              <option value="">Semua lokasi</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select name="mode" defaultValue={mode ?? ""} aria-label="Offline atau online" className="input">
              <option value="">Offline & online</option>
              {Object.entries(EVENT_MODE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select name="harga" defaultValue={harga ?? ""} aria-label="Harga" className="input">
              <option value="">Semua harga</option>
              {Object.entries(PRICE_FILTERS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select name="urut" defaultValue={urut ?? "tanggal"} aria-label="Urutkan" className="input">
              {Object.entries(SORTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        )}
      </form>

      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={href({ kategori: undefined })} className={chip(!kategori)}>Semua</Link>
          {categories.map((c) => (
            <Link key={c} href={href({ kategori: c })} className={chip(kategori === c)}>{c}</Link>
          ))}
        </div>
      )}

      <p className="mt-4 text-sm text-gray-600" aria-live="polite">
        {active.length > 0 ? `${results.length} dari ${total} pelatihan · ${active.join(" · ")}` : `${total} pelatihan sedang dibuka.`}
        {active.length > 0 && <Link href="/event" className="ml-2 font-medium text-gray-900 underline underline-offset-2">Reset filter</Link>}
      </p>

      {shown.length === 0 ? (
        <p className="card mt-4 p-8 text-center text-sm text-gray-600">
          {total === 0 ? "Belum ada pelatihan yang membuka pendaftaran." : "Tidak ada pelatihan yang cocok. Coba ubah filter."}
        </p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {shown.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
        </div>
      )}

      {limit && results.length > limit && (
        <div className="mt-6 text-center">
          <Link href={href({})} className="btn btn-secondary">Lihat semua {results.length} pelatihan</Link>
        </div>
      )}
    </div>
  );
}
