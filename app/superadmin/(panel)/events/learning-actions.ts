"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { digits, str } from "@/lib/form";
import { certificateStatus, issueCertificate, youtubeId } from "@/lib/learning";
import { appliesTo } from "@/lib/rundown";
import { readDetails } from "@/lib/registration-form";

const refresh = (eventId: string) => revalidatePath(`/superadmin/events/${eventId}/belajar`);

export async function saveLearningSettings(eventId: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const passScore = Math.min(100, Math.max(1, digits(f, "passScore") || 70));
  const event = await db.event.update({ where: { id: eventId }, data: { certificate: f.get("certificate") === "on", passScore } });
  await audit(admin, "Ubah pengaturan sertifikat", `${event.name} · ${event.certificate ? "sertifikat aktif" : "tanpa sertifikat"} · lulus ≥ ${passScore}%`);
  refresh(eventId);
}

// ---------- Materi video ----------
function readLesson(f: FormData) {
  const title = str(f, "title").slice(0, 160);
  const videoUrl = str(f, "videoUrl");
  if (!title) return "Judul materi wajib diisi.";
  if (!youtubeId(videoUrl)) return "Tautan YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=xxxxxxxxxxx";
  return { title, videoUrl, note: str(f, "note").slice(0, 500) };
}

export async function addLesson(eventId: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readLesson(f);
  if (typeof data === "string") return data;
  const last = await db.lesson.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
  await db.lesson.create({ data: { eventId, ...data, order: (last?.order ?? 0) + 1 } });
  await audit(admin, "Tambah materi video", data.title);
  refresh(eventId);
  return null;
}

export async function updateLesson(id: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readLesson(f);
  if (typeof data === "string") return data;
  const lesson = await db.lesson.update({ where: { id }, data });
  await audit(admin, "Ubah materi video", data.title);
  refresh(lesson.eventId);
  return null;
}

export async function deleteLesson(id: string) {
  const admin = await requireAdmin("superadmin");
  const lesson = await db.lesson.delete({ where: { id } });
  await audit(admin, "Hapus materi video", lesson.title);
  refresh(lesson.eventId);
}

// Tukar urutan dengan item tetangga di event yang sama (dipakai materi dan soal).
type Ordered = { id: string; eventId: string; order: number };
async function swap(items: Ordered[], id: string, direction: "up" | "down", save: (id: string, order: number) => Promise<unknown>) {
  const i = items.findIndex((x) => x.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= items.length) return;
  await save(items[i].id, items[j].order);
  await save(items[j].id, items[i].order);
}

export async function moveLesson(id: string, direction: "up" | "down") {
  await requireAdmin("superadmin");
  const { eventId } = await db.lesson.findUniqueOrThrow({ where: { id } });
  const items = await db.lesson.findMany({ where: { eventId }, orderBy: { order: "asc" } });
  await swap(items, id, direction, (lessonId, order) => db.lesson.update({ where: { id: lessonId }, data: { order } }));
  refresh(eventId);
}

// ---------- Kuis ----------
function readQuestion(f: FormData) {
  const text = str(f, "text").slice(0, 500);
  const options = str(f, "options").split("\n").map((o) => o.trim().slice(0, 200)).filter(Boolean).slice(0, 6);
  const answer = digits(f, "answer") - 1;
  if (!text) return "Pertanyaan wajib diisi.";
  if (options.length < 2) return "Isi minimal 2 pilihan jawaban (satu per baris).";
  if (answer < 0 || answer >= options.length) return `Jawaban benar harus nomor 1 sampai ${options.length}.`;
  return { text, options: JSON.stringify(options), answer };
}

export async function addQuestion(eventId: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readQuestion(f);
  if (typeof data === "string") return data;
  const last = await db.question.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
  await db.question.create({ data: { eventId, ...data, order: (last?.order ?? 0) + 1 } });
  await audit(admin, "Tambah soal kuis", data.text.slice(0, 80));
  refresh(eventId);
  return null;
}

// Mengubah soal tidak mengubah nilai kuis yang sudah dikerjakan peserta.
export async function updateQuestion(id: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readQuestion(f);
  if (typeof data === "string") return data;
  const q = await db.question.update({ where: { id }, data });
  await audit(admin, "Ubah soal kuis", data.text.slice(0, 80));
  refresh(q.eventId);
  return null;
}

export async function deleteQuestion(id: string) {
  const admin = await requireAdmin("superadmin");
  const q = await db.question.delete({ where: { id } });
  await audit(admin, "Hapus soal kuis", q.text.slice(0, 80));
  refresh(q.eventId);
}

export async function moveQuestion(id: string, direction: "up" | "down") {
  await requireAdmin("superadmin");
  const { eventId } = await db.question.findUniqueOrThrow({ where: { id } });
  const items = await db.question.findMany({ where: { eventId }, orderBy: { order: "asc" } });
  await swap(items, id, direction, (questionId, order) => db.question.update({ where: { id: questionId }, data: { order } }));
  refresh(eventId);
}

// ---------- Sertifikat ----------
export async function issueOne(registrationId: string) {
  const admin = await requireAdmin("superadmin");
  const reg = await db.registration.findUniqueOrThrow({ where: { id: registrationId }, include: { user: true, event: true } });
  if (reg.status !== "approved" || !reg.event.certificate) return;
  const no = await issueCertificate(reg.id);
  await audit(admin, "Terbitkan sertifikat", `${reg.user.name} · ${reg.event.name} · ${no}`);
  refresh(reg.eventId);
}

export async function revokeCertificate(registrationId: string) {
  const admin = await requireAdmin("superadmin");
  const reg = await db.registration.update({ where: { id: registrationId }, data: { certificateNo: null, certifiedAt: null }, include: { user: true, event: true } });
  await audit(admin, "Cabut sertifikat", `${reg.user.name} · ${reg.event.name}`);
  refresh(reg.eventId);
}

// Terbitkan untuk semua peserta yang memenuhi syarat (lihat certificateStatus).
export async function issueAllEligible(eventId: string) {
  const admin = await requireAdmin("superadmin");
  const event = await db.event.findUniqueOrThrow({
    where: { id: eventId },
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
  refresh(eventId);
}
