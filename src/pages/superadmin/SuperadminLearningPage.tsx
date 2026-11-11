import type { Event, Lesson, Question, Registration, User } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { LessonForm, QuestionForm } from "@/components/admin/LearningForms";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { certificateStatus } from "@/lib/certificate";
import { fmtDate } from "@/lib/format";
import { parseOptions } from "@/lib/certificate";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import { DataGate } from "@/src/components/RouteState";
import {
  addLesson,
  addQuestion,
  deleteLesson,
  deleteQuestion,
  issueAllEligible,
  issueOne,
  moveLesson,
  moveQuestion,
  revokeCertificate,
  saveLearningSettings,
  updateLesson,
  updateQuestion,
} from "@/src/lib/actions/events";
import { useApiData } from "@/src/lib/api-client";

type LearningEvent = Event & {
  lessons: Lesson[];
  questions: Question[];
  checkpoints: { audience: string }[];
  registrations: (Registration & {
    user: User;
    attempts: { score: number; passed: boolean }[];
    progress: { lessonId: string }[];
    _count: { scans: number };
  })[];
};

export function SuperadminLearningPage() {
  const { id } = useParams();
  const state = useApiData<{ event: LearningEvent }>(id ? `/api/superadmin/events/${encodeURIComponent(id)}/learning` : null);

  return (
    <DataGate state={state} notFoundTitle="Event tidak ditemukan" backTo="/superadmin/events">
      {({ event }) => {
        const course = event.type === "course";
        const people = event.registrations.map((r) => {
          const details = readDetails(r.details);
          const needScans = event.checkpoints.filter((c) => appliesTo(c, details)).length;
          const best = r.attempts[0] ?? null;
          const doneVideos = r.progress.length;
          const status = certificateStatus({
            certificate: event.certificate,
            status: r.status,
            questions: event.questions.length,
            passed: Boolean(best?.passed),
            scans: r._count.scans,
            needsAttendance: event.useQr && needScans > 0,
            videos: course ? { done: doneVideos, total: event.lessons.length } : undefined,
          });
          return { r, best, status, doneVideos };
        });
        const eligibleWaiting = people.filter((p) => !p.r.certificateNo && p.status.eligible).length;

        return (
          <div className="space-y-6">
            <div>
              <Link to={`/superadmin/events/${event.id}?tab=materi`} className="text-sm text-gray-500 hover:text-brand">← {event.name}</Link>
              <h1 className="mt-2 text-xl font-bold text-gray-900">Materi, kuis & sertifikat</h1>
            </div>

            <section className="card p-5">
              <h2 className="font-semibold text-gray-900">Pengaturan kelulusan & sertifikat</h2>
              <form action={async (f) => { await saveLearningSettings(event.id, f); }} className="mt-3 flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" name="certificate" defaultChecked={event.certificate} className="accent-brand" />
                  Beri sertifikat kepada peserta yang memenuhi syarat
                </label>
                <div>
                  <label className="label text-xs" htmlFor="passScore">Nilai lulus (%)</label>
                  <input id="passScore" name="passScore" type="number" min={0} max={100} defaultValue={event.passScore} className="input w-24" />
                </div>
                <button className="btn btn-primary btn-sm">Simpan pengaturan</button>
              </form>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card h-fit">
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
                  <h2 className="font-semibold text-gray-900">Materi video ({event.lessons.length})</h2>
                  <Drawer label="+ Tambah materi" title="Tambah materi video" variant="secondary">
                    <LessonForm action={addLesson.bind(null, event.id)} />
                  </Drawer>
                </div>
                <ol className="divide-y divide-gray-100">
                  {event.lessons.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">Belum ada materi video.</li>}
                  {event.lessons.map((l, i) => (
                    <li key={l.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{i + 1}. {l.title}</p>
                        {l.note && <p className="text-xs text-gray-600">{l.note}</p>}
                        <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">Buka di YouTube</a>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Drawer label="Ubah" title="Ubah materi video" variant="secondary">
                          <LessonForm action={updateLesson.bind(null, l.id)} lesson={{ title: l.title, videoUrl: l.videoUrl, note: l.note }} />
                        </Drawer>
                        <button type="button" onClick={() => moveLesson(l.id, "up")} className="btn btn-secondary btn-sm" disabled={i === 0} aria-label="Naikkan">↑</button>
                        <button type="button" onClick={() => moveLesson(l.id, "down")} className="btn btn-secondary btn-sm" disabled={i === event.lessons.length - 1} aria-label="Turunkan">↓</button>
                        <button type="button" onClick={() => deleteLesson(l.id)} className="btn btn-danger btn-sm">Hapus</button>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="card h-fit">
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
                  <h2 className="font-semibold text-gray-900">Kuis ({event.questions.length} soal)</h2>
                  <Drawer label="+ Tambah soal" title="Tambah soal kuis" variant="secondary">
                    <QuestionForm action={addQuestion.bind(null, event.id)} />
                  </Drawer>
                </div>
                <ol className="divide-y divide-gray-100">
                  {event.questions.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">Belum ada soal. Tanpa kuis, sertifikat tidak memerlukan nilai.</li>}
                  {event.questions.map((q, i) => (
                    <li key={q.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <p className="min-w-0 flex-1 text-sm font-medium text-gray-900">{i + 1}. {q.text}</p>
                        <div className="flex shrink-0 gap-1">
                          <Drawer label="Ubah" title="Ubah soal kuis" variant="secondary">
                            <QuestionForm action={updateQuestion.bind(null, q.id)} question={{ text: q.text, options: parseOptions(q.options), answer: q.answer }} />
                          </Drawer>
                          <button type="button" onClick={() => moveQuestion(q.id, "up")} className="btn btn-secondary btn-sm" disabled={i === 0} aria-label="Naikkan">↑</button>
                          <button type="button" onClick={() => moveQuestion(q.id, "down")} className="btn btn-secondary btn-sm" disabled={i === event.questions.length - 1} aria-label="Turunkan">↓</button>
                          <button type="button" onClick={() => deleteQuestion(q.id)} className="btn btn-danger btn-sm">Hapus</button>
                        </div>
                      </div>
                      <ol className="mt-1.5 space-y-0.5 pl-4 text-xs">
                        {parseOptions(q.options).map((o, j) => (
                          <li key={j} className={j === q.answer ? "font-semibold text-green-700" : "text-gray-600"}>
                            {String.fromCharCode(65 + j)}. {o} {j === q.answer && "✓"}
                          </li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                <h2 className="font-semibold text-gray-900">Sertifikat peserta</h2>
                {event.certificate && eligibleWaiting > 0 && (
                  <button type="button" onClick={() => issueAllEligible(event.id)} className="btn btn-primary btn-sm">
                    Terbitkan untuk {eligibleWaiting} peserta yang memenuhi syarat
                  </button>
                )}
              </div>
              {!event.certificate && (
                <p className="border-b border-gray-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Sertifikat belum aktif. Centang &quot;Beri sertifikat&quot; di atas.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Peserta</th>
                      <th>Video</th>
                      <th>Kuis</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {people.length === 0 && (
                      <tr><td colSpan={5} className="text-center text-gray-500">Belum ada peserta yang disetujui.</td></tr>
                    )}
                    {people.map(({ r, best, status, doneVideos }) => (
                      <tr key={r.id}>
                        <td>
                          <p className="font-medium text-gray-900">{r.user.name}</p>
                          <p className="text-xs text-gray-500">{r.user.email}</p>
                        </td>
                        <td className="whitespace-nowrap tabular-nums">
                          {event.lessons.length === 0 ? <span className="text-gray-400">-</span> : (
                            <span className={doneVideos === event.lessons.length ? "font-semibold text-green-700" : "text-gray-700"}>
                              {doneVideos}/{event.lessons.length}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          {event.questions.length === 0 ? <span className="text-gray-400">-</span> : best ? (
                            <span className={best.passed ? "font-semibold text-green-700" : "text-amber-700"}>
                              {best.score}% {best.passed ? "lulus" : "belum lulus"}
                            </span>
                          ) : <span className="text-gray-500">Belum mengerjakan</span>}
                        </td>
                        <td>
                          {r.certificateNo ? (
                            <a href={`/sertifikat/${r.certificateNo}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-brand hover:underline">
                              {r.certificateNo}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-600">{status.reason}</span>
                          )}
                          {r.certifiedAt && <p className="text-xs text-gray-500">Terbit {fmtDate(r.certifiedAt)}</p>}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {r.certificateNo ? (
                            <form action={async () => { await revokeCertificate(r.id); }}>
                              <ConfirmSubmit message={`Cabut sertifikat ${r.user.name}?`} className="btn btn-danger btn-sm">Cabut</ConfirmSubmit>
                            </form>
                          ) : event.certificate ? (
                            <button
                              type="button"
                              onClick={() => issueOne(r.id)}
                              className="btn btn-secondary btn-sm"
                              title={status.eligible ? "" : `Belum memenuhi syarat: ${status.reason}`}
                            >
                              Terbitkan
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
                &quot;Terbitkan&quot; per peserta bisa dipakai sebagai pengecualian walau syarat belum terpenuhi. Setiap sertifikat bisa dicek keasliannya lewat nomornya.
              </p>
            </section>
          </div>
        );
      }}
    </DataGate>
  );
}

