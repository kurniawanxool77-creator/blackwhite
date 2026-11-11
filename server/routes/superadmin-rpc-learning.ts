import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "../auth";
import { bodyArgs, queryArgs, readFormData, sendJson } from "../http";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { digits, str } from "@/lib/form";
import { certificateStatus, issueCertificate, youtubeId } from "@/lib/learning";
import { nextCodes } from "@/lib/participant-code";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";

function readLesson(f: FormData) {
  const title = str(f, "title").slice(0, 160);
  const videoUrl = str(f, "videoUrl");
  if (!title) return "Judul materi wajib diisi.";
  if (!youtubeId(videoUrl)) return "Tautan YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=xxxxxxxxxxx";
  return { title, videoUrl, note: str(f, "note").slice(0, 500) };
}

function readQuestion(f: FormData) {
  const text = str(f, "text").slice(0, 500);
  const options = str(f, "options").split("\n").map((o) => o.trim().slice(0, 200)).filter(Boolean).slice(0, 6);
  const answer = digits(f, "answer") - 1;
  if (!text) return "Pertanyaan wajib diisi.";
  if (options.length < 2) return "Isi minimal 2 pilihan jawaban (satu per baris).";
  if (answer < 0 || answer >= options.length) return `Jawaban benar harus nomor 1 sampai ${options.length}.`;
  return { text, options: JSON.stringify(options), answer };
}

