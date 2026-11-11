import { db } from "./db";
import { readDetails } from "./registration-form";
import { appliesTo } from "./rundown";

// Data halaman detail event untuk superadmin dan panitia. adminId diisi = hanya event yang ditugaskan.
// q menyaring peserta (nama, email, HP, instansi); jumlah per tab tetap dihitung tanpa q.
export async function getEventDetail(id: string, filter: string, adminId?: string, q?: string) {
  const event = await db.event.findFirst({
    where: { id, ...(adminId ? { admins: { some: { id: adminId } } } : {}) },
    include: { checkpoints: { orderBy: { order: "asc" }, include: { _count: { select: { scans: true } } } } },
  });
  if (!event) return null;

  const [registrations, grouped, approved] = await Promise.all([
    db.registration.findMany({
      where: { eventId: id, ...(filter !== "all" ? { status: filter } : {}) },
      include: { user: true, _count: { select: { scans: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.registration.groupBy({ by: ["status"], where: { eventId: id }, _count: true }),
    db.registration.findMany({ where: { eventId: id, status: "approved" }, select: { details: true } }),
  ]);
  // Jumlah peserta disetujui yang termasuk tiap item rundown (item khusus paket tertentu dihitung dari pesertanya saja).
  const approvedDetails = approved.map((r) => readDetails(r.details));
  const eligible = Object.fromEntries(event.checkpoints.map((c) => [c.id, approvedDetails.filter((d) => appliesTo(c, d)).length]));
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<string, number>;
  const needle = q?.toLowerCase();
  const matches = (r: (typeof registrations)[number]) =>
    [r.user.name, r.user.email, r.user.phone ?? "", r.user.organization ?? ""].some((v) => v.toLowerCase().includes(needle!));
  return { event, registrations: needle ? registrations.filter(matches) : registrations, counts, eligible };
}

// Kategori yang dikelola Superadmin (menu Kategori), untuk pilihan di form event.
export async function getCategories() {
  const rows = await db.category.findMany({ orderBy: { name: "asc" }, select: { name: true } });
  return rows.map((r) => r.name);
}
