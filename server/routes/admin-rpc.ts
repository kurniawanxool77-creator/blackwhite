import type { IncomingMessage, ServerResponse } from "node:http";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "../auth";
import { readFormData, readJson, sendJson } from "../http";
import { isOnDuty } from "../../lib/attendance";
import { audit } from "../../lib/audit";
import { canUndoScan } from "../../lib/checkin";
import { db } from "../../lib/db";
import { PHONE_RE, str, type FormState } from "../../lib/form";
import { fmtDateTime } from "../../lib/format";
import { hashPassword, verifyPassword } from "../../lib/password";
import { readDetails } from "../../lib/registration-form";
import { appliesTo, audienceLabel } from "../../lib/rundown";
import { SAFE_USER } from "./admin";

async function canAccessEvent(admin: { id: string; role: string }, eventId: string) {
  if (admin.role === "superadmin") return true;
  return (await db.event.count({ where: { id: eventId, admins: { some: { id: admin.id } } } })) > 0;
}

async function findRegistrationByToken(token: string, eventId: string) {
  const user = await db.user.findUnique({ where: { qrToken: token }, select: SAFE_USER });
  if (user) {
    const reg = await db.registration.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
      include: { user: { select: SAFE_USER } },
    });
    return { user, reg };
  }
  const legacy = await db.registration.findUnique({ where: { qrToken: token }, include: { user: { select: SAFE_USER } } });
  if (!legacy) return { user: null, reg: null };
  const reg =
    legacy.eventId === eventId
      ? legacy
      : await db.registration.findUnique({
          where: { userId_eventId: { userId: legacy.userId, eventId } },
          include: { user: { select: SAFE_USER } },
        });
  return { user: legacy.user, reg };
}

