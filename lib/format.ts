const TZ = "Asia/Jakarta";

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });

export const fmtDateTime = (d: Date) =>
  d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });

export const fmtNum = (n: number) => n.toLocaleString("id-ID");

export const fmtRp = (n: number) => `Rp ${fmtNum(n)}`;
export const fmtRupiah = fmtRp;

// Harga setelah diskon persen, dibulatkan ke rupiah.
export const finalPrice = (e: { price: number; discount: number }) => Math.round((e.price * (100 - e.discount)) / 100);

export const EVENT_STATUS: Record<string, string> = {
  draft: "Draft",
  open: "Pendaftaran dibuka",
  closed: "Pendaftaran ditutup",
  done: "Selesai",
};

export const REG_STATUS: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const CHECKPOINT_KIND: Record<string, string> = {
  attendance: "Kehadiran",
  meal: "Konsumsi",
  item: "Pengambilan barang",
};

// Lama acara dalam hari, termasuk hari pertama dan terakhir.
export const durationDays = (start: Date, end: Date) => Math.max(1, Math.round((+end - +start) / 86_400_000) + 1);

// Jam saja, mis. "07.45" (Asia/Jakarta).
export const fmtTime = (d: Date) => d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

// Lama kerja, mis. "8 j 15 m".
export const fmtDuration = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)} j ${m % 60} m` : `${m} m`;
};

export const EVENT_MODE: Record<string, string> = { offline: "Offline", online: "Online", hybrid: "Hybrid" };

// Rentang tanggal ringkas: "6 Nov 2026", "6–7 Nov 2026", "28 Nov – 2 Des 2026", "30 Des 2026 – 2 Jan 2027".
export function fmtDateRange(start: Date, end: Date) {
  const part = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("id-ID", { ...o, timeZone: TZ });
  const [sd, sm, sy] = [part(start, { day: "numeric" }), part(start, { month: "short" }), part(start, { year: "numeric" })];
  const [ed, em, ey] = [part(end, { day: "numeric" }), part(end, { month: "short" }), part(end, { year: "numeric" })];
  if (sy !== ey) return `${fmtDate(start)} – ${fmtDate(end)}`;
  if (sm !== em) return `${sd} ${sm} – ${ed} ${em} ${ey}`;
  if (sd !== ed) return `${sd}–${ed} ${em} ${ey}`;
  return fmtDate(start);
}
