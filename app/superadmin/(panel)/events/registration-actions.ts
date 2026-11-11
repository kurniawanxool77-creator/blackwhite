"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { str } from "@/lib/form";
import { nextCodes } from "@/lib/participant-code";

const refresh = (eventId: string) => revalidatePath(`/superadmin/events/${eventId}`);

// Menyetujui pendaftaran tertentu, atau semua yang menunggu bila ids null. Sisa di luar kuota tetap menunggu.
export async function approveRegistrations(eventId: string, ids: string[] | null) {
  const admin = await requireAdmin("superadmin");
  const count = await approve(eventId, ids);
  await audit(admin, "Setujui pendaftaran", `${count} peserta · event ${eventId}`);
  refresh(eventId);
}

// Tanpa cek sesi: hanya dipanggil dari action di atas yang sudah memeriksa. Mengembalikan jumlah yang disetujui.
async function approve(eventId: string, ids: string[] | null) {
  const event = await db.event.findUniqueOrThrow({ where: { id: eventId } });
  const pending = await db.registration.findMany({
    where: ids ? { eventId, id: { in: ids }, status: { in: ["pending", "rejected"] } } : { eventId, status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  let allowed = pending.length;
  if (event.quota) {
    const approved = await db.registration.count({ where: { eventId, status: "approved" } });
    allowed = Math.max(0, Math.min(allowed, event.quota - approved));
  }
  const chosen = pending.slice(0, allowed);
  // Nomor peserta (BIB) untuk yang belum punya, melanjutkan nomor terakhir di event ini.
  const codes = await nextCodes(eventId, event.codePrefix, chosen.filter((r) => !r.code).length);
  await db.$transaction(
    chosen.map((r) =>
      db.registration.update({
        where: { id: r.id },
        data: { status: "approved", approvedAt: new Date(), rejectReason: null, qrToken: randomBytes(18).toString("base64url"), ...(!r.code && codes.length ? { code: codes.shift() } : {}) },
      }),
    ),
  );
  return allowed;
}

// Baris: "Nama, email, No. HP, Instansi" (pemisah koma/titik koma, atau tab dari Excel).
export async function importParticipants(eventId: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const lines = str(f, "rows").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const newIds: string[] = [];
  const invalid: number[] = [];
  let existing = 0;

  for (const [i, line] of lines.entries()) {
    const [name = "", rawEmail = "", phone = "", ...org] = (line.includes("\t") ? line.split("\t") : line.split(/[,;]/)).map((s) => s.trim());
    const email = rawEmail.toLowerCase();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      invalid.push(i + 1);
      continue;
    }
    const organization = org.join(", ").trim() || null;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, name, phone: phone || null, organization },
    });
    const found = await db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId } } });
    if (found) {
      existing++;
      continue;
    }
    newIds.push((await db.registration.create({ data: { userId: user.id, eventId } })).id);
  }

  const approved = f.get("approve") && newIds.length ? await approve(eventId, newIds) : 0;
  await audit(admin, "Impor peserta", `${newIds.length} baru · ${approved} disetujui · event ${eventId}`);
  refresh(eventId);
  return [
    `${newIds.length} peserta ditambahkan`,
    f.get("approve") ? `${approved} disetujui${approved < newIds.length ? " (sisanya menunggu karena kuota)" : ""}` : "",
    existing ? `${existing} sudah terdaftar` : "",
    invalid.length ? `baris tidak valid: ${invalid.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(", ") + ".";
}

// Hapus satu pendaftaran (riwayat scan, video, kuis, dan sertifikatnya ikut terhapus). Akun peserta tetap ada.
export async function deleteRegistration(id: string) {
  const admin = await requireAdmin("superadmin");
  const reg = await db.registration.delete({ where: { id }, include: { user: true, event: true } });
  await audit(admin, "Hapus pendaftaran", `${reg.user.name} · ${reg.event.name}`);
  revalidatePath(`/superadmin/events/${reg.eventId}`);
  revalidatePath("/superadmin/peserta");
}

// Hapus akun peserta beserta semua pendaftarannya.
export async function deleteUser(userId: string) {
  const admin = await requireAdmin("superadmin");
  const user = await db.user.delete({ where: { id: userId }, include: { _count: { select: { registrations: true } } } });
  await audit(admin, "Hapus akun peserta", `${user.name} (${user.email}) · ${user._count.registrations} pendaftaran`);
  revalidatePath("/superadmin/peserta");
}

export async function rejectRegistration(id: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const reg = await db.registration.update({
    where: { id },
    data: { status: "rejected", rejectReason: str(f, "reason") || null, qrToken: null },
  });
  await audit(admin, "Tolak pendaftaran", `${id}${reg.rejectReason ? ` · ${reg.rejectReason}` : ""}`);
  refresh(reg.eventId);
}
