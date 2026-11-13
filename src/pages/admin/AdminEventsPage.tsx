import type { Event } from "@prisma/client";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { QrCodeIcon } from "@/components/ui/icons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EVENT_STATUS, fmtDateRange, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type AdminEventRow = Event & { _count: { checkpoints: number; registrations: number } };

export function AdminEventsPage() {
  const state = useApiData<{ events: AdminEventRow[]; onDutyEventIds: string[] }>("/api/admin/events");

  return (
    <DataGate state={state}>
      {({ events, onDutyEventIds }) => {
        const dutySet = new Set(onDutyEventIds);
        return (
          <div className="space-y-5">
            <PageHeader title="Event yang ditugaskan" description="Buka detail peserta, shuttle, atau scan QR per event." />
            {events.length === 0 ? (
              <div className="card p-6 text-sm text-gray-600">Belum ada event aktif yang ditugaskan kepada Anda.</div>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => {
                  const onDuty = dutySet.has(e.id);
                  return (
                    <li key={e.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={e.status} label={EVENT_STATUS[e.status] ?? e.status} />
                          {onDuty && (
                            <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">Sedang bertugas</span>
                          )}
                        </div>
                        <Link to={`/admin/events/${e.id}`} className="mt-1.5 block font-semibold text-gray-900 hover:text-brand">
                          {e.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {e.location} · {fmtDateRange(e.startDate, e.endDate)} · {fmtNum(e._count.registrations)} peserta · {fmtNum(e._count.checkpoints)} pos scan
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/events/${e.id}`} className="btn btn-secondary btn-sm">Peserta</Link>
                        <Link to={`/admin/events/${e.id}/scan`} className="btn btn-primary btn-sm">
                          <QrCodeIcon width={16} height={16} /> Scan
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }}
    </DataGate>
  );
}

