"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markLessonDone } from "@/src/lib/actions/user";
import { youtubeId } from "@/lib/youtube";
import { VideoPlayer } from "./VideoPlayer";

type Lesson = { id: string; title: string; videoUrl: string; note: string; done: boolean };

// Daftar video materi. sequential (pelatihan video): video berikutnya terkunci sampai video sebelumnya selesai.
// Video otomatis tercatat selesai saat diputar sampai habis; tombol "Tandai selesai" muncul setelah video diputar.
export function CourseLessons({ registrationId, lessons, sequential }: { registrationId: string; lessons: Lesson[]; sequential: boolean }) {
  const router = useRouter();
  const [started, setStarted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const firstOpen = lessons.findIndex((l) => !l.done);

  const finish = (lessonId: string) =>
    start(async () => {
      const r = await markLessonDone(registrationId, lessonId);
      setError(r.ok ? null : (r.message ?? "Gagal menyimpan."));
      router.refresh();
    });

  return (
    <div className="p-5">
      {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
      <ol className="grid gap-5 sm:grid-cols-2">
        {lessons.map((l, i) => {
          const locked = sequential && firstOpen >= 0 && i > firstOpen;
          const vid = youtubeId(l.videoUrl);
          return (
            <li key={l.id} className="min-w-0">
              {locked ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                  <span className="mt-1">Terbuka setelah video {i} selesai</span>
                </div>
              ) : vid ? (
                <VideoPlayer
                  id={vid}
                  title={l.title}
                  onStarted={() => setStarted((s) => new Set(s).add(l.id))}
                  onEnded={() => !l.done && finish(l.id)}
                />
              ) : (
                <p className="text-sm text-red-700">Tautan video tidak valid.</p>
              )}
              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Video {i + 1}. {l.title}</p>
                  {l.note && <p className="text-xs text-gray-600">{l.note}</p>}
                </div>
                {l.done ? (
                  <span className="shrink-0 rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">✓ Selesai</span>
                ) : (
                  !locked &&
                  started.has(l.id) && (
                    <button type="button" disabled={pending} onClick={() => finish(l.id)} className="btn btn-secondary btn-sm shrink-0">
                      Tandai selesai
                    </button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
