import type { Admin } from "@prisma/client";
import { isRunning } from "./checkin";
import { db } from "./db";

// Alur scan: pilih pelatihan → pilih item rundown → layar scan terkunci ke item itu.
// Panitia hanya melihat pelatihan yang ditugaskan; superadmin semua. Draft dan selesai tidak bisa dipindai.
const scannable = (admin: Admin) => ({
  status: { in: ["open", "closed"] },
  useQr: true, // pelatihan tanpa QR tidak muncul di scanner
  ...(admin.role === "scanner" ? { admins: { some: { id: admin.id } } } : {}),
});

export async function scanEvents(admin: Admin) {
  const events = await db.event.findMany({
    where: scannable(admin),
    include: { _count: { select: { checkpoints: { where: { scan: true } }, registrations: { where: { status: "approved" } } } } },
    orderBy: { startDate: "asc" },
  });
  return events
    .map((e) => ({ ...e, running: isRunning(e) }))
    .sort((a, b) => Number(b.running) - Number(a.running)); // yang sedang berlangsung di atas
}

export async function scanEvent(admin: Admin, eventId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, ...scannable(admin) },
    include: {
      checkpoints: { orderBy: { order: "asc" }, include: { _count: { select: { scans: true } } } },
      _count: { select: { registrations: { where: { status: "approved" } } } },
    },
  });
  return event ? { ...event, running: isRunning(event) } : null;
}
