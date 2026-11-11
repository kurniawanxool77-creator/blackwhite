import type { Event } from "@prisma/client";
import { db } from "./db";
import { getCategories } from "./event-detail";
import { finalPrice } from "./format";

export const queryParam = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export type ReadyEvent = Event & { seatsLeft: number | null }; // null = tanpa batas kuota
export type SortKey = "tanggal" | "harga";
export const SORTS: Record<SortKey, string> = { tanggal: "Tanggal terdekat", harga: "Harga termurah" };
export const PRICE_FILTERS: Record<string, string> = { gratis: "Gratis", berbayar: "Berbayar" };

// Filter halaman Pelatihan. Semua opsional; kosong = semua.
export type EventFilters = { q?: string; kategori?: string; lokasi?: string; mode?: string; harga?: string; urut?: string };

// Sisa kursi = kuota dikurangi peserta yang sudah disetujui.
export async function seatsLeftOf(event: { id: string; quota: number | null }) {
  if (!event.quota) return null;
  const approved = await db.registration.count({ where: { eventId: event.id, status: "approved" } });
  return Math.max(0, event.quota - approved);
}

// Pelatihan yang sedang membuka pendaftaran beserta pilihan filter (kategori, lokasi) dari data yang ada.
// Disaring di aplikasi agar pencarian tidak peka huruf besar/kecil di SQLite maupun PostgreSQL; jumlah event terbuka kecil.
export async function findReadyEvents({ q, kategori, lokasi, mode, harga, urut }: EventFilters) {
  const [all, approved, categories] = await Promise.all([
    db.event.findMany({ where: { status: "open" }, orderBy: { startDate: "asc" } }),
    db.registration.groupBy({ by: ["eventId"], where: { status: "approved", event: { status: "open" } }, _count: true }),
    getCategories(),
  ]);
  const approvedOf = (id: string) => approved.find((a) => a.eventId === id)?._count ?? 0;
  const needle = q?.toLowerCase();
  const results: ReadyEvent[] = all
    .filter(
      (e) =>
        (!kategori || e.category === kategori) &&
        (!lokasi || e.location === lokasi) &&
        (!mode || e.mode === mode) &&
        (!harga || (harga === "gratis" ? finalPrice(e) === 0 : finalPrice(e) > 0)) &&
        (!needle || [e.name, e.category, e.location, e.description].some((field) => field.toLowerCase().includes(needle))),
    )
    .map((e) => ({ ...e, seatsLeft: e.quota ? Math.max(0, e.quota - approvedOf(e.id)) : null }));
  if (urut === "harga") results.sort((a, b) => finalPrice(a) - finalPrice(b) || +a.startDate - +b.startDate);
  const locations = [...new Set(all.map((e) => e.location).filter(Boolean))].sort();
  return { results, categories, locations, total: all.length };
}
