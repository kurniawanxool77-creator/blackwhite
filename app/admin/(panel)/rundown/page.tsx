import Link from "next/link";
import { QrCodeIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CHECKPOINT_KIND, fmtDateRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminRundownPage() {
  const admin = await requireAdmin("scanner");

  const events = await db.event.findMany({
    where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
    include: {
      checkpoints: {
        orderBy: { order: "asc" },
        include: { _count: { select: { scans: true } } },
      },
      _count: { select: { registrations: { where: { status: "approved" } } } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Rundown & Pos Checkpoint</h1>
          <p className="text-xs text-gray-600">
            Jadwal pos verifikasi dan progres kehadiran peserta di setiap titik acara.
          </p>
        </div>
        <Link href="/admin/events" className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 w-fit">
          <QrCodeIcon className="h-4 w-4" />
          <span>Buka Scanner Kamera</span>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card p-8 text-center text-xs text-gray-500">
          Belum ada event yang ditugaskan kepada Anda. Silakan hubungi Superadmin.
        </div>
      ) : (
        events.map((ev) => {
          const totalApproved = ev._count.registrations;

          return (
            <div key={ev.id} className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{ev.name}</h2>
                  <p className="text-xs text-gray-500">
                    {ev.location} · {fmtDateRange(ev.startDate, ev.endDate)} · Total {totalApproved} Peserta
                  </p>
                </div>
                <Link
                  href={`/admin/events/${ev.id}`}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  Detail Event & Peserta
                </Link>
              </div>

              {ev.checkpoints.length === 0 ? (
                <p className="text-xs text-gray-500 py-3">Event ini belum memiliki pos checkpoint.</p>
              ) : (
                <div className="space-y-3">
                  {ev.checkpoints.map((cp, idx) => {
                    const hadir = cp._count.scans;
                    const percent = totalApproved > 0 ? Math.round((hadir / totalApproved) * 100) : 0;

                    return (
                      <div
                        key={cp.id}
                        className="rounded-md border border-gray-200 bg-gray-50/60 p-3.5 space-y-2 hover:border-brand/40 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-xs">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{cp.name}</p>
                              <span className="text-[11px] font-medium text-gray-500 capitalize">
                                {CHECKPOINT_KIND[cp.kind] || cp.kind}
                              </span>
                            </div>
                          </div>

                          {!cp.scan ? (
                            <span className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600">
                              Agenda saja · tanpa scan
                            </span>
                          ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-800">
                              {hadir} / {totalApproved} Hadir
                            </span>
                            <Link
                              href={`/admin/events/${ev.id}/scan/${cp.id}`}
                              className="btn btn-primary btn-sm text-xs py-1 px-3 flex items-center gap-1.5"
                            >
                              <QrCodeIcon className="h-3.5 w-3.5" />
                              <span>Scan di Pos Ini</span>
                            </Link>
                          </div>
                          )}
                        </div>

                        {/* Progress Bar Kehadiran Pos (hanya pos yang perlu scan) */}
                        {cp.scan && (
                        <div className="space-y-1 pt-1">
                          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-right text-[10px] text-gray-400">
                            {percent}% peserta telah menyelesaikan pos ini
                          </p>
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

    </div>
  );
}
