import type { Event, Registration, Scan } from "@prisma/client";
import { Link, useSearchParams } from "react-router-dom";
import { CategoryFilter, categoryFilterItems } from "@/components/ui/CategoryFilter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MyQrCard } from "@/components/user/MyQrCard";
import { CalendarIcon, ClockIcon, MapPinIcon, QrCodeIcon, TicketIcon } from "@/components/ui/icons";
import { durationDays, fmtDate, REG_STATUS } from "@/lib/format";
import { readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type DashboardReg = Registration & {
  event: Event & { checkpoints: { id: string; name: string; kind: string; audience: string }[] };
  scans: Pick<Scan, "checkpointId" | "createdAt">[];
};

type UserDashboardPayload = {
  greeting: string;
  firstName: string;
  registrations: DashboardReg[];
  categories: string[];
  me: { name: string; image: string | null } | null;
  myQr: string | null;
};

export function UserDashboardPage() {
  const [searchParams] = useSearchParams();
  const filterStatus = searchParams.get("status") || undefined;
  const filterCategory = searchParams.get("kategori") || undefined;
  const state = useApiData<UserDashboardPayload>("/api/user/dashboard");

  const dashboardHref = (status?: string, kategori?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (kategori) params.set("kategori", kategori);
    const qs = params.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  return (
    <DataGate state={state}>
      {({ greeting, firstName, registrations, categories, me, myQr }) => {
        const byCategory = filterCategory
          ? registrations.filter((r) => r.event.category === filterCategory)
          : registrations;
        const total = byCategory.length;
        const approvedCount = byCategory.filter((r) => r.status === "approved").length;
        const pendingCount = byCategory.filter((r) => r.status === "pending").length;
        const filteredRegistrations = filterStatus
          ? byCategory.filter((r) => r.status === filterStatus)
          : byCategory;

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Halo {firstName}, {greeting}
              </h1>
              <Link to="/event" className="btn btn-secondary btn-sm hidden sm:inline-flex">
                <CalendarIcon className="h-4 w-4" />
                Cari event
              </Link>
            </div>

            {myQr && <MyQrCard qr={myQr} name={me?.name ?? ""} photo={me?.image ?? null} />}

            {(categories.length > 0 || registrations.length > 0) && (
              <div className="space-y-3">
                <CategoryFilter
                  items={categoryFilterItems(categories, filterCategory, (c) =>
                    dashboardHref(filterStatus, c || undefined),
                  )}
                />
                {registrations.length > 0 && (
                  <div className="flex items-center gap-1.5 border-b border-gray-200 pb-3 text-xs font-medium">
                    <Link
                      to={dashboardHref(undefined, filterCategory)}
                      className={`rounded px-3 py-1.5 transition-colors ${
                        !filterStatus ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Semua ({total})
                    </Link>
                    <Link
                      to={dashboardHref("approved", filterCategory)}
                      className={`rounded px-3 py-1.5 transition-colors ${
                        filterStatus === "approved" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Disetujui ({approvedCount})
                    </Link>
                    <Link
                      to={dashboardHref("pending", filterCategory)}
                      className={`rounded px-3 py-1.5 transition-colors ${
                        filterStatus === "pending" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Menunggu ({pendingCount})
                    </Link>
                  </div>
                )}
              </div>
            )}

            {filteredRegistrations.length === 0 ? (
              <div className="card flex flex-col items-center justify-center p-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-400">
                  <TicketIcon className="h-6 w-6" />
                </div>
                <h2 className="mt-3 text-sm font-semibold text-gray-900">
                  {registrations.length === 0 ? "Belum ada tiket" : "Tidak ada tiket"}
                </h2>
                {registrations.length === 0 ? (
                  <Link to="/event" className="btn btn-primary btn-sm mt-4">
                    Cari event
                  </Link>
                ) : (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {(filterCategory || filterStatus) && (
                      <Link to="/dashboard" className="btn btn-secondary btn-sm">
                        Reset filter
                      </Link>
                    )}
                    <Link to="/event" className="btn btn-primary btn-sm">
                      Cari event
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredRegistrations.map((r) => {
                  const scannedIds = new Set(r.scans.map((s) => s.checkpointId));
                  const points = r.event.checkpoints.filter((c) => appliesTo(c, readDetails(r.details)));
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
                          <StatusBadge status={r.status} label={REG_STATUS[r.status] ?? r.status} />
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
                          to={`/tiket/${r.id}`}
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
      }}
    </DataGate>
  );
}

