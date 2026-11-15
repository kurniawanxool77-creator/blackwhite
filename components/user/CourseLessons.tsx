"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markLessonDone } from "@/src/lib/actions/user";
import { youtubeId } from "@/lib/youtube";
import { VideoPlayer } from "./VideoPlayer";
import { CourseQuizInline } from "./CourseQuizInline";
import { CourseCertificateInline } from "./CourseCertificateInline";

type Lesson = { id: string; title: string; videoUrl: string; note: string; done: boolean };
type Question = { id: string; text: string; options: string };

type ItemKind = "lesson" | "quiz" | "certificate";

type CourseItem = {
  id: string;
  kind: ItemKind;
  number: number;
  title: string;
  done: boolean;
  locked: boolean;
  lesson?: Lesson;
};

export function CourseLessons({
  registrationId,
  lessons,
  sequential,
  questions = [],
  passScore = 70,
  best = null,
  certificate = false,
  certificateNo = null,
  eventName = "",
  userName = "",
}: {
  registrationId: string;
  lessons: Lesson[];
  sequential: boolean;
  questions?: Question[];
  passScore?: number;
  best?: { score: number; passed: boolean } | null;
  certificate?: boolean;
  certificateNo?: string | null;
  eventName?: string;
  userName?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const firstUnfinishedLessonIdx = lessons.findIndex((l) => !l.done);
  const allVideosDone = lessons.every((l) => l.done);
  const hasQuiz = questions.length > 0;
  const quizPassed = Boolean(best?.passed);

  // Buat daftar kurikulum terpadu (1. Materi, 2. Materi, 3. Kuis, 4. Sertifikat)
  const items: CourseItem[] = [];
  let itemCounter = 1;

  lessons.forEach((l, i) => {
    const isLocked = sequential && firstUnfinishedLessonIdx >= 0 && i > firstUnfinishedLessonIdx;
    items.push({
      id: l.id,
      kind: "lesson",
      number: itemCounter++,
      title: l.title,
      done: l.done,
      locked: isLocked,
      lesson: l,
    });
  });

  if (hasQuiz) {
    const quizLocked = sequential && !allVideosDone;
    items.push({
      id: "course-quiz",
      kind: "quiz",
      number: itemCounter++,
      title: `Kuis & Evaluasi (${questions.length} Soal)`,
      done: quizPassed,
      locked: quizLocked,
    });
  }

  if (certificate) {
    const certLocked = !allVideosDone || (hasQuiz && !quizPassed);
    items.push({
      id: "course-cert",
      kind: "certificate",
      number: itemCounter++,
      title: "Sertifikat Kelulusan",
      done: Boolean(certificateNo),
      locked: certLocked,
    });
  }

  // Tentukan item default aktif
  const defaultItemId = (() => {
    if (firstUnfinishedLessonIdx >= 0) {
      return lessons[firstUnfinishedLessonIdx]?.id ?? items[0]?.id;
    }
    if (hasQuiz && !quizPassed) {
      return "course-quiz";
    }
    if (certificate && certificateNo) {
      return "course-cert";
    }
    return items[0]?.id;
  })();

  const [activeId, setActiveId] = useState<string>(defaultItemId || "0");
  const activeItem = items.find((it) => it.id === activeId) ?? items[0];

  const finishLesson = (lessonId: string) =>
    start(async () => {
      const r = await markLessonDone(registrationId, lessonId);
      if (!r.ok) {
        setError(r.message ?? "Gagal menyimpan progres.");
        return;
      }
      setError(null);
      // Pindah ke item berikutnya dalam kurikulum
      const currIdx = items.findIndex((it) => it.id === lessonId);
      if (currIdx >= 0 && currIdx + 1 < items.length) {
        setActiveId(items[currIdx + 1].id);
      }
      router.refresh();
    });

  if (items.length === 0) return null;

  return (
    <div className="p-3 sm:p-5">
      {error && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Kolom Utama: Konten Aktif (Video Player / Kuis / Sertifikat) */}
        <div className="space-y-3 sm:space-y-4 lg:col-span-8">
          {activeItem?.kind === "lesson" && activeItem.lesson && (
            <>
              {/* Box Pemutar Video */}
              <div className="overflow-hidden rounded-md border border-gray-200 bg-black shadow-xs">
                {youtubeId(activeItem.lesson.videoUrl) ? (
                  <VideoPlayer
                    key={activeItem.lesson.id}
                    id={youtubeId(activeItem.lesson.videoUrl)!}
                    title={activeItem.lesson.title}
                    onEnded={() => !activeItem.lesson?.done && finishLesson(activeItem.lesson!.id)}
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center bg-gray-900 text-center text-xs text-gray-400 p-4 sm:p-6">
                    <p>Tautan video YouTube tidak valid untuk materi ini.</p>
                  </div>
                )}
              </div>

              {/* Kartu Detail Materi */}
              <div className="card p-3.5 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-gray-100 pb-3 sm:pb-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-brand uppercase">
                      Materi {activeItem.number} dari {items.length}
                    </span>
                    <h3 className="mt-0.5 text-sm sm:text-lg font-bold text-gray-900 leading-snug">
                      {activeItem.title}
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {activeItem.done ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        ✓ Selesai
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => finishLesson(activeItem.lesson!.id)}
                        className="btn btn-primary btn-sm text-xs w-full sm:w-auto"
                      >
                        {pending ? "Menyimpan..." : "Tandai Selesai & Lanjut →"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  <h4 className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Deskripsi & Catatan Materi
                  </h4>
                  <div className="mt-1.5 text-xs sm:text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                    {activeItem.lesson.note || <span className="italic text-gray-400">Tidak ada catatan tambahan.</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeItem?.kind === "quiz" && (
            <CourseQuizInline
              registrationId={registrationId}
              questions={questions}
              passScore={passScore}
              best={best}
              onPassed={() => {
                if (certificate) setActiveId("course-cert");
                router.refresh();
              }}
            />
          )}

          {activeItem?.kind === "certificate" && (
            <CourseCertificateInline
              certificateNo={certificateNo}
              userName={userName}
              eventName={eventName}
              locked={activeItem.locked}
            />
          )}
        </div>

        {/* Kolom Pinggir: Daftar Urutan Kurikulum Pembelajaran */}
        <div className="lg:col-span-4">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-3.5 sm:px-4 py-2.5 sm:py-3">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">Kurikulum & Alur Belajar</h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500">
                {items.filter((it) => it.done).length} dari {items.length} tahapan selesai
              </p>
            </div>

            <ol className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
              {items.map((it) => {
                const isActive = it.id === activeId;

                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      disabled={it.locked}
                      onClick={() => !it.locked && setActiveId(it.id)}
                      className={`w-full p-2.5 sm:p-3 text-left transition flex items-start gap-2.5 sm:gap-3 ${
                        isActive
                          ? "bg-emerald-50/60 border-l-4 border-brand font-medium"
                          : it.locked
                          ? "cursor-not-allowed opacity-60 bg-gray-50/50"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold ${
                          it.done
                            ? "bg-emerald-600 text-white"
                            : it.locked
                            ? "border border-gray-300 bg-gray-100 text-gray-400"
                            : isActive
                            ? "bg-brand text-white"
                            : "border border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {it.done ? "✓" : it.locked ? "🔒" : it.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] sm:text-xs font-semibold leading-snug line-clamp-2 ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                          {it.number}. {it.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {it.done ? (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700">✓ Selesai</span>
                          ) : it.locked ? (
                            <span className="text-[9px] sm:text-[10px] font-medium text-amber-700">
                              🔒 Terkunci (selesaikan tahapan sebelumnya)
                            </span>
                          ) : isActive ? (
                            <span className="text-[9px] sm:text-[10px] font-semibold text-brand">Sedang dibuka</span>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] text-gray-500">Siap dipelajari</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
