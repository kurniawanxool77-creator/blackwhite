"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { digits, str } from "@/lib/form";
import { routeLabel, wibToDate } from "@/lib/schedule";

const refresh = (eventId: string) => {
  revalidatePath(`/superadmin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
};

// Data rute dari form (dipakai tambah & ubah). Mengembalikan pesan error atau data.
function readRoute(f: FormData) {
  const origin = str(f, "origin").slice(0, 120);
  const destination = str(f, "destination").slice(0, 120);
  const departAt = wibToDate(str(f, "departDate"), str(f, "departTime"));
  if (!origin || !destination) return "Titik jemput dan tujuan wajib diisi.";
  if (!departAt) return "Tanggal dan jam berangkat wajib diisi.";
  const capacity = digits(f, "capacity");
  return { origin, destination, departAt, capacity: capacity > 0 ? Math.min(capacity, 10_000) : null, note: str(f, "note").slice(0, 300) };
}

export async function addShuttle(eventId: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readRoute(f);
  if (typeof data === "string") return data;
  const route = await db.shuttleRoute.create({ data: { eventId, ...data } });
  await audit(admin, "Tambah rute shuttle", routeLabel(route));
  refresh(eventId);
  return null;
}

// Kapasitas tidak boleh di bawah jumlah penumpang yang sudah memilih rute ini.
export async function updateShuttle(id: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readRoute(f);
  if (typeof data === "string") return data;
  const taken = await db.registration.count({ where: { shuttleId: id, status: { not: "rejected" } } });
  if (data.capacity != null && data.capacity < taken) return `Kapasitas minimal ${taken} (sudah ada ${taken} penumpang).`;
  const route = await db.shuttleRoute.update({ where: { id }, data });
  await audit(admin, "Ubah rute shuttle", routeLabel(route));
  refresh(route.eventId);
  return null;
}

// Penumpang rute yang dihapus menjadi "tanpa shuttle" (jawaban formulirnya tetap tercatat).
export async function deleteShuttle(id: string) {
  const admin = await requireAdmin("superadmin");
  const route = await db.shuttleRoute.delete({ where: { id } });
  await audit(admin, "Hapus rute shuttle", routeLabel(route));
  refresh(route.eventId);
}
