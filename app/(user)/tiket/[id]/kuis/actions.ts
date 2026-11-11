"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueIfEligible, learningState, parseOptions } from "@/lib/learning";

export type QuizResult = { correct: number; total: number; score: number; passed: boolean; certificateNo: string | null; message?: string } | null;

// Nilai dihitung di server dari kunci jawaban (kunci tidak pernah dikirim ke browser).
// Lulus + semua syarat lain terpenuhi (mis. semua video selesai) → sertifikat langsung terbit.
export async function submitQuiz(registrationId: string, _prev: QuizResult, f: FormData): Promise<QuizResult> {
  const user = await requireUser();
  const reg = await db.registration.findFirst({
    where: { id: registrationId, userId: user.id },
    include: { event: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!reg || reg.status !== "approved") return { correct: 0, total: 0, score: 0, passed: false, certificateNo: null, message: "Kuis hanya untuk peserta yang disetujui." };
  const questions = reg.event.questions;
  if (questions.length === 0) return null;
  const { course, videos } = await learningState(reg.id);
  if (course && videos.done < videos.total) {
    return { correct: 0, total: questions.length, score: 0, passed: false, certificateNo: null, message: `Selesaikan semua video dulu (${videos.done}/${videos.total}).` };
  }

  const picked = questions.map((q) => {
    const v = f.get(`q_${q.id}`);
    const i = v === null ? -1 : Number(v);
    return Number.isInteger(i) && i >= 0 && i < parseOptions(q.options).length ? i : -1;
  });
  if (picked.includes(-1)) return { correct: 0, total: questions.length, score: 0, passed: false, certificateNo: null, message: "Jawab semua soal terlebih dahulu." };

  const correct = questions.filter((q, i) => picked[i] === q.answer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= reg.event.passScore;
  await db.quizAttempt.create({ data: { registrationId: reg.id, correct, total: questions.length, score, passed, answers: JSON.stringify(picked) } });
  const certificateNo = passed ? await issueIfEligible(reg.id) : reg.certificateNo;
  revalidatePath(`/tiket/${reg.id}`);
  return { correct, total: questions.length, score, passed, certificateNo };
}