async function approveRegs(eventId: string, ids: string[] | null) {
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

const ACTIONS = new Set([
  "saveLearningSettings", "addLesson", "updateLesson", "deleteLesson", "moveLesson",
  "addQuestion", "updateQuestion", "deleteQuestion", "moveQuestion",
  "issueOne", "revokeCertificate", "issueAllEligible",
  "approveRegistrations", "importParticipants", "deleteRegistration", "deleteUser", "rejectRegistration",
]);

export async function handleSuperadminLearningRpc(req: IncomingMessage, res: ServerResponse, action: string): Promise<boolean> {
  if (!ACTIONS.has(action)) return false;

  const admin = await requireAdmin(req, res, "superadmin");
  if (!admin) return true;

  if (action === "saveLearningSettings") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const passScore = Math.min(100, Math.max(1, digits(f, "passScore") || 70));
    const event = await db.event.update({ where: { id: eventId }, data: { certificate: f.get("certificate") === "on", passScore } });
    await audit(admin, "Ubah pengaturan sertifikat", `${event.name} · ${event.certificate ? "sertifikat aktif" : "tanpa sertifikat"} · lulus ≥ ${passScore}%`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "addLesson") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const data = readLesson(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const last = await db.lesson.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
    await db.lesson.create({ data: { eventId, ...data, order: (last?.order ?? 0) + 1 } });
    await audit(admin, "Tambah materi video", data.title);
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateLesson") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const data = readLesson(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    await db.lesson.update({ where: { id }, data });
    await audit(admin, "Ubah materi video", data.title);
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteLesson") {
    const [id] = await bodyArgs(req);
    const lesson = await db.lesson.delete({ where: { id: String(id) } });
    await audit(admin, "Hapus materi video", lesson.title);
    return sendJson(res, { result: null }), true;
  }

  if (action === "moveLesson") {
    const [id, direction] = await bodyArgs(req);
    const { eventId } = await db.lesson.findUniqueOrThrow({ where: { id: String(id) } });
    const items = await db.lesson.findMany({ where: { eventId }, orderBy: { order: "asc" } });
    const i = items.findIndex((x) => x.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < items.length) {
      await db.$transaction([
        db.lesson.update({ where: { id: items[i].id }, data: { order: items[j].order } }),
        db.lesson.update({ where: { id: items[j].id }, data: { order: items[i].order } }),
      ]);
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "addQuestion") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const data = readQuestion(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const last = await db.question.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
    await db.question.create({ data: { eventId, ...data, order: (last?.order ?? 0) + 1 } });
    await audit(admin, "Tambah soal kuis", data.text.slice(0, 80));
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateQuestion") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const data = readQuestion(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    await db.question.update({ where: { id }, data });
    await audit(admin, "Ubah soal kuis", data.text.slice(0, 80));
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteQuestion") {
    const [id] = await bodyArgs(req);
    const q = await db.question.delete({ where: { id: String(id) } });
    await audit(admin, "Hapus soal kuis", q.text.slice(0, 80));
    return sendJson(res, { result: null }), true;
  }

  if (action === "moveQuestion") {
    const [id, direction] = await bodyArgs(req);
    const { eventId } = await db.question.findUniqueOrThrow({ where: { id: String(id) } });
    const items = await db.question.findMany({ where: { eventId }, orderBy: { order: "asc" } });
    const i = items.findIndex((x) => x.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < items.length) {
      await db.$transaction([
        db.question.update({ where: { id: items[i].id }, data: { order: items[j].order } }),
        db.question.update({ where: { id: items[j].id }, data: { order: items[i].order } }),
      ]);
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "issueOne") {
    const [registrationId] = await bodyArgs(req);
    const reg = await db.registration.findUniqueOrThrow({ where: { id: String(registrationId) }, include: { user: true, event: true } });
    if (reg.status === "approved" && reg.event.certificate) {
      const no = await issueCertificate(reg.id);
      await audit(admin, "Terbitkan sertifikat", `${reg.user.name} · ${reg.event.name} · ${no}`);
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "revokeCertificate") {
    const [registrationId] = await bodyArgs(req);
    const reg = await db.registration.update({ where: { id: String(registrationId) }, data: { certificateNo: null, certifiedAt: null }, include: { user: true, event: true } });
    await audit(admin, "Cabut sertifikat", `${reg.user.name} · ${reg.event.name}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "issueAllEligible") {
    const [eventId] = await bodyArgs(req);
    const event = await db.event.findUniqueOrThrow({
      where: { id: String(eventId) },
      include: {
        _count: { select: { questions: true } },
        checkpoints: { where: { scan: true }, select: { audience: true } },
        lessons: { select: { id: true } },
        registrations: { where: { status: "approved", certificateNo: null }, include: { attempts: { where: { passed: true }, take: 1 }, progress: { select: { lessonId: true } }, _count: { select: { scans: true } } } },
      },
    });
    let issued = 0;
    for (const r of event.registrations) {
      const hasPoints = event.checkpoints.some((c) => appliesTo(c, readDetails(r.details)));
      const videos = event.type === "course" ? { total: event.lessons.length, done: event.lessons.filter((l) => r.progress.some((p) => p.lessonId === l.id)).length } : undefined;
      const s = certificateStatus({ certificate: event.certificate, status: r.status, questions: event._count.questions, passed: r.attempts.length > 0, scans: r._count.scans, needsAttendance: event.useQr && hasPoints, videos });
      if (!s.eligible) continue;
      await issueCertificate(r.id);
      issued++;
    }
    await audit(admin, "Terbitkan sertifikat massal", `${event.name} · ${issued} peserta`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "approveRegistrations") {
    const [eventId, ids] = await bodyArgs(req);
    const count = await approveRegs(String(eventId), Array.isArray(ids) ? ids.map(String) : null);
    await audit(admin, "Setujui pendaftaran", `${count} peserta · event ${eventId}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "importParticipants") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const lines = str(f, "rows").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newIds: string[] = [];
    const invalid: number[] = [];
    let existing = 0;
    for (const [i, line] of lines.entries()) {
      const [name = "", rawEmail = "", phone = "", ...org] = (line.includes("\t") ? line.split("\t") : line.split(/[,;]/)).map((s) => s.trim());
      const email = rawEmail.toLowerCase();
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) { invalid.push(i + 1); continue; }
      const organization = org.join(", ").trim() || null;
      const user = await db.user.upsert({ where: { email }, update: {}, create: { email, name, phone: phone || null, organization } });
      const found = await db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId } } });
      if (found) { existing++; continue; }
      newIds.push((await db.registration.create({ data: { userId: user.id, eventId } })).id);
    }
    const approved = f.get("approve") && newIds.length ? await approveRegs(eventId, newIds) : 0;
    await audit(admin, "Impor peserta", `${newIds.length} baru · ${approved} disetujui · event ${eventId}`);
    const summary = [
      `${newIds.length} peserta ditambahkan`,
      f.get("approve") ? `${approved} disetujui${approved < newIds.length ? " (sisanya menunggu karena kuota)" : ""}` : "",
      existing ? `${existing} sudah terdaftar` : "",
      invalid.length ? `baris tidak valid: ${invalid.join(", ")}` : "",
    ].filter(Boolean).join(", ") + ".";
    return sendJson(res, { result: summary }), true;
  }

  if (action === "deleteRegistration") {
    const [id] = await bodyArgs(req);
    const reg = await db.registration.delete({ where: { id: String(id) }, include: { user: true, event: true } });
    await audit(admin, "Hapus pendaftaran", `${reg.user.name} · ${reg.event.name}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteUser") {
    const [userId] = await bodyArgs(req);
    const user = await db.user.delete({ where: { id: String(userId) }, include: { _count: { select: { registrations: true } } } });
    await audit(admin, "Hapus akun peserta", `${user.name} (${user.email}) · ${user._count.registrations} pendaftaran`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "rejectRegistration") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const reg = await db.registration.update({
      where: { id },
      data: { status: "rejected", rejectReason: str(f, "reason") || null, qrToken: null },
    });
    await audit(admin, "Tolak pendaftaran", `${id}${reg.rejectReason ? ` · ${reg.rejectReason}` : ""}`);
    return sendJson(res, { result: null }), true;
  }

  return false;
}
