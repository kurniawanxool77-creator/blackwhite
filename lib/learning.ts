import { randomBytes } from "node:crypto";
import { certificateStatus } from "./certificate";
import { db } from "./db";
export { certificateStatus, parseOptions } from "./certificate";
export { youtubeId } from "./youtube";

// Materi video (YouTube), kuis pilihan ganda, dan sertifikat per pelatihan.

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

// Syarat sertifikat berada di ./certificate (client-safe).

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
