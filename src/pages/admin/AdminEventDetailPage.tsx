import type { Checkpoint, Event, Registration, User } from "@prisma/client";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AttendanceButton } from "@/components/admin/AttendanceButton";
import { RegistrationTable } from "@/components/admin/RegistrationTable";
import { ShuttlePanel } from "@/components/admin/ShuttlePanel";
import { QrCodeIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CHECKPOINT_KIND, EVENT_STATUS, fmtDateRange, fmtNum } from "@/lib/format";
import { dayKey } from "@/lib/schedule";
import type { shuttleManifest } from "@/lib/shuttle";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type AdminEventPayload = {
  event: Event & { checkpoints: (Checkpoint & { _count: { scans: number } })[] };
  registrations: (Registration & { user: User; _count: { scans: number } })[];
  counts: Record<string, number>;
  routes: Awaited<ReturnType<typeof shuttleManifest>>;
  onDuty: boolean;
};

export function AdminEventDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "approved";
  const q = searchParams.get("q") || "";
  const tab = searchParams.get("tab") || "peserta";

  const apiUrl = id
    ? `/api/admin/events/${encodeURIComponent(id)}?status=${encodeURIComponent(status)}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    : null;
  const state = useApiData<AdminEventPayload>(apiUrl);

  return (
    <DataGate state={state} notFoundTitle="Event tidak ditemukan" backTo="/admin/events">
      {({ event, registrations, counts, routes, onDuty }) => {
        return (
          <div className="space-y-6">
            {!onDuty && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                <div>
                  <p className="font-semibold text-amber-900">Belum absen datang</p>
                  <p className="text-xs text-amber-700">Absen datang dengan foto selfie untuk mulai bertugas dan memindai QR di event ini.</p>
                </div>
                <AttendanceButton eventId={event.id} type="in" className="btn btn-success btn-sm shrink-0" />
              </div>
            )}
            <div>
              <Link to="/admin/events" className="text-sm text-gray-500 hover:text-brand">← Event saya</Link>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={event.status} label={EVENT_STATUS[event.status] ?? event.status} />
                    {event.category && <span className="text-xs text-gray-500">{event.category}</span>}
                  </div>
                  <h1 className="mt-1 text-xl font-bold text-gray-900">{event.name}</h1>
                  <p className="text-sm text-gray-600">
                    {event.location} · {fmtDateRange(event.startDate, event.endDate)}
                  </p>
                </div>
                <Link to={`/admin/events/${event.id}/scan`} className="btn btn-primary btn-sm">
                  <QrCodeIcon width={16} height={16} /> Buka Scanner
                </Link>
              </div>
            </div>

            <nav className="flex gap-1 border-b border-gray-200 text-sm">
              {[
                { key: "peserta", label: `Peserta (${fmtNum(counts.approved ?? 0)})` },
                { key: "rundown", label: `Pos scan (${fmtNum(event.checkpoints.length)})` },
                { key: "shuttle", label: `Shuttle (${fmtNum(routes.length)})` },
              ].map((t) => (
                <Link
                  key={t.key}
                  to={`/admin/events/${event.id}?tab=${t.key}`}
                  className={`border-b-2 px-3 py-2 font-medium ${tab === t.key ? "border-brand text-brand" : "border-transparent text-gray-600 hover:text-gray-900"}`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            {tab === "shuttle" ? (
              <ShuttlePanel
                eventId={event.id}
                routes={routes}
                defaultDate={dayKey(event.startDate)}
                detailBase={`/admin/events/${event.id}/peserta`}
                readOnly
              />
            ) : tab === "rundown" ? (
              <section className="card divide-y divide-gray-100">
                {event.checkpoints.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500">Belum ada pos scan di event ini.</p>
                ) : (
                  event.checkpoints.map((cp) => (
                    <div key={cp.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{cp.name}</p>
                        <p className="text-xs text-gray-500">
                          {CHECKPOINT_KIND[cp.kind] ?? cp.kind} · {fmtNum(cp._count.scans)} sudah di-scan
                        </p>
                      </div>
                      {cp.scan && (
                        <Link to={`/admin/events/${event.id}/scan/${cp.id}`} className="btn btn-primary btn-sm">Scan</Link>
                      )}
                    </div>
                  ))
                )}
              </section>
            ) : (
              <RegistrationTable
                eventId={event.id}
                filter={status}
                counts={counts}
                checkpoints={event.checkpoints}
                registrations={registrations}
                readOnly
                q={q}
                detailBase={`/admin/events/${event.id}/peserta`}
                tab="peserta"
                mode={event.mode}
                useQr={event.useQr}
              />
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

