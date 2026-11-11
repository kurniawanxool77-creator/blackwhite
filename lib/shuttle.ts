import { db } from "./db";
import { fmtDepart, routeLabel } from "./schedule";

export type ShuttleOption = { id: string; label: string; origin: string; destination: string; depart: string; note: string; seatsLeft: number | null };

// Rute shuttle sebuah event beserta sisa kursi. Kursi dihitung dari pendaftaran yang belum ditolak;
// exceptRegistrationId = pendaftaran yang sedang diubah (kursinya sendiri tidak ikut dihitung).
export async function shuttleOptions(eventId: string, exceptRegistrationId?: string): Promise<ShuttleOption[]> {
  const routes = await db.shuttleRoute.findMany({
    where: { eventId },
    orderBy: { departAt: "asc" },
    include: { _count: { select: { registrations: { where: { status: { not: "rejected" }, ...(exceptRegistrationId ? { id: { not: exceptRegistrationId } } : {}) } } } } },
  });
  return routes.map((r) => ({
    id: r.id,
    label: routeLabel(r),
    origin: r.origin,
    destination: r.destination,
    depart: fmtDepart(r.departAt),
    note: r.note,
    seatsLeft: r.capacity == null ? null : Math.max(0, r.capacity - r._count.registrations),
  }));
}

// Rute + daftar penumpang (manifest) untuk panel Shuttle di halaman event superadmin & panitia.
export async function shuttleManifest(eventId: string) {
  return db.shuttleRoute.findMany({
    where: { eventId },
    orderBy: { departAt: "asc" },
    include: {
      registrations: {
        where: { status: { not: "rejected" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, code: true, status: true, details: true, user: { select: { name: true, phone: true } } },
      },
    },
  });
}
