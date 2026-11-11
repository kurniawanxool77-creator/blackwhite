import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { cancelRegistration } from "@/app/(user)/actions";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { FormAnswers } from "@/components/ui/FormAnswers";
import { LearningPanel } from "@/components/user/LearningPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TicketActions } from "@/components/user/TicketActions";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from "@/components/ui/icons";
import { requireUser } from "@/lib/auth";
import { ensureUserQr } from "@/lib/qr";
import { db } from "@/lib/db";
import { REG_STATUS, finalPrice, fmtDateRange, fmtDateTime, fmtRupiah } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { getSite, parseBanks } from "@/lib/site";
import { appliesTo } from "@/lib/rundown";
import { fmtWhen } from "@/lib/schedule";

export default async function TicketPage({ params }: PageProps<"/tiket/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const reg = await db.registration.findFirst({
    where: { id, userId: user.id },
    include: {
      user: true,
      scans: true,
      event: {
        include: {
          checkpoints: { where: { scan: true }, orderBy: { order: "asc" } }, // hanya pos yang perlu scan
          lessons: { orderBy: { order: "asc" } },
          _count: { select: { questions: true } },
        },
      },
      attempts: { orderBy: { score: "desc" }, take: 1 },
      progress: { select: { lessonId: true } },
    },
  });
  if (!reg) notFound();

  const scannedAt = new Map(reg.scans.map((s) => [s.checkpointId, s.createdAt]));
  // Satu QR pribadi untuk semua pelatihan; berlaku di pelatihan ini selama pendaftarannya disetujui.
  const qr = reg.status === "approved" && reg.event.useQr ? await QRCode.toDataURL(await ensureUserQr(user.id), { width: 340, margin: 1 }) : null;

  const details = readDetails(reg.details);
  const banks = parseBanks((await getSite()).banks);
  const total = details.total ?? finalPrice(reg.event);
  // Rundown milik peserta ini saja (pos khusus paket lain tidak ditampilkan).
  const points = reg.event.checkpoints.filter((c) => appliesTo(c, details));
  const totalCp = points.length;
  const doneCp = points.filter((c) => scannedAt.has(c.id)).length;
  const nextCp = reg.status === "approved" ? points.find((c) => !scannedAt.has(c.id)) : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Navigasi Kembali & Header Event */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          ← Kembali ke Tiket Saya
        </Link>
        <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            {reg.event.category && (
              <span className="text-[11px] font-semibold tracking-wider text-brand uppercase">
                {reg.event.category}
              </span>
            )}
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {reg.event.name}
            </h1>
          </div>
          <StatusBadge status={reg.status} label={REG_STATUS[reg.status]} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>
              {fmtDateRange(reg.event.startDate, reg.event.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPinIcon className="h-4 w-4 text-gray-400" />
            <span>{reg.event.location}</span>
          </div>
        </div>
      </div>

      {/* 2. Grid Konten: E-Pass QR & Tracking Checkpoint */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Kolom Kiri: E-Pass Tiket Resmi */}
        <section className="card flex flex-col items-center p-6 text-center md:col-span-6 lg:col-span-5">
          {qr ? (
            <div className="w-full">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 text-left">
                <div>
                  <p className="text-xs font-semibold text-gray-900">E-Pass Resmi Peserta</p>
                  <p className="text-[11px] text-gray-500">Tiket Terverifikasi Sistem</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  QR Aktif
                </span>
              </div>

              <div className="my-5 flex flex-col items-center">
                <div className="rounded-md border border-gray-200 bg-white p-3 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR Tiket Presensi" className="h-56 w-56 max-w-full" />
                </div>
                <h2 className="mt-4 text-base font-bold text-gray-900">{reg.user.name}</h2>
                {reg.code && (
                  <p className="mt-1 rounded border border-gray-900 px-3 py-1 font-mono text-lg font-bold tracking-wider text-gray-900" aria-label="Nomor peserta">{reg.code}</p>
                )}
                <p className="mt-0.5 text-xs text-gray-500">{reg.user.email}</p>
                {reg.user.phone && (
                  <p className="mt-0.5 text-[11px] text-gray-400">{reg.user.phone}</p>
                )}
              </div>

              <div className="rounded border border-green-100 bg-green-50/60 p-3 text-left text-xs text-green-900">
                <p className="font-semibold">Petunjuk Pemindaian:</p>
                <p className="mt-1 text-[11px] leading-relaxed text-green-800">
                  Tunjukkan kode QR ini kepada petugas di setiap pos verifikasi. Gunakan tombol <strong>Layar Penuh</strong> agar scanner membaca barcode dengan cepat.
                </p>
              </div>

              <TicketActions
                qrDataUrl={qr}
                eventName={reg.event.name}
                eventSlug={reg.event.slug}
                userName={reg.user.name}
                location={reg.event.location}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 w-full">
              <div className="flex h-14 w-14 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
                <ClockIcon className="h-7 w-7 text-amber-600" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                {reg.status === "rejected" ? "Pendaftaran Ditolak" : reg.status === "approved" ? "Anda terdaftar" : "Menunggu Verifikasi Panitia"}
              </h2>
              {reg.code && <p className="mt-2 rounded border border-gray-900 px-3 py-1 font-mono text-lg font-bold tracking-wider text-gray-900" aria-label="Nomor peserta">{reg.code}</p>}
              <p className="mt-2 max-w-xs text-xs text-gray-600">
                {reg.status === "rejected"
                  ? `Alasan: ${reg.rejectReason || "Tidak memenuhi persyaratan kegiatan."}`
                  : reg.status === "approved"
                    ? "Pelatihan ini tanpa QR. Kehadiran dicatat langsung oleh panitia di lokasi."
                    : reg.event.useQr
                      ? "QR terbit setelah panitia memverifikasi data dan pembayaran Anda."
                      : "Menunggu verifikasi data dan pembayaran oleh panitia."}
              </p>

              {reg.status === "pending" && (
                <form action={cancelRegistration.bind(null, reg.id)} className="mt-6">
                  <ConfirmSubmit
                    message={`Apakah Anda yakin ingin membatalkan pendaftaran di ${reg.event.name}?`}
                    className="btn btn-danger btn-sm text-xs"
                  >
                    Batalkan Pendaftaran
                  </ConfirmSubmit>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Kolom Kanan: Tracking Rangkaian Pos Checkpoint */}
        <section className="card p-6 md:col-span-6 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Rundown & Pos Checkpoint</h2>
              <p className="text-[11px] text-gray-500">Progres kehadiran Anda di setiap rangkaian kegiatan</p>
            </div>
            {totalCp > 0 && (
              <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                {doneCp} / {totalCp} Pos Selesai
              </span>
            )}
          </div>

          {points.length === 0 ? (
            <p className="mt-6 text-xs text-gray-500">
              Penyelenggara belum menetapkan titik checkpoint untuk kegiatan ini.
            </p>
          ) : (
            <ol className="mt-6 space-y-3.5">
              {points.map((c, i) => {
                const at = scannedAt.get(c.id);
                const isNext = c.id === nextCp?.id;

                return (
                  <li
                    key={c.id}
                    className={`flex items-start gap-3 rounded-md border p-3.5 transition-colors ${
                      at
                        ? "border-emerald-200 bg-emerald-50/40"
                        : isNext
                        ? "border-brand/40 bg-green-50/50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        at
                          ? "bg-emerald-600 text-white"
                          : isNext
                          ? "bg-brand text-white"
                          : "border border-gray-300 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {at ? "✓" : i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${at ? "text-gray-900" : isNext ? "text-brand" : "text-gray-700"}`}>{c.name}</p>
                          {(c.date || c.startTime || c.place) && <p className="text-xs text-gray-500">{[fmtWhen(c.date, c.startTime, c.endTime), c.place].filter(Boolean).join(" · ")}</p>}
                        </div>
                        {at ? (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            Terverifikasi
                          </span>
                        ) : isNext ? (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-brand">
                            Pos Berikutnya
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Menunggu</span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {at ? `Dipindai pada ${fmtDateTime(at)}` : isNext ? "Silakan menuju pos ini untuk verifikasi berikutnya." : "Menunggu giliran pos acara."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {reg.status === "approved" && (
            <div className="mt-6 rounded border border-gray-200 bg-gray-50/60 p-3 text-xs text-gray-600">
              <span className="font-medium text-gray-900">Sinkronisasi Realtime:</span> Layar ini diperbarui secara otomatis setiap 15 detik saat petugas memindai barcode Anda.
            </div>
          )}
        </section>
      </div>

      {/* 3. Data pendaftaran (jawaban formulir) & pembayaran */}
      <LearningPanel
        registrationId={reg.id}
        status={reg.status}
        certificateNo={reg.certificateNo}
        event={reg.event}
        lessons={reg.event.lessons}
        doneLessonIds={reg.progress.map((p) => p.lessonId)}
        questionCount={reg.event._count.questions}
        best={reg.attempts[0] ?? null}
        scans={reg.scans.length}
        hasScanPoints={points.length > 0}
      />

      <FormAnswers answers={details.answers} />

      <section className="card space-y-3 p-5 text-sm">
        <h2 className="font-semibold text-gray-900">Pembayaran</h2>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Biaya</span>
          <span className="font-semibold text-gray-900">{total > 0 ? fmtRupiah(total) : "Gratis"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status</span>
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${reg.status === "approved" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {reg.status === "approved" ? "Terverifikasi" : total > 0 ? "Menunggu verifikasi" : "Tersimpan"}
          </span>
        </div>
        {details.paymentProof && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">No. referensi</span>
            <span className="text-right text-gray-900">{details.paymentProof}</span>
          </div>
        )}
        {details.paymentProofUrl && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">Bukti transfer</span>
            <a href={details.paymentProofUrl} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={details.paymentProofUrl} alt="Bukti transfer" className="h-16 w-16 rounded-md border border-gray-200 object-cover" />
            </a>
          </div>
        )}
        {reg.status === "pending" && total > 0 && banks.length > 0 && (
          <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="font-semibold">Rekening pembayaran:</p>
            {banks.map((b) => (
              <p key={b.number}>{b.bank} <span className="font-mono">{b.number}</span>{b.holder && ` a.n ${b.holder}`}</p>
            ))}
          </div>
        )}
        <p className="border-t border-gray-100 pt-3 text-xs text-gray-500">
          ID pendaftaran: <span className="font-mono text-gray-700">{reg.id}</span>
        </p>
      </section>

      {reg.status === "approved" && <AutoRefresh seconds={15} />}
    </div>
  );
}
