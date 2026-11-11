import { randomBytes } from "node:crypto";
import { db } from "./db";
export { youtubeId } from "./youtube";

// Materi video (YouTube), kuis pilihan ganda, dan sertifikat per pelatihan.

export function parseOptions(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a.map(String) : [];
  } catch {
    return [];
  }
}

// Nomor sertifikat unik, mis. SBE-2026-4F9A2C.
const newCertificateNo = () => `SBE-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

// Terbitkan sertifikat (sekali; nomor tidak berubah bila dipanggil lagi). Mengembalikan nomor sertifikat.
export async function issueCertificate(registrationId: string): Promise<string> {
  const reg = await db.registration.findUniqueOrThrow({ where: { id: registrationId }, select: { certificateNo: true } });
  if (reg.certificateNo) return reg.certificateNo;
  for (let i = 0; i < 5; i++) {
    const no = newCertificateNo();
    try {
      // Hanya mengisi bila masih kosong, agar dua proses bersamaan tidak saling menimpa nomor.
      const { count } = await db.registration.updateMany({ where: { id: registrationId, certificateNo: null }, data: { certificateNo: no, certifiedAt: new Date() } });
      if (count === 1) return no;
    } catch {
      // nomor bentrok (sangat jarang): coba nomor lain
    }
    const now = await db.registration.findUniqueOrThrow({ where: { id: registrationId }, select: { certificateNo: true } });
    if (now.certificateNo) return now.certificateNo; // diterbitkan bersamaan oleh proses lain
  }
  throw new Error("Gagal membuat nomor sertifikat.");
}

// Syarat sertifikat: pelatihan memberi sertifikat, pendaftaran disetujui, semua video selesai (pelatihan video),
// lulus kuis (bila ada kuis), dan hadir minimal di satu pos (bila pelatihan memakai QR dan punya pos scan).
export function certificateStatus(input: {
  certificate: boolean;
  status: string;
  questions: number;
  passed: boolean;
  scans: number;
  needsAttendance: boolean;
  videos?: { total: number; done: number }; // hanya untuk pelatihan video (type "course")
}): { eligible: boolean; reason: string } {
  if (!input.certificate) return { eligible: false, reason: "Pelatihan ini tidak memberikan sertifikat." };
  if (input.status !== "approved") return { eligible: false, reason: "Pendaftaran belum disetujui." };
  if (input.videos && input.videos.done < input.videos.total) return { eligible: false, reason: `Selesaikan semua video (${input.videos.done}/${input.videos.total}).` };
  if (input.needsAttendance && input.scans === 0) return { eligible: false, reason: "Belum tercatat hadir di pelatihan." };
  if (input.questions > 0 && !input.passed) return { eligible: false, reason: "Selesaikan dan lulus kuis untuk mendapat sertifikat." };
  return { eligible: true, reason: "Memenuhi syarat sertifikat." };
}

// Status belajar satu pendaftaran: video selesai, nilai kuis terbaik, dan syarat sertifikat.
// Dipakai halaman tiket, kuis, penandaan video selesai, dan terbit sertifikat otomatis.
export async function learningState(registrationId: string) {
  const reg = await db.registration.findUniqueOrThrow({
    where: { id: registrationId },
    include: {
      event: { include: { lessons: { orderBy: { order: "asc" }, select: { id: true } }, _count: { select: { questions: true } }, checkpoints: { where: { scan: true }, select: { id: true } } } },
      progress: { select: { lessonId: true } },
      attempts: { where: { passed: true }, take: 1 },
      _count: { select: { scans: true } },
    },
  });
  const done = new Set(reg.progress.map((p) => p.lessonId));
  const course = reg.event.type === "course";
  const videos = { total: reg.event.lessons.length, done: reg.event.lessons.filter((l) => done.has(l.id)).length };
  const status = certificateStatus({
    certificate: reg.event.certificate,
    status: reg.status,
    questions: reg.event._count.questions,
    passed: reg.attempts.length > 0,
    scans: reg._count.scans,
    needsAttendance: reg.event.useQr && reg.event.checkpoints.length > 0,
    videos: course ? videos : undefined,
  });
  return { reg, course, done, videos, status };
}

// Terbitkan sertifikat bila semua syarat sudah terpenuhi (dipanggil setelah video terakhir / lulus kuis).
export async function issueIfEligible(registrationId: string) {
  const { reg, status } = await learningState(registrationId);
  return status.eligible ? issueCertificate(reg.id) : reg.certificateNo;
}
