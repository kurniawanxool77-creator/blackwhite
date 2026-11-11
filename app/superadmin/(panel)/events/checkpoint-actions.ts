"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { str } from "@/lib/form";
import { cleanTime } from "@/lib/schedule";
import { parseFields } from "@/lib/registration-form";
import { choiceOptions } from "@/lib/rundown";

const refresh = (eventId: string) => revalidatePath(`/superadmin/events/${eventId}`);

// Detail item rundown: tanggal, jam mulai–selesai (WIB), tempat, dan penjelasan untuk peserta & panitia.
const details = (f: FormData) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(f, "date")) ? new Date(`${str(f, "date")}T00:00:00.000Z`) : null;
  return {
    date,
    startTime: cleanTime(str(f, "startTime")),
    endTime: cleanTime(str(f, "endTime")),
    place: str(f, "place").slice(0, 120),
    description: str(f, "description").slice(0, 600),
  };
};

// Urutkan rundown sesuai tanggal & jam mulai (item tanpa jadwal di akhir, urutan lama dipertahankan).
export async function sortRundown(eventId: string) {
  await requireAdmin("superadmin");
  const items = await db.checkpoint.findMany({ where: { eventId }, orderBy: { order: "asc" } });
  const key = (c: (typeof items)[number]) => (c.date ? `${c.date.toISOString().slice(0, 10)} ${c.startTime || "99.99"}` : "9999");
  const sorted = [...items].sort((a, b) => key(a).localeCompare(key(b)) || a.order - b.order);
  await db.$transaction(sorted.map((c, i) => db.checkpoint.update({ where: { id: c.id }, data: { order: i + 1 } })));
  refresh(eventId);
}

export async function addCheckpoint(eventId: string, f: FormData) {
  await requireAdmin("superadmin");
  const name = str(f, "name");
  if (!name) return;
  const last = await db.checkpoint.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
  await db.checkpoint.create({
    data: { eventId, name, kind: str(f, "kind") || "attendance", scan: f.get("scan") === "on", order: (last?.order ?? 0) + 1, ...details(f) },
  });
  refresh(eventId);
}

export async function updateCheckpoint(id: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const name = str(f, "name").slice(0, 120);
  if (!name) return "Nama item wajib diisi.";
  const kind = ["attendance", "meal", "item"].includes(str(f, "kind")) ? str(f, "kind") : "attendance";
  const cp = await db.checkpoint.update({ where: { id }, data: { name, kind, ...details(f) } });
  await audit(admin, "Ubah item rundown", name);
  refresh(cp.eventId);
  return null;
}

export async function moveCheckpoint(id: string, direction: "up" | "down") {
  await requireAdmin("superadmin");
  const cp = await db.checkpoint.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.checkpoint.findFirst({
    where: { eventId: cp.eventId, order: direction === "up" ? { lt: cp.order } : { gt: cp.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await db.$transaction([
    db.checkpoint.update({ where: { id: cp.id }, data: { order: neighbor.order } }),
    db.checkpoint.update({ where: { id: neighbor.id }, data: { order: cp.order } }),
  ]);
  refresh(cp.eventId);
}

export async function deleteCheckpoint(id: string) {
  await requireAdmin("superadmin");
  const cp = await db.checkpoint.findUniqueOrThrow({ where: { id }, include: { _count: { select: { scans: true } } } });
  if (cp._count.scans > 0) return; // jangan hapus riwayat scan
  await db.checkpoint.delete({ where: { id } });
  refresh(cp.eventId);
}

// Untuk siapa item rundown ini: kosong = semua peserta, atau hanya peserta dengan jawaban tertentu (mis. paket).
export async function setCheckpointAudience(id: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const cp = await db.checkpoint.findUniqueOrThrow({ where: { id }, include: { event: { select: { formFields: true } } } });
  const allowed = new Set(choiceOptions(parseFields(cp.event.formFields)).map((o) => o.key));
  const audience = [...new Set(f.getAll("audience").map(String))].filter((k) => allowed.has(k));
  await db.checkpoint.update({ where: { id }, data: { audience: JSON.stringify(audience) } });
  await audit(admin, "Atur peserta rundown", `${cp.name} → ${audience.length ? audience.join(", ") : "semua peserta"}`);
  refresh(cp.eventId);
}

// Item rundown "perlu scan" atau "agenda saja". Yang sudah punya riwayat scan tidak bisa dijadikan agenda saja.
export async function toggleCheckpointScan(id: string) {
  await requireAdmin("superadmin");
  const cp = await db.checkpoint.findUniqueOrThrow({ where: { id }, include: { _count: { select: { scans: true } } } });
  if (cp.scan && cp._count.scans > 0) return;
  await db.checkpoint.update({ where: { id }, data: { scan: !cp.scan } });
  refresh(cp.eventId);
}
