"use server";

import { Prisma } from "@prisma/client";
import { refresh } from "next/cache";
import { isOnDuty } from "@/lib/attendance";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { canUndoScan } from "@/lib/checkin";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { appliesTo, audienceLabel } from "@/lib/rundown";

export type ScanResult = {
  tone: "success" | "warning" | "error";
  title: string;
  detail?: string;
  progress?: string;
  photo?: string | null; // foto profil peserta, untuk dicocokkan dengan wajah orangnya
};

// Satu QR pribadi per peserta; panitia memilih pelatihan dan pos. QR lama per pendaftaran tetap diterima.
async function findRegistration(token: string, eventId: string) {
  const user = await db.user.findUnique({ where: { qrToken: token } });
  if (user) {
    const reg = await db.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
      include: { user: true },
    });
    return { user, reg };
  }
  const legacy = await db.registration.findUnique({ where: { qrToken: token }, include: { user: true } });
  if (!legacy) return { user: null, reg: null };
  const reg = legacy.eventId === eventId ? legacy : await db.registration.findUnique({
    where: { userId_eventId: { userId: legacy.userId, eventId } },
    include: { user: true },
  });
  return { user: legacy.user, reg };
}

export async function scanQr(checkpointId: string, token: string): Promise<ScanResult> {
  const admin = await requireAdmin();
  const checkpoint = await db.checkpoint.findUnique({
    where: { id: checkpointId },
    include: { event: { include: { admins: { where: { id: admin.id }, select: { id: true } } } } },
  });
  if (!checkpoint) return { tone: "error", title: "Checkpoint tidak ditemukan" };
  if (admin.role === "scanner" && checkpoint.event.admins.length === 0) {
    return { tone: "error", title: "Anda tidak ditugaskan di event ini" };
  }
  if (!checkpoint.event.useQr) return { tone: "error", title: "Pelatihan ini tanpa QR", detail: "Kehadiran ditandai manual dari halaman peserta." };
  if (!checkpoint.scan) return { tone: "error", title: "Pos ini tidak memerlukan scan", detail: `"${checkpoint.name}" hanya agenda rundown.` };
  if (admin.role === "scanner" && !(await isOnDuty(admin.id, checkpoint.eventId))) {
    return { tone: "error", title: "Absen datang dulu", detail: "Fitur event terbuka setelah Anda absen datang di pelatihan ini." };
  }

  const { user, reg } = await findRegistration(token.trim(), checkpoint.eventId);
  if (!user) return { tone: "error", title: "QR tidak dikenal", detail: "Bukan QR peserta yang valid." };
  if (!reg) return { tone: "error", title: `${user.name} tidak terdaftar`, detail: `Tidak terdaftar di ${checkpoint.event.name}.`, photo: user.image };
  if (reg.status !== "approved") {
    return { tone: "error", title: `${user.name} belum disetujui`, detail: "Pendaftaran di pelatihan ini belum disetujui atau ditolak.", photo: user.image };
  }
  // Rundown per peserta: pos khusus (mis. Paket Lengkap) menolak peserta yang tidak termasuk.
  const details = readDetails(reg.details);
  if (!appliesTo(checkpoint, details)) {
    return { tone: "error", title: `${user.name} tidak termasuk pos ini`, detail: `"${checkpoint.name}" khusus ${audienceLabel(checkpoint)}.`, photo: user.image };
  }

  try {
    await db.scan.create({ data: { registrationId: reg.id, checkpointId, adminId: admin.id } });
    const [done, points] = await Promise.all([
      db.scan.count({ where: { registrationId: reg.id, checkpoint: { scan: true } } }),
      db.checkpoint.findMany({ where: { eventId: reg.eventId, scan: true }, select: { audience: true } }),
    ]);
    const total = points.filter((p) => appliesTo(p, details)).length;
    return { tone: "success", title: reg.code ? `${reg.code} · ${user.name}` : user.name, detail: user.organization ?? user.email, progress: `${done}/${total}`, photo: user.image };
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    const first = await db.scan.findUnique({
      where: { registrationId_checkpointId: { registrationId: reg.id, checkpointId } },
    });
    return {
      tone: "warning",
      title: `${user.name} sudah di-scan`,
      detail: first ? `Pertama kali ${fmtDateTime(first.createdAt)}` : undefined,
      photo: user.image,
    };
  }
}

// Panitia hanya boleh bertindak di event yang ditugaskan; superadmin di semua event.
async function canAccessEvent(admin: { id: string; role: string }, eventId: string) {
  if (admin.role === "superadmin") return true;
  return (await db.event.count({ where: { id: eventId, admins: { some: { id: admin.id } } } })) > 0;
}

// Check-in tanpa QR (QR rusak, HP mati). Aturannya sama dengan scan: peserta disetujui, checkpoint di event yang sama.
export async function manualCheckin(registrationId: string, checkpointId: string) {
  const admin = await requireAdmin();
  const [reg, checkpoint] = await Promise.all([
    db.registration.findUnique({ where: { id: registrationId }, include: { user: true } }),
    db.checkpoint.findUnique({ where: { id: checkpointId } }),
  ]);
  if (!reg || !checkpoint || !checkpoint.scan || reg.status !== "approved" || reg.eventId !== checkpoint.eventId) return;
  if (!appliesTo(checkpoint, readDetails(reg.details))) return; // bukan rundown peserta ini
  if (!(await canAccessEvent(admin, reg.eventId))) return;
  if (admin.role === "scanner" && !(await isOnDuty(admin.id, reg.eventId))) return; // wajib absen datang dulu

  try {
    await db.scan.create({ data: { registrationId, checkpointId, adminId: admin.id } });
  } catch (e) {
    // Sudah check-in (klik ganda atau dipindai bersamaan): tidak ada yang berubah, tidak perlu dicatat.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return refresh();
    throw e;
  }
  await audit(admin, "Check-in manual", `${reg.user.name} · ${checkpoint.name}`);
  refresh();
}

// Membatalkan scan yang salah. Lihat canUndoScan untuk batas waktu panitia.
export async function undoScan(scanId: string) {
  const admin = await requireAdmin();
  const scan = await db.scan.findUnique({
    where: { id: scanId },
    include: { registration: { include: { user: true } }, checkpoint: true },
  });
  if (!scan || !canUndoScan(admin, scan) || !(await canAccessEvent(admin, scan.registration.eventId))) return;

  await db.scan.delete({ where: { id: scanId } });
  await audit(admin, "Batalkan scan", `${scan.registration.user.name} · ${scan.checkpoint.name}`);
  refresh();
}
