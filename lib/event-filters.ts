import type { Event } from "@prisma/client";

export type ReadyEvent = Event & { seatsLeft: number | null };
export type SortKey = "tanggal" | "harga";
export const SORTS: Record<SortKey, string> = { tanggal: "Tanggal terdekat", harga: "Harga termurah" };
export const PRICE_FILTERS: Record<string, string> = { gratis: "Gratis", berbayar: "Berbayar" };
export type EventFilters = { q?: string; kategori?: string; lokasi?: string; mode?: string; harga?: string; urut?: string };

