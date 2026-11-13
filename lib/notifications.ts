import type { Admin } from "@prisma/client";
import { myAttendanceToday } from "./attendance";
import { startOfTodayJakarta } from "./checkin";
import { db } from "./db";

export type Notice = { id: string; title: string; detail: string; href: string; at: string; tone: "warn" | "info" };

const DAY = 864e5;

// Hal yang perlu ditindaklanjuti, dihitung langsung dari data (tanpa tabel notifikasi terpisah).
// Superadmin: pendaftaran menunggu persetujuan + pelatihan yang dimulai hari ini/besok.
// Panitia: pelatihan hari ini yang belum diabsen + pelatihan besok.
export async function noticesFor(admin: Admin): Promise<{ total: number; items: Notice[] }> {
  const today = startOfTodayJakarta();
  const soon = { gte: today, lt: new Date(+today + 2 * DAY) };

  if (admin.role === "superadmin") {
    const [pendingCount, pending, starting] = await Promise.all([
      db.registration.count({ where: { status: "pending" } }),
      db.registration.findMany({ where: { status: "pending" }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } }, event: { select: { id: true, name: true } } } }),
      db.event.findMany({ where: { status: { in: ["open", "closed"] }, startDate: soon }, orderBy: { startDate: "asc" }, select: { id: true, name: true, startDate: true } }),
    ]);
    const items: Notice[] = [
      ...pending.map((r) => ({ id: `reg-${r.id}`, title: `${r.user.name} menunggu persetujuan`, detail: r.event.name, href: `/superadmin/events/${r.event.id}?status=pending`, at: r.createdAt.toISOString(), tone: "warn" as const })),
      ...starting.map((e) => ({ id: `ev-${e.id}`, title: `${+e.startDate < +today + DAY ? "Hari ini" : "Besok"}: ${e.name}`, detail: "Event dimulai", href: `/superadmin/events/${e.id}`, at: e.startDate.toISOString(), tone: "info" as const })),
    ];
    return { total: pendingCount + starting.length, items };
  }

  const [{ items: todayItems }, tomorrow] = await Promise.all([
    myAttendanceToday(admin.id),
    db.event.findMany({ where: { admins: { some: { id: admin.id } }, status: { in: ["open", "closed"] }, startDate: { gte: new Date(+today + DAY), lt: new Date(+today + 2 * DAY) } }, select: { id: true, name: true, startDate: true } }),
  ]);
  const items: Notice[] = [
    ...todayItems.filter((i) => !i.row).map(({ event }) => ({ id: `att-${event.id}`, title: `Absen datang: ${event.name}`, detail: "Fitur event terbuka setelah absen", href: "/admin/absensi", at: today.toISOString(), tone: "warn" as const })),
    ...tomorrow.map((e) => ({ id: `ev-${e.id}`, title: `Besok: ${e.name}`, detail: "Siapkan tugas Anda", href: `/admin/events/${e.id}`, at: e.startDate.toISOString(), tone: "info" as const })),
  ];
  return { total: items.length, items };
}
