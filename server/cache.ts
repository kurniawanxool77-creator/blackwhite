// Cache memori singkat untuk data publik yang sering dibaca bersama (site, banner, kategori).
// Tetap dibersihkan setiap ada mutasi di server supaya perubahan Superadmin langsung terlihat.
type Entry = { expires: number; value: unknown };
const g = globalThis as unknown as { __bwCache?: Map<string, Entry> };
const store = (g.__bwCache ??= new Map());

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value as T;
  const value = await load();
  store.set(key, { expires: now + ttlMs, value });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

