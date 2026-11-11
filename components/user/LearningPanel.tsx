import Link from "next/link";
import { AwardIcon, PlayIcon } from "@/components/ui/icons";
import { certificateStatus } from "@/lib/certificate";
import { CourseLessons } from "./CourseLessons";

type Props = {
  registrationId: string;
  status: string;
  certificateNo: string | null;
  event: { type: string; certificate: boolean; passScore: number; useQr: boolean };
  lessons: { id: string; title: string; videoUrl: string; note: string }[];
  doneLessonIds: string[];
  questionCount: number;
  best: { score: number; passed: boolean } | null;
  scans: number;
  hasScanPoints: boolean;
};

// Bagian belajar di halaman tiket: video materi (berurutan untuk pelatihan video), kuis, dan sertifikat.
export function LearningPanel({ registrationId, status, certificateNo, event, lessons, doneLessonIds, questionCount, best, scans, hasScanPoints }: Props) {
  if (lessons.length === 0 && questionCount === 0 && !event.certificate) return null;
  const approved = status === "approved";
  const course = event.type === "course";
  const done = new Set(doneLessonIds);
  const videos = { total: lessons.length, done: lessons.filter((l) => done.has(l.id)).length };
  const allVideosDone = videos.done === videos.total;
  const cert = certificateStatus({ certificate: event.certificate, status, questions: questionCount, passed: Boolean(best?.passed), scans, needsAttendance: event.useQr && hasScanPoints, videos: course ? videos : undefined });
  const pct = videos.total ? Math.round((videos.done / videos.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {lessons.length > 0 && (
        <section className="card">
          <div className="border-b border-gray-200 px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <PlayIcon width={18} height={18} className="text-brand" /> Materi video
              </h2>
              {approved && <span className="text-sm font-medium text-gray-700 tabular-nums">{videos.done}/{videos.total} selesai</span>}
            </div>
            {approved && (
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-100" role="progressbar" aria-valuemin={0} aria-valuemax={videos.total} aria-valuenow={videos.done} aria-label="Progres video">
                <div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
            {course && approved && <p className="mt-2 text-xs text-gray-600">Tonton video berurutan sampai habis. Video berikutnya terbuka setelah video sebelumnya selesai.</p>}
          </div>
          {approved ? (
            <CourseLessons registrationId={registrationId} sequential={course} lessons={lessons.map((l) => ({ ...l, done: done.has(l.id) }))} />
          ) : (
            <p className="px-5 py-4 text-sm text-gray-600">Materi terbuka setelah pendaftaran disetujui.</p>
          )}
        </section>
      )}

      {(questionCount > 0 || event.certificate) && (
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
