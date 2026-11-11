import { db } from "./db";

// Nomor peserta / BIB per event, mis. RUN-001, RUN-002. Diberikan berurutan saat pendaftaran disetujui.
export const formatCode = (prefix: string, n: number) => `${prefix}-${String(n).padStart(3, "0")}`;

// Awalan dari Superadmin: huruf/angka besar saja, maks. 8 karakter.
export const cleanPrefix = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

// Nomor berikutnya sebanyak count, melanjutkan nomor tertinggi yang sudah dipakai di event ini.
export async function nextCodes(eventId: string, prefix: string, count: number): Promise<string[]> {
  if (!prefix || count <= 0) return [];
  const used = await db.registration.findMany({ where: { eventId, code: { not: null } }, select: { code: true } });
  const max = used.reduce((m, r) => Math.max(m, Number(r.code?.split("-").pop()) || 0), 0);
  return Array.from({ length: count }, (_, i) => formatCode(prefix, max + 1 + i));
}

// Batas pendaftaran = tanggal yang dipilih Superadmin, berlaku sampai pukul 23.59 WIB di hari itu.
export const registrationClosed = (e: { registrationEnd: Date | null }) =>
  Boolean(e.registrationEnd) && Date.now() > +e.registrationEnd! + 864e5 - 7 * 3600e3;
