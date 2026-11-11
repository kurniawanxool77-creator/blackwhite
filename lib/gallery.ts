import { isImageUrl } from "./url";

export const MAX_GALLERY = 8;

// Galeri disimpan sebagai JSON string di kolom Event.gallery.
export function parseGallery(json: string): string[] {
  try {
    const list: unknown = JSON.parse(json);
    return Array.isArray(list) ? list.filter((u): u is string => typeof u === "string" && isImageUrl(u)).slice(0, MAX_GALLERY) : [];
  } catch {
    return [];
  }
}

// Semua foto event untuk ditampilkan: sampul lebih dulu, lalu galeri tanpa duplikat.
export const eventPhotos = (e: { coverUrl: string | null; gallery: string }) =>
  [...new Set([...(e.coverUrl ? [e.coverUrl] : []), ...parseGallery(e.gallery)])];
