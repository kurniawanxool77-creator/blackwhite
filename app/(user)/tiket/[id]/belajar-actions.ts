"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { issueIfEligible } from "@/lib/learning";

// Tandai satu video selesai ditonton. Pelatihan video: harus berurutan (video sebelumnya selesai dulu).
// Bila ini syarat terakhir, sertifikat langsung terbit.
export async function markLessonDone(registrationId: string, lessonId: string): Promise<{ ok: boolean; message?: string; certificateNo?: string | null }> {
  const user = await requireUser();
  const reg = await db.registration.findFirst({
    where: { id: registrationId, userId: user.id, status: "approved" },
    include: { event: { include: { lessons: { orderBy: { order: "asc" }, select: { id: true } } } }, progress: { select: { lessonId: true } } },
  });
  if (!reg) return { ok: false, message: "Materi hanya untuk peserta yang disetujui." };
  const index = reg.event.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return { ok: false, message: "Video tidak ditemukan." };
  const done = new Set(reg.progress.map((p) => p.lessonId));
  if (reg.event.type === "course" && reg.event.lessons.slice(0, index).some((l) => !done.has(l.id))) {
    return { ok: false, message: "Selesaikan video sebelumnya terlebih dahulu." };
  }
  await db.lessonProgress.upsert({
    where: { registrationId_lessonId: { registrationId: reg.id, lessonId } },
    update: {},
    create: { registrationId: reg.id, lessonId },
  });
  const certificateNo = await issueIfEligible(reg.id);
  revalidatePath(`/tiket/${reg.id}`);
  return { ok: true, certificateNo };
}
