// Format jadwal (WIB) untuk rundown dan shuttle. Tanpa dependensi server: dipakai juga di komponen browser.

const DAY = { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } as const;

// Tanggal rundown disimpan sebagai tengah malam UTC dari tanggal kalender (seperti tanggal event).
export const fmtDay = (d: Date) => new Date(d).toLocaleDateString("id-ID", DAY);
export const dayKey = (d: Date) => new Date(d).toISOString().slice(0, 10);

// "07:30" atau "07.30" → "07.30"; selain format jam dikosongkan.
export function cleanTime(v: string) {
  const m = v.trim().match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/);
  return m ? `${m[1].padStart(2, "0")}.${m[2]}` : "";
}

// "Sab, 5 Des 2026 · 07.30–08.00" (bagian yang kosong dilewati).
export function fmtWhen(date: Date | null, start: string, end: string) {
  const time = start ? (end ? `${start}–${end}` : start) : "";
  return [date ? fmtDay(date) : "", time].filter(Boolean).join(" · ");
}

// Waktu berangkat shuttle (instan UTC) ditampilkan dalam WIB.
export const fmtDepart = (d: Date) =>
  `${new Date(d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })} · ${new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB`;

// Gabungan tanggal (YYYY-MM-DD) + jam WIB → instan UTC.
export function wibToDate(date: string, time: string): Date | null {
  const t = cleanTime(time);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !t) return null;
  const [h, m] = t.split(".").map(Number);
  const d = new Date(`${date}T00:00:00.000Z`);
  return isNaN(+d) ? null : new Date(+d + (h * 60 + m - 7 * 60) * 60_000);
}

// Nilai input <input type=date> / <input type=time> dari instan UTC, dalam WIB.
export const wibDateInput = (d: Date) => new Date(+d + 7 * 3600e3).toISOString().slice(0, 10);
export const wibTimeInput = (d: Date) => new Date(+d + 7 * 3600e3).toISOString().slice(11, 16);

// Pilihan "tidak memakai shuttle" pada isian shuttle di formulir pendaftaran.
export const NO_SHUTTLE = "none";
export const NO_SHUTTLE_LABEL = "Tidak menggunakan shuttle";

export type RouteLike = { origin: string; destination: string; departAt: Date };
export const routeLabel = (r: RouteLike) => `${r.origin} → ${r.destination} · ${fmtDepart(r.departAt)}`;

export const dayStart = (date: string) => new Date(`${date}T00:00:00.000Z`);
export const isDateKey = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(+dayStart(v));

export type AttendanceStatus = { label: string; tone: "green" | "gray" | "amber" };
export function attendanceStatus(row: { checkIn: Date; checkOut: Date | null } | null | undefined, fmt: (d: Date) => string): AttendanceStatus {
  if (!row) return { label: "Belum absen", tone: "amber" };
  if (!row.checkOut) return { label: `Hadir sejak ${fmt(row.checkIn)}`, tone: "green" };
  return { label: `Selesai ${fmt(row.checkOut)}`, tone: "gray" };
}
