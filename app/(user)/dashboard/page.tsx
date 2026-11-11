import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CalendarIcon, ClockIcon, MapPinIcon, QrCodeIcon, TicketIcon } from "@/components/ui/icons";
import QRCode from "qrcode";
import { MyQrCard } from "@/components/user/MyQrCard";
import { requireUser } from "@/lib/auth";
import { greetingJakarta } from "@/lib/checkin";
import { ensureUserQr } from "@/lib/qr";
import { db } from "@/lib/db";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import { durationDays, fmtDate, REG_STATUS } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { status: filterStatus } = await searchParams;
  const user = await requireUser();

  const registrations = await db.registration.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: {
          checkpoints: { where: { scan: true }, orderBy: { order: "asc" }, select: { id: true, name: true, kind: true, audience: true } },
        },
      },
      scans: { select: { checkpointId: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = registrations.length;
  const approvedCount = registrations.filter((r) => r.status === "approved").length;
  const needsQr = registrations.some((r) => r.status === "approved" && r.event.useQr); // ada pelatihan disetujui yang memakai QR
  const me = await db.user.findUnique({ where: { id: user.id }, select: { name: true, image: true } });
  const myQr = needsQr ? await QRCode.toDataURL(await ensureUserQr(user.id), { width: 360, margin: 1 }) : null;
  const pendingCount = registrations.filter((r) => r.status === "pending").length;

  const filteredRegistrations = filterStatus
    ? registrations.filter((r) => r.status === filterStatus)
    : registrations;

  const firstName = (user.name ?? "").split(" ")[0] || "Peserta";

  return (
    <div className="space-y-6">
      {/* 1. Sapaan */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          Halo {firstName}, {greetingJakarta()}
        </h1>
        <Link href="/event" className="btn btn-secondary btn-sm hidden sm:inline-flex">
          <CalendarIcon className="h-4 w-4" />
          Cari pelatihan
        </Link>
      </div>

      {myQr && <MyQrCard qr={myQr} name={me?.name ?? ""} photo={me?.image ?? null} />}

      {/* 3. Filter Tab Tiket */}
      {total > 0 && (
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-3 text-xs font-medium">
          <Link
            href="/dashboard"
            className={`rounded px-3 py-1.5 transition-colors ${
              !filterStatus ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Semua ({total})
          </Link>
          <Link
            href="/dashboard?status=approved"
            className={`rounded px-3 py-1.5 transition-colors ${
              filterStatus === "approved" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Disetujui ({approvedCount})
          </Link>
          <Link
            href="/dashboard?status=pending"
            className={`rounded px-3 py-1.5 transition-colors ${
              filterStatus === "pending" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Menunggu ({pendingCount})
          </Link>
        </div>
      )}

      {/* 4. Daftar Tiket */}
      {filteredRegistrations.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
            <TicketIcon className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-gray-900">{total === 0 ? "Belum ada tiket" : "Tidak ada tiket"}</h2>
          {total === 0 && (
            <Link href="/event" className="btn btn-primary btn-sm mt-4">
              Cari pelatihan
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRegistrations.map((r) => {
            const scannedIds = new Set(r.scans.map((s) => s.checkpointId));
            const points = r.event.checkpoints.filter((c) => appliesTo(c, readDetails(r.details))); // rundown milik peserta ini
            const totalCp = points.length;
            const doneCp = points.filter((c) => scannedIds.has(c.id)).length;
            const nextCp = points.find((c) => !scannedIds.has(c.id));
            const days = durationDays(r.event.startDate, r.event.endDate);
            const percent = totalCp > 0 ? Math.round((doneCp / totalCp) * 100) : 0;

            return (
              <article
                key={r.id}
                className="card flex flex-col justify-between p-5 transition-all duration-200 hover:border-gray-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {r.event.category && (
                        <p className="text-[10px] font-semibold tracking-wider text-brand uppercase">
                          {r.event.category}
                        </p>
                      )}
                      <h2 className="mt-0.5 line-clamp-2 text-base font-semibold text-gray-900">
                        {r.event.name}
                      </h2>
                    </div>
                    <StatusBadge status={r.status} label={REG_STATUS[r.status]} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                      <span>
                        {fmtDate(r.event.startDate)}
                        {days > 1 && ` – ${fmtDate(r.event.endDate)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="truncate">{r.event.location}</span>
                    </div>
                  </div>

                  {/* Progress Checkpoint Jika Disetujui */}
                  {r.status === "approved" && totalCp > 0 && (
                    <div className="mt-4 rounded border border-gray-100 bg-gray-50/70 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">Kehadiran</span>
                        <span className="font-bold text-gray-900">
                          {doneCp}/{totalCp} pos
                        </span>
                      </div>
                      <div
                        className="mt-2 h-1.5 w-full overflow-hidden rounded bg-gray-200"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={totalCp}
                        aria-valuenow={doneCp}
                        aria-label="Progres Checkpoint"
                      >
                        <div
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500">
                        {nextCp ? `Berikutnya: ${nextCp.name}` : "✓ Semua pos selesai"}
                      </p>
                    </div>
                  )}

                  {r.status === "pending" && (
                    <div className="mt-4 flex items-start gap-2 rounded border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                      <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>Menunggu persetujuan panitia.</span>
                    </div>
                  )}

                  {r.status === "rejected" && r.rejectReason && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      <strong>Ditolak:</strong> {r.rejectReason}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <Link
                    href={`/tiket/${r.id}`}
                    className={`btn w-full text-xs ${
                      r.status === "approved" ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {r.status === "approved" ? (
                      <>
                        <QrCodeIcon className="h-4 w-4" />
                        Lihat tiket
                      </>
                    ) : (
                      "Detail"
                    )}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
