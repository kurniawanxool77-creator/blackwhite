import type { Checkpoint, Event, Lesson, Registration, Scan } from "@prisma/client";
import { useActionState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { FormAnswers } from "@/components/ui/FormAnswers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LearningPanel } from "@/components/user/LearningPanel";
import { TicketActions } from "@/components/user/TicketActions";
import { CHECKPOINT_KIND, fmtDateRange, fmtDateTime, fmtRp, REG_STATUS } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import type { BankAccount } from "@/lib/site-defaults";
import { DataGate } from "@/src/components/RouteState";
import { cancelRegistration } from "@/src/lib/actions/user";
import { useApiData } from "@/src/lib/api-client";

type TicketPayload = {
  reg: Registration & {
    user: { id: string; name: string; email: string; phone: string | null; organization: string | null; image: string | null };
    scans: Scan[];
    event: Event & {
      checkpoints: Checkpoint[];
      lessons: Lesson[];
      _count: { questions: number };
    };
    attempts: { score: number; passed: boolean }[];
    progress: { lessonId: string }[];
  };
  qr: string | null;
  banks: BankAccount[];
};

function CancelTicketButton({ registrationId }: { registrationId: string }) {
  const [, action, pending] = useActionState(async (_prev: null, _f: FormData) => {
    await cancelRegistration(registrationId);
    return null;
  }, null);

  return (
    <form action={action} className="mt-4 border-t border-gray-100 pt-4">
      <ConfirmSubmit message="Batalkan pendaftaran ini?" className="btn btn-danger btn-sm">
        {pending ? "Membatalkan..." : "Batalkan pendaftaran"}
      </ConfirmSubmit>
    </form>
  );
}

export function TicketPage() {
  const { id } = useParams();
  const state = useApiData<TicketPayload>(id ? `/api/user/ticket/${encodeURIComponent(id)}` : null);

  return (
    <DataGate state={state} notFoundTitle="Tiket tidak ditemukan" backTo="/dashboard">
      {({ reg, qr, banks }) => {
        const details = readDetails(reg.details);
        const scannedMap = new Map(reg.scans.map((s) => [s.checkpointId, s.createdAt]));
        const points = reg.event.checkpoints.filter((cp) => appliesTo(cp, details));
        const hasScanPoints = reg.event.checkpoints.length > 0;

        return (
          <div className="space-y-6">
            <div>
              <Link to="/dashboard" className="text-sm text-gray-500 hover:text-brand">← Kembali ke tiket</Link>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <StatusBadge status={reg.status} label={REG_STATUS[reg.status] ?? reg.status} />
                {reg.code && <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800">{reg.code}</span>}
              </div>
              <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">{reg.event.name}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {reg.event.location} · {fmtDateRange(reg.event.startDate, reg.event.endDate)}
              </p>
            </div>

            {reg.status === "pending" && (
              <section className="card p-5">
                <h2 className="font-semibold text-gray-900">Menunggu persetujuan panitia</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Pendaftaran Anda sedang ditinjau. Kode QR aktif otomatis setelah disetujui.
                </p>

                {details.total != null && details.total > 0 && (
                  <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
                    <p className="font-medium text-gray-900">Tagihan: {fmtRp(details.total)}</p>
                    {banks.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-700">
                        {banks.map((b) => (
                          <li key={`${b.bank}-${b.number}`}>
                            {b.bank} · <span className="font-mono font-semibold">{b.number}</span> a.n. {b.holder}
                          </li>
                        ))}
                      </ul>
                    )}
                    {details.paymentProof && (
                      <p className="mt-2 text-xs text-gray-600">Catatan transfer: {details.paymentProof}</p>
                    )}
                    {details.paymentProofUrl && (
                      <a href={details.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-brand hover:underline">
                        Lihat bukti transfer →
                      </a>
                    )}
                  </div>
                )}

                <CancelTicketButton registrationId={reg.id} />
              </section>
            )}

            {reg.status === "rejected" && (
              <section className="card border-red-200 bg-red-50/40 p-5">
                <h2 className="font-semibold text-red-900">Pendaftaran ditolak</h2>
                <p className="mt-1 text-sm text-red-800">{reg.rejectReason || "Silakan hubungi panitia untuk informasi lebih lanjut."}</p>
              </section>
            )}

            {reg.status === "approved" && reg.event.useQr && qr && (
              <section className="card flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start">
                <div className="flex w-52 shrink-0 flex-col items-center print:w-64">
                  <img src={qr} alt="QR Tiket Peserta" className="w-48 rounded-md border border-gray-200 p-2" />
                  {reg.code && <p className="mt-2 font-mono text-sm font-semibold text-gray-900">{reg.code}</p>}
                  <TicketActions
                    qrDataUrl={qr}
                    eventName={reg.event.name}
                    eventSlug={reg.event.slug}
                    userName={reg.user.name}
                    location={reg.event.location}
                  />
                </div>

                <div className="min-w-0 flex-1 print:hidden">
                  <h2 className="font-semibold text-gray-900">Progres pos & absensi QR</h2>
                  <p className="mt-1 text-sm text-gray-600">Tunjukkan QR kepada panitia di setiap pos kegiatan.</p>
                  {points.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Belum ada pos scan terjadwal.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-200">
                      {points.map((cp) => {
                        const scannedAt = scannedMap.get(cp.id);
                        return (
                          <li key={cp.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium text-gray-900">{cp.name}</p>
                              <p className="text-xs text-gray-500">{CHECKPOINT_KIND[cp.kind] ?? cp.kind}</p>
                            </div>
                            {scannedAt ? (
                              <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
                                Hadir · {fmtDateTime(scannedAt)}
                              </span>
                            ) : (
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Belum scan</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}

            <div className="print:hidden">
              <LearningPanel
                registrationId={reg.id}
                status={reg.status}
                certificateNo={reg.certificateNo}
                event={{
                  type: reg.event.type,
                  certificate: reg.event.certificate,
                  passScore: reg.event.passScore,
                  useQr: reg.event.useQr,
                }}
                lessons={reg.event.lessons}
                doneLessonIds={reg.progress.map((p) => p.lessonId)}
                questionCount={reg.event._count.questions}
                best={reg.attempts[0] ?? null}
                scans={reg.scans.length}
                hasScanPoints={hasScanPoints}
              />
            </div>

            {details.answers.length > 0 && (
              <div className="print:hidden">
                <FormAnswers answers={details.answers} title="Data pendaftaran Anda" />
              </div>
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

