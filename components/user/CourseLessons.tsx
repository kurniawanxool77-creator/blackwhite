"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markLessonDone } from "@/src/lib/actions/user";
import { youtubeId } from "@/lib/youtube";
import { VideoPlayer } from "./VideoPlayer";

type Lesson = { id: string; title: string; videoUrl: string; note: string; done: boolean };

// Tampilan LMS Video Player 1 Halaman:
// - Sebelah kiri/utama: Video Player aktif, judul, tombol selesai/lanjut, dan deskripsi materi ke bawah
// - Sebelah kanan/pinggir: Daftar playlist materi video, video berikutnya terkunci sampai video sebelumnya selesai
export function CourseLessons({
  registrationId,
  lessons,
  sequential,
  questionCount = 0,
  certificateNo = null,
  hasPassedQuiz = false,
}: {
  registrationId: string;
  lessons: Lesson[];
  sequential: boolean;
  questionCount?: number;
  certificateNo?: string | null;
  hasPassedQuiz?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Cari video pertama yang belum selesai sebagai default aktif
  const firstOpen = lessons.findIndex((l) => !l.done);
  const defaultIdx = firstOpen >= 0 ? firstOpen : 0;
  const [activeIndex, setActiveIndex] = useState(defaultIdx);

  const activeLesson = lessons[activeIndex] ?? lessons[0];
  const currentVidId = activeLesson ? youtubeId(activeLesson.videoUrl) : null;
  const completedCount = lessons.filter((l) => l.done).length;
  const allVideosDone = completedCount === lessons.length;

  const finish = (lessonId: string) =>
    start(async () => {
      const r = await markLessonDone(registrationId, lessonId);
      if (!r.ok) {
        setError(r.message ?? "Gagal menyimpan progres.");
        return;
      }
      setError(null);
      // Jika ada video berikutnya, otomatis berpindah ke video selanjutnya
      if (activeIndex + 1 < lessons.length) {
        setActiveIndex(activeIndex + 1);
      }
      router.refresh();
    });

  if (lessons.length === 0) return null;

  return (
    <div className="p-4 sm:p-5">
      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Utama: Video Player Aktif & Deskripsi Lengkap ke Bawah */}
        <div className="space-y-4 lg:col-span-8">
          {/* Box Pemutar Video */}
          <div className="overflow-hidden rounded-md border border-gray-200 bg-black shadow-xs">
            {currentVidId ? (
              <VideoPlayer
                key={activeLesson.id}
                id={currentVidId}
                title={activeLesson.title}
                onEnded={() => !activeLesson.done && finish(activeLesson.id)}
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center bg-gray-900 text-center text-sm text-gray-400 p-6">
                <p>Tautan video YouTube tidak valid untuk materi ini.</p>
                {activeLesson.videoUrl && (
                  <a
                    href={activeLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-xs text-brand hover:underline"
                  >
                    Buka tautan asli ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Kartu Detail Materi Aktif & Aksi */}
          <div className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Materi {activeIndex + 1} dari {lessons.length}
                </span>
                <h3 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
                  {activeLesson.title}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {allVideosDone ? (
                  questionCount > 0 && !hasPassedQuiz ? (
                    <Link
                      href={`/tiket/${registrationId}/kuis`}
                      className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold"
                    >
                      Lanjut ke Kuis / Ujian ({questionCount} Soal) →
                    </Link>
                  ) : certificateNo ? (
                    <a
                      href={`/sertifikat/${certificateNo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold"
                    >
                      Lihat Sertifikat 🏆
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                      ✓ Semua Materi Selesai
                    </span>
                  )
                ) : activeLesson.done ? (
                  <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    ✓ Selesai
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => finish(activeLesson.id)}
                    className="btn btn-primary btn-sm"
                  >
                    {pending ? "Menyimpan..." : "Tandai Selesai & Lanjut →"}
                  </button>
                )}
              </div>
            </div>

            {/* Deskripsi & Catatan Materi ke bawah jelas */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                Deskripsi & Catatan Materi
              </h4>
              <div className="mt-2 text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                {activeLesson.note ? (
                  activeLesson.note
                ) : (
                  <p className="italic text-gray-400">Tidak ada catatan tambahan untuk materi ini.</p>
                )}
              </div>
              {activeLesson.videoUrl && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <a
                    href={activeLesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                  >
                    Tonton di YouTube ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Pinggir: Daftar Playlist Materi Video */}
        <div className="lg:col-span-4">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-900">Daftar Materi Video</h3>
              {allVideosDone ? (
                <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                  ✓ Semua {lessons.length} materi telah selesai
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-gray-500">
                  {completedCount} dari {lessons.length} materi selesai
                </p>
              )}
            </div>

            <ol className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {lessons.map((l, i) => {
                const isLocked = sequential && firstOpen >= 0 && i > firstOpen;
                const isActive = i === activeIndex;

                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => !isLocked && setActiveIndex(i)}
                      className={`w-full p-3.5 text-left transition flex items-start gap-3 ${
                        isActive
                          ? "bg-emerald-50/60 border-l-4 border-brand font-medium"
                          : isLocked
                          ? "cursor-not-allowed opacity-60 bg-gray-50/50"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                      title={isLocked ? `Selesaikan video materi ${i} terlebih dahulu` : `Buka materi: ${l.title}`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          l.done
                            ? "bg-emerald-600 text-white"
                            : isLocked
                            ? "border border-gray-300 bg-gray-100 text-gray-400"
                            : isActive
                            ? "bg-brand text-white"
                            : "border border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        {l.done ? "✓" : isLocked ? "🔒" : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold leading-snug line-clamp-2 ${isActive ? "text-gray-900" : "text-gray-700"}`}>
                          {i + 1}. {l.title}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {l.done ? (
                            <span className="text-[10px] font-semibold text-emerald-700">✓ Selesai</span>
                          ) : isLocked ? (
                            <span className="text-[10px] font-medium text-amber-700 flex items-center gap-1">
                              🔒 Terkunci (selesaikan materi {i})
                            </span>
                          ) : isActive ? (
                            <span className="text-[10px] font-semibold text-brand">Sedang dibuka</span>
                          ) : (
                            <span className="text-[10px] text-gray-500">Siap ditonton</span>
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
