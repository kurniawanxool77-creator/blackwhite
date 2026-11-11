import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonForm, QuestionForm } from "@/components/admin/LearningForms";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { certificateStatus, parseOptions, youtubeId } from "@/lib/learning";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
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
} from "../../learning-actions";
import { Drawer } from "@/components/admin/Drawer";

export const dynamic = "force-dynamic";

// Materi video, kuis, dan sertifikat satu pelatihan.
export default async function LearningPage({ params }: PageProps<"/superadmin/events/[id]/belajar">) {
  await requireAdmin("superadmin");
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    include: {
      lessons: { orderBy: { order: "asc" } },
      questions: { orderBy: { order: "asc" } },
      checkpoints: { where: { scan: true }, select: { audience: true } },
      registrations: {
        where: { status: "approved" },
        orderBy: { createdAt: "asc" },
        include: { user: true, attempts: { orderBy: { score: "desc" }, take: 1 }, progress: { select: { lessonId: true } }, _count: { select: { scans: true } } },
      },
    },
  });
  if (!event) notFound();

  const people = event.registrations.map((r) => {
    const best = r.attempts[0];
    const hasPoints = event.checkpoints.some((c) => appliesTo(c, readDetails(r.details)));
    const doneVideos = event.lessons.filter((l) => r.progress.some((p) => p.lessonId === l.id)).length;
    const videos = event.type === "course" ? { total: event.lessons.length, done: doneVideos } : undefined;
    const status = certificateStatus({ certificate: event.certificate, status: r.status, questions: event.questions.length, passed: Boolean(best?.passed), scans: r._count.scans, needsAttendance: event.useQr && hasPoints, videos });
    return { r, best, status, doneVideos };
  });
  const eligibleWaiting = people.filter((p) => p.status.eligible && !p.r.certificateNo).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/superadmin/events/${event.id}`} className="text-sm text-gray-500 hover:text-brand">← {event.name}</Link>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">Materi, kuis & sertifikat</h1>
        <p className="text-sm text-gray-600">Peserta yang disetujui menonton materi, mengerjakan kuis, lalu mendapat sertifikat bila memenuhi syarat.</p>
      </div>

      <form action={saveLearningSettings.bind(null, event.id)} className="card flex flex-wrap items-end gap-4 p-4">
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" name="certificate" defaultChecked={event.certificate} className="h-4 w-4 accent-brand" />
          Beri sertifikat
        </label>
        <div>
          <label className="label" htmlFor="passScore">Nilai lulus kuis (%)</label>
          <input id="passScore" name="passScore" className="input w-24" inputMode="numeric" defaultValue={event.passScore} />
        </div>
        <button className="btn btn-primary">Simpan pengaturan</button>
        <p className="w-full text-xs text-gray-500">
          Syarat sertifikat: disetujui{event.useQr ? ", hadir minimal di satu pos" : ""}{event.questions.length ? `, dan nilai kuis ≥ ${event.passScore}%` : ""}. Sertifikat terbit otomatis saat peserta lulus kuis.
        </p>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card h-fit">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
            <h2 className="font-semibold text-gray-900">Materi video ({event.lessons.length})</h2>
            <Drawer label="+ Tambah materi" title="Tambah materi video" variant="secondary">
              <LessonForm action={addLesson.bind(null, event.id)} />
            </Drawer>
          </div>
          <ol className="divide-y divide-gray-100">
            {event.lessons.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">Belum ada materi.</li>}
            {event.lessons.map((l, i) => {
              const vid = youtubeId(l.videoUrl);
              return (
                <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                  {vid && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`} alt="" className="h-14 w-24 shrink-0 rounded border border-gray-200 object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{i + 1}. {l.title}</p>
                    {l.note && <p className="text-xs text-gray-600">{l.note}</p>}
                    <a href={l.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">Buka di YouTube</a>
                  </div>
                  <div className="flex shrink-0 gap-1">
                  <Drawer label="Ubah" title="Ubah materi video" variant="secondary">
                    <LessonForm action={updateLesson.bind(null, l.id)} lesson={{ title: l.title, videoUrl: l.videoUrl, note: l.note }} />
                  </Drawer>
                  <form className="flex gap-1">
                    <button formAction={moveLesson.bind(null, l.id, "up")} className="btn btn-secondary btn-sm" disabled={i === 0} aria-label="Naikkan">↑</button>
                    <button formAction={moveLesson.bind(null, l.id, "down")} className="btn btn-secondary btn-sm" disabled={i === event.lessons.length - 1} aria-label="Turunkan">↓</button>
                    <button formAction={deleteLesson.bind(null, l.id)} className="btn btn-danger btn-sm">Hapus</button>
                  </form>
                  </div>
                </li>
              );
            })}
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
                  <form className="flex gap-1">
                    <button formAction={moveQuestion.bind(null, q.id, "up")} className="btn btn-secondary btn-sm" disabled={i === 0} aria-label="Naikkan">↑</button>
                    <button formAction={moveQuestion.bind(null, q.id, "down")} className="btn btn-secondary btn-sm" disabled={i === event.questions.length - 1} aria-label="Turunkan">↓</button>
                    <button formAction={deleteQuestion.bind(null, q.id)} className="btn btn-danger btn-sm">Hapus</button>
                  </form>
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
            <form action={issueAllEligible.bind(null, event.id)}>
              <button className="btn btn-primary btn-sm">Terbitkan untuk {eligibleWaiting} peserta yang memenuhi syarat</button>
            </form>
          )}
        </div>
        {!event.certificate && <p className="border-b border-gray-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Sertifikat belum aktif. Centang &quot;Beri sertifikat&quot; di atas.</p>}
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
              {people.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500">Belum ada peserta yang disetujui.</td></tr>}
              {people.map(({ r, best, status, doneVideos }) => (
                <tr key={r.id}>
                  <td>
                    <p className="font-medium text-gray-900">{r.user.name}</p>
                    <p className="text-xs text-gray-500">{r.user.email}</p>
                  </td>
                  <td className="whitespace-nowrap tabular-nums">
                    {event.lessons.length === 0 ? <span className="text-gray-400">-</span> : (
                      <span className={doneVideos === event.lessons.length ? "font-semibold text-green-700" : "text-gray-700"}>{doneVideos}/{event.lessons.length}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {event.questions.length === 0 ? <span className="text-gray-400">-</span> : best ? (
                      <span className={best.passed ? "font-semibold text-green-700" : "text-amber-700"}>{best.score}% {best.passed ? "lulus" : "belum lulus"}</span>
                    ) : <span className="text-gray-500">Belum mengerjakan</span>}
                  </td>
                  <td>
                    {r.certificateNo ? (
                      <a href={`/sertifikat/${r.certificateNo}`} target="_blank" className="font-mono text-xs text-brand hover:underline">{r.certificateNo}</a>
                    ) : (
                      <span className="text-xs text-gray-600">{status.reason}</span>
                    )}
                    {r.certifiedAt && <p className="text-xs text-gray-500">Terbit {fmtDate(r.certifiedAt)}</p>}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {r.certificateNo ? (
                      <form action={revokeCertificate.bind(null, r.id)}>
                        <ConfirmSubmit message={`Cabut sertifikat ${r.user.name}?`} className="btn btn-danger btn-sm">Cabut</ConfirmSubmit>
                      </form>
                    ) : event.certificate ? (
                      <form action={issueOne.bind(null, r.id)}>
                        <button className="btn btn-secondary btn-sm" title={status.eligible ? "" : `Belum memenuhi syarat: ${status.reason}`}>Terbitkan</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">&quot;Terbitkan&quot; per peserta bisa dipakai sebagai pengecualian walau syarat belum terpenuhi. Setiap sertifikat bisa dicek keasliannya lewat nomornya.</p>
      </section>
    </div>
  );
}
