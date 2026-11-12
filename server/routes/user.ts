import type { IncomingMessage, ServerResponse } from "node:http";
import QRCode from "qrcode";
import { requireUser } from "../auth";
import { invalidateCache } from "../cache";
import { matchPath, parseUrl, readFormData, readJson, sendJson } from "../http";
import { db } from "../../lib/db";
import { greetingJakarta } from "../../lib/checkin";
import { getCategories } from "../../lib/event-detail";
import { PHONE_RE, str, type FormState } from "../../lib/form";
import { issueIfEligible, learningState, parseOptions } from "../../lib/learning";
import { hashPassword, verifyPassword } from "../../lib/password";
import { ensureUserQr } from "../../lib/qr";
import { getSite, parseBanks } from "../../lib/site";

export async function handleUser(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/user/dashboard") {
    const user = requireUser(req, res);
    if (!user) return true;
    const [registrations, categories, me] = await Promise.all([
      db.registration.findMany({
        where: { userId: user.id },
        include: {
          event: {
            include: {
              checkpoints: { where: { scan: true }, orderBy: { order: "asc" }, select: { id: true, name: true, kind: true, audience: true } },
            },
          },
          scans: { select: { checkpointId: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      getCategories(),
      db.user.findUnique({ where: { id: user.id }, select: { name: true, image: true } }),
    ]);
    const needsQr = registrations.some((r) => r.status === "approved" && r.event.useQr);
    const myQr = needsQr ? await QRCode.toDataURL(await ensureUserQr(user.id), { width: 360, margin: 1 }) : null;
    sendJson(res, {
      greeting: greetingJakarta(),
      firstName: (user.name ?? "").split(" ")[0] || "Peserta",
      registrations,
      categories,
      me,
      myQr,
    });
    return true;
  }

  const ticketQuizParams = method === "GET" ? matchPath("/api/user/ticket/:id/quiz", pathname) : null;
  if (ticketQuizParams) {
    const user = requireUser(req, res);
    if (!user) return true;
    const reg = await db.registration.findFirst({
      where: { id: ticketQuizParams.id, userId: user.id, status: "approved" },
      include: {
        event: { include: { questions: { orderBy: { order: "asc" } } } },
        attempts: { orderBy: { score: "desc" }, take: 1 },
      },
    });
    if (!reg || reg.event.questions.length === 0) {
      sendJson(res, { error: "Kuis tidak ditemukan." }, 404);
      return true;
    }
    const { course, videos } = await learningState(reg.id);
    sendJson(res, {
      registrationId: reg.id,
      eventName: reg.event.name,
      passScore: reg.event.passScore,
      bestScore: reg.attempts[0]?.score ?? null,
      blocked: course && videos.done < videos.total,
      videos,
      questions: reg.event.questions.map((q) => ({ id: q.id, text: q.text, options: parseOptions(q.options) })),
    });
    return true;
  }

  const ticketParams = method === "GET" ? matchPath("/api/user/ticket/:id", pathname) : null;
  if (ticketParams) {
    const user = requireUser(req, res);
    if (!user) return true;
    const reg = await db.registration.findFirst({
      where: { id: ticketParams.id, userId: user.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, organization: true, image: true } },
        scans: true,
        event: {
          include: {
            checkpoints: { where: { scan: true }, orderBy: { order: "asc" } },
            lessons: { orderBy: { order: "asc" } },
            _count: { select: { questions: true } },
          },
        },
        attempts: { orderBy: { score: "desc" }, take: 1 },
        progress: { select: { lessonId: true } },
      },
    });
    if (!reg) {
      sendJson(res, { error: "Tiket tidak ditemukan." }, 404);
      return true;
    }
    const qr = reg.status === "approved" && reg.event.useQr
      ? await QRCode.toDataURL(await ensureUserQr(user.id), { width: 340, margin: 1 })
      : null;
    const banks = parseBanks((await getSite()).banks);
    sendJson(res, { reg, qr, banks });
    return true;
  }

  if (method === "GET" && pathname === "/api/user/account") {
    const session = requireUser(req, res);
    if (!session) return true;
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, image: true, phone: true, organization: true, emailVerified: true },
    });
    sendJson(res, { user });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/updateProfile") {
    const user = requireUser(req, res);
    if (!user) return true;
    const f = await readFormData(req);
    const name = str(f, "name");
    const phone = str(f, "phone");
    const organization = str(f, "organization");
    let result: FormState;
    if (!name) result = { ok: false, message: "Nama wajib diisi." };
    else if (name.length > 100 || organization.length > 150) result = { ok: false, message: "Nama atau instansi terlalu panjang." };
    else if (phone && !PHONE_RE.test(phone)) result = { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." };
    else {
      await db.user.update({ where: { id: user.id }, data: { name, phone: phone || null, organization: organization || null } });
      result = { ok: true, message: "Profil tersimpan." };
    }
    sendJson(res, { result });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/cancelRegistration") {
    const user = requireUser(req, res);
    if (!user) return true;
    const qId = parseUrl(req).searchParams.getAll("a")[0];
    let registrationId = qId ?? "";
    if (!registrationId && !(req.headers["content-type"] || "").includes("multipart/form-data")) {
      const body = await readJson<{ registrationId?: string; args?: string[] }>(req);
      registrationId = String(body.args?.[0] ?? body.registrationId ?? "");
    }
    if (registrationId) {
      await db.registration.deleteMany({ where: { id: registrationId, userId: user.id, status: "pending" } });
      invalidateCache("public:");
    }
    sendJson(res, { result: true, redirect: "/dashboard" });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/changeUserPassword") {
    const session = requireUser(req, res);
    if (!session) return true;
    const f = await readFormData(req);
    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) {
      sendJson(res, { result: { ok: false, message: "Akun tidak ditemukan." } });
      return true;
    }
    const current = String(f.get("current") ?? "");
    const next = String(f.get("next") ?? "");
    let result: FormState;
    if (user.passwordHash && !verifyPassword(current, user.passwordHash)) {
      result = { ok: false, message: "Password lama salah." };
    } else if (user.passwordHash && next === current) {
      result = { ok: false, message: "Password baru harus berbeda dari yang lama." };
    } else if (!user.passwordHash && !user.emailVerified) {
      result = { ok: false, message: "Masuk dengan Google sekali untuk memverifikasi email sebelum membuat password." };
    } else if (next.length < 8) {
      result = { ok: false, message: "Password baru minimal 8 karakter." };
    } else if (next !== String(f.get("confirm") ?? "")) {
      result = { ok: false, message: "Konfirmasi password baru tidak sama." };
    } else {
      await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next), failedLogins: 0, lockedUntil: null } });
      result = {
        ok: true,
        message: user.passwordHash ? "Password berhasil diganti." : "Password dibuat. Sekarang Anda juga bisa masuk dengan email dan password.",
      };
    }
    sendJson(res, { result });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/markLessonDone") {
    const user = requireUser(req, res);
    if (!user) return true;
    const raw = await readJson<{ registrationId?: string; lessonId?: string; args?: unknown[] }>(req);
    const obj = (raw.args?.[0] && typeof raw.args[0] === "object" ? raw.args[0] : raw) as { registrationId?: string; lessonId?: string };
    const registrationId = String(obj.registrationId ?? raw.args?.[0] ?? "");
    const lessonId = String(obj.lessonId ?? raw.args?.[1] ?? "");
    const reg = await db.registration.findFirst({
      where: { id: registrationId, userId: user.id, status: "approved" },
      include: { event: { include: { lessons: { orderBy: { order: "asc" }, select: { id: true } } } }, progress: { select: { lessonId: true } } },
    });
    if (!reg) return sendJson(res, { result: { ok: false, message: "Materi hanya untuk peserta yang disetujui." } }), true;
    const index = reg.event.lessons.findIndex((l) => l.id === lessonId);
    if (index < 0) return sendJson(res, { result: { ok: false, message: "Video tidak ditemukan." } }), true;
    const done = new Set(reg.progress.map((p) => p.lessonId));
    if (reg.event.type === "course" && reg.event.lessons.slice(0, index).some((l) => !done.has(l.id))) {
      return sendJson(res, { result: { ok: false, message: "Selesaikan video sebelumnya terlebih dahulu." } }), true;
    }
    await db.lessonProgress.upsert({
      where: { registrationId_lessonId: { registrationId: reg.id, lessonId } },
      update: {},
      create: { registrationId: reg.id, lessonId },
    });
    const certificateNo = await issueIfEligible(reg.id);
    sendJson(res, { result: { ok: true, certificateNo } });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/submitQuiz") {
    const user = requireUser(req, res);
    if (!user) return true;
    const url = parseUrl(req);
    const f = await readFormData(req);
    const registrationId = url.searchParams.get("registrationId") || url.searchParams.getAll("a")[0] || String(f.get("_registrationId") ?? "");
    const reg = await db.registration.findFirst({
      where: { id: registrationId, userId: user.id },
      include: { event: { include: { questions: { orderBy: { order: "asc" } } } } },
    });
    if (!reg || reg.status !== "approved") {
      return sendJson(res, { result: { correct: 0, total: 0, score: 0, passed: false, certificateNo: null, message: "Kuis hanya untuk peserta yang disetujui." } }), true;
    }
    const questions = reg.event.questions;
    if (questions.length === 0) return sendJson(res, { result: null }), true;
    const { course, videos } = await learningState(reg.id);
    if (course && videos.done < videos.total) {
      return sendJson(res, {
        result: { correct: 0, total: questions.length, score: 0, passed: false, certificateNo: null, message: `Selesaikan semua video dulu (${videos.done}/${videos.total}).` },
      }), true;
    }
    const picked = questions.map((q) => {
      const v = f.get(`q_${q.id}`);
      const i = v === null ? -1 : Number(v);
      return Number.isInteger(i) && i >= 0 && i < parseOptions(q.options).length ? i : -1;
    });
    if (picked.includes(-1)) {
      return sendJson(res, {
        result: { correct: 0, total: questions.length, score: 0, passed: false, certificateNo: null, message: "Jawab semua soal terlebih dahulu." },
      }), true;
    }
    const correct = questions.filter((q, i) => picked[i] === q.answer).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= reg.event.passScore;
    await db.quizAttempt.create({
      data: { registrationId: reg.id, correct, total: questions.length, score, passed, answers: JSON.stringify(picked) },
    });
    const certificateNo = passed ? await issueIfEligible(reg.id) : reg.certificateNo;
    sendJson(res, { result: { correct, total: questions.length, score, passed, certificateNo } });
    return true;
  }

  return false;
}
