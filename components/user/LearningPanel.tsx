import Link from "next/link";
import { AwardIcon, PlayIcon } from "@/components/ui/icons";
import { certificateStatus } from "@/lib/certificate";
import { CourseLessons } from "./CourseLessons";

type Question = { id: string; text: string; options: string };

type Props = {
  registrationId: string;
  status: string;
  certificateNo: string | null;
  event: { name: string; type: string; certificate: boolean; passScore: number; useQr: boolean };
  lessons: { id: string; title: string; videoUrl: string; note: string }[];
  questions?: Question[];
  doneLessonIds: string[];
  questionCount: number;
  best: { score: number; passed: boolean } | null;
  scans: number;
  hasScanPoints: boolean;
  userName?: string;
};

// Bagian belajar di halaman tiket:
// Untuk kursus mandiri (course), materi, kuis, dan sertifikat disatukan dalam alur 1 halaman berurutan.
// Untuk event tatap muka/webinar, kuis dan sertifikat ditampilkan dalam panel terpisah.
export function LearningPanel({
  registrationId,
  status,
  certificateNo,
  event,
  lessons,
  questions = [],
  doneLessonIds,
  questionCount,
  best,
  scans,
  hasScanPoints,
  userName = "",
}: Props) {
  if (lessons.length === 0 && questionCount === 0 && !event.certificate) return null;
  const approved = status === "approved";
  const course = event.type === "course";
  const done = new Set(doneLessonIds);
  const videos = { total: lessons.length, done: lessons.filter((l) => done.has(l.id)).length };
  const allVideosDone = videos.done === videos.total;
  const cert = certificateStatus({
    certificate: event.certificate,
    status,
    questions: questionCount,
    passed: Boolean(best?.passed),
    scans,
    needsAttendance: !course && event.useQr && hasScanPoints,
    videos: course ? videos : undefined,
    isCourse: course,
  });
  const pct = videos.total ? Math.round((videos.done / videos.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {lessons.length > 0 && (
        <section className="card">
          <div className="border-b border-gray-200 px-3.5 sm:px-5 py-2.5 sm:py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-gray-900">
                <PlayIcon width={16} height={16} className="text-brand sm:w-[18px] sm:h-[18px]" /> {course ? "Kurikulum Pembelajaran" : "Materi Video"}
              </h2>
              {approved && <span className="text-xs sm:text-sm font-semibold text-gray-700 tabular-nums">{videos.done}/{videos.total} materi selesai</span>}
            </div>
            {approved && (
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={videos.total} aria-valuenow={videos.done} aria-label="Progres video">
                <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
            {course && approved && (
              <p className="mt-1.5 text-[11px] sm:text-xs text-gray-500">
                Pelajari materi berurutan sampai selesai. Kuis evaluasi dan sertifikat akan terbuka otomatis setelahnya.
              </p>
            )}
          </div>
          {approved ? (
            <CourseLessons
              registrationId={registrationId}
              sequential={course}
              lessons={lessons.map((l) => ({ ...l, done: done.has(l.id) }))}
              questions={questions}
              passScore={event.passScore}
              best={best}
              certificate={event.certificate}
              certificateNo={certificateNo}
              eventName={event.name}
              userName={userName}
            />
          ) : (
            <p className="px-5 py-4 text-sm text-gray-600">Materi terbuka setelah pendaftaran disetujui.</p>
          )}
        </section>
      )}

      {/* Bagian Kuis & Sertifikat terpisah HANYA jika event non-course (tatap muka / webinar) */}
      {!course && (questionCount > 0 || event.certificate) && (
        <section className="card divide-y divide-gray-100">
          {questionCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold text-gray-900">Kuis · {questionCount} soal</p>
                <p className="text-sm text-gray-600">
                  Nilai lulus {event.passScore}%.
                  {best && <span className={best.passed ? " font-semibold text-green-700" : " text-amber-700"}> Nilai terbaik Anda {best.score}% {best.passed ? "(lulus)" : "(belum lulus)"}.</span>}
                  {course && !allVideosDone && " Kuis terbuka setelah semua video selesai."}
                </p>
              </div>
              {approved && (!course || allVideosDone) && (
                <Link href={`/tiket/${registrationId}/kuis`} className={`btn ${best?.passed ? "btn-secondary" : "btn-primary"}`}>
                  {best ? (best.passed ? "Kerjakan lagi" : "Coba lagi") : "Mulai kuis"}
                </Link>
              )}
            </div>
          )}
          {event.certificate && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-start gap-3">
                <AwardIcon width={22} height={22} className={certificateNo ? "text-brand" : "text-gray-400"} />
                <div>
                  <p className="font-semibold text-gray-900">Sertifikat</p>
                  <p className="text-sm text-gray-600">{certificateNo ? `No. ${certificateNo}` : cert.reason}</p>
                </div>
              </div>
              {certificateNo && <Link href={`/sertifikat/${certificateNo}`} target="_blank" className="btn btn-primary">Lihat & unduh sertifikat</Link>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