export async function handleAdminRpc(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  if (req.method !== "POST") return false;

  if (pathname === "/api/rpc/changeOwnPassword") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const f = await readFormData(req);
    const current = String(f.get("current") ?? "");
    const next = String(f.get("next") ?? "");
    let result: FormState;
    if (!verifyPassword(current, admin.passwordHash)) result = { ok: false, message: "Password lama salah." };
    else if (next.length < 8) result = { ok: false, message: "Password baru minimal 8 karakter." };
    else if (next !== String(f.get("confirm") ?? "")) result = { ok: false, message: "Konfirmasi password baru tidak sama." };
    else if (next === current) result = { ok: false, message: "Password baru harus berbeda dari yang lama." };
    else {
      await db.admin.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(next) } });
      await audit(admin, "Ganti password sendiri");
      result = { ok: true, message: "Password berhasil diganti. Gunakan password baru saat login berikutnya." };
    }
    sendJson(res, { result });
    return true;
  }

  if (pathname === "/api/rpc/updateOwnContact") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const f = await readFormData(req);
    const phone = str(f, "phone");
    if (phone && !PHONE_RE.test(phone)) return sendJson(res, { result: { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." } }), true;
    await db.admin.update({ where: { id: admin.id }, data: { phone: phone || null } });
    sendJson(res, { result: { ok: true, message: "No. HP tersimpan." } });
    return true;
  }

  if (pathname === "/api/rpc/scanQr") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const raw = await readJson<{ checkpointId?: string; token?: string; args?: unknown[] }>(req);
    const obj = (raw.args?.[0] && typeof raw.args[0] === "object" ? raw.args[0] : raw) as { checkpointId?: string; token?: string };
    const checkpointId = String(obj.checkpointId ?? (typeof raw.args?.[0] === "string" ? raw.args[0] : ""));
    const token = String(obj.token ?? (typeof raw.args?.[1] === "string" ? raw.args[1] : ""));
    const checkpoint = await db.checkpoint.findUnique({
      where: { id: checkpointId },
      include: { event: { include: { admins: { where: { id: admin.id }, select: { id: true } } } } },
    });
    if (!checkpoint) return sendJson(res, { result: { tone: "error", title: "Checkpoint tidak ditemukan" } }), true;
    if (admin.role === "scanner" && checkpoint.event.admins.length === 0) {
      return sendJson(res, { result: { tone: "error", title: "Anda tidak ditugaskan di event ini" } }), true;
    }
    if (!checkpoint.event.useQr) {
      return sendJson(res, { result: { tone: "error", title: "Pelatihan ini tanpa QR", detail: "Kehadiran ditandai manual dari halaman peserta." } }), true;
    }
    if (!checkpoint.scan) {
      return sendJson(res, { result: { tone: "error", title: "Pos ini tidak memerlukan scan", detail: `"${checkpoint.name}" hanya agenda rundown.` } }), true;
    }
    if (admin.role === "scanner" && !(await isOnDuty(admin.id, checkpoint.eventId))) {
      return sendJson(res, { result: { tone: "error", title: "Absen datang dulu", detail: "Fitur event terbuka setelah Anda absen datang di pelatihan ini." } }), true;
    }
    const { user, reg } = await findRegistrationByToken(token.trim(), checkpoint.eventId);
    if (!user) return sendJson(res, { result: { tone: "error", title: "QR tidak dikenal", detail: "Bukan QR peserta yang valid." } }), true;
    if (!reg) return sendJson(res, { result: { tone: "error", title: `${user.name} tidak terdaftar`, detail: `Tidak terdaftar di ${checkpoint.event.name}.`, photo: user.image } }), true;
    if (reg.status !== "approved") {
      return sendJson(res, { result: { tone: "error", title: `${user.name} belum disetujui`, detail: "Pendaftaran di pelatihan ini belum disetujui atau ditolak.", photo: user.image } }), true;
    }
    const details = readDetails(reg.details);
    if (!appliesTo(checkpoint, details)) {
      return sendJson(res, { result: { tone: "error", title: `${user.name} tidak termasuk pos ini`, detail: `"${checkpoint.name}" khusus ${audienceLabel(checkpoint)}.`, photo: user.image } }), true;
    }
    try {
      await db.scan.create({ data: { registrationId: reg.id, checkpointId, adminId: admin.id } });
      const [done, points] = await Promise.all([
        db.scan.count({ where: { registrationId: reg.id, checkpoint: { scan: true } } }),
        db.checkpoint.findMany({ where: { eventId: reg.eventId, scan: true }, select: { audience: true } }),
      ]);
      const total = points.filter((p) => appliesTo(p, details)).length;
      sendJson(res, { result: { tone: "success", title: reg.code ? `${reg.code} · ${user.name}` : user.name, detail: user.organization ?? user.email, progress: `${done}/${total}`, photo: user.image } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
      const first = await db.scan.findUnique({ where: { registrationId_checkpointId: { registrationId: reg.id, checkpointId } } });
      sendJson(res, { result: { tone: "warning", title: `${user.name} sudah di-scan`, detail: first ? `Pertama kali ${fmtDateTime(first.createdAt)}` : undefined, photo: user.image } });
    }
    return true;
  }

  if (pathname === "/api/rpc/manualCheckin") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const raw = await readJson<{ registrationId?: string; checkpointId?: string; args?: unknown[] }>(req);
    const obj = (raw.args?.[0] && typeof raw.args[0] === "object" ? raw.args[0] : raw) as { registrationId?: string; checkpointId?: string };
    const registrationId = String(obj.registrationId ?? (typeof raw.args?.[0] === "string" ? raw.args[0] : ""));
    const checkpointId = String(obj.checkpointId ?? (typeof raw.args?.[1] === "string" ? raw.args[1] : ""));
    const [reg, checkpoint] = await Promise.all([
      db.registration.findUnique({ where: { id: registrationId }, include: { user: { select: { name: true } } } }),
      db.checkpoint.findUnique({ where: { id: checkpointId } }),
    ]);
    if (reg && checkpoint && checkpoint.scan && reg.status === "approved" && reg.eventId === checkpoint.eventId && appliesTo(checkpoint, readDetails(reg.details))) {
      if (await canAccessEvent(admin, reg.eventId) && (admin.role !== "scanner" || (await isOnDuty(admin.id, reg.eventId)))) {
        try {
          await db.scan.create({ data: { registrationId, checkpointId, adminId: admin.id } });
          await audit(admin, "Check-in manual", `${reg.user.name} · ${checkpoint.name}`);
        } catch (e) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
        }
      }
    }
    sendJson(res, { result: true });
    return true;
  }

  if (pathname === "/api/rpc/undoScan") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const raw = await readJson<{ scanId?: string; args?: unknown[] }>(req);
    const obj = (raw.args?.[0] && typeof raw.args[0] === "object" ? raw.args[0] : raw) as { scanId?: string };
    const scanId = String(obj.scanId ?? (typeof raw.args?.[0] === "string" ? raw.args[0] : ""));
    const scan = await db.scan.findUnique({
      where: { id: scanId },
      include: { registration: { include: { user: { select: { name: true } } } }, checkpoint: true },
    });
    if (scan && canUndoScan(admin, scan) && (await canAccessEvent(admin, scan.registration.eventId))) {
      await db.scan.delete({ where: { id: scanId } });
      await audit(admin, "Batalkan scan", `${scan.registration.user.name} · ${scan.checkpoint.name}`);
    }
    sendJson(res, { result: true });
    return true;
  }

  return false;
}

