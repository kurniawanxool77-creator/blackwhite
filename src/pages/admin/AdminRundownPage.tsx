import type { Checkpoint, Event } from "@prisma/client";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { ClockIcon, MapPinIcon, QrCodeIcon } from "@/components/ui/icons";
import { CHECKPOINT_KIND, fmtDateRange, fmtNum } from "@/lib/format";
import { audienceLabel } from "@/lib/rundown";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type RundownEvent = Event & {
  checkpoints: (Checkpoint & { _count: { scans: number } })[];
  _count: { registrations: number };
};

export function AdminRundownPage() {
  const state = useApiData<{ events: RundownEvent[] }>("/api/admin/rundown");

  return (
    <DataGate state={state}>
      {({ events }) => (
        <div className="space-y-6">
          <PageHeader title="Rundown & Pos Lapangan" description="Pantau jadwal sesi dan progres verifikasi barcode di tiap pos." />

          {events.length === 0 ? (
            <div className="card p-6 text-sm text-gray-600">Belum ada event aktif yang ditugaskan.</div>
          ) : (
            events.map((event) => {
              const totalApproved = event._count.registrations;
              return (
                <section key={event.id} className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{event.name}</h2>
                      <p className="text-xs text-gray-500">
                        {event.location} · {fmtDateRange(event.startDate, event.endDate)} · {fmtNum(totalApproved)} peserta disetujui
                      </p>
                    </div>
                    <Link to={`/admin/events/${event.id}/scan`} className="btn btn-secondary btn-sm text-xs">
                      Mode scan
                    </Link>
                  </div>

                  {event.checkpoints.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-500">Belum ada item rundown.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {event.checkpoints.map((cp) => {
                        const scanned = cp._count.scans;
                        const percent = totalApproved > 0 ? Math.min(100, Math.round((scanned / totalApproved) * 100)) : 0;
                        const aud = audienceLabel(cp);
                        return (
                          <div key={cp.id} className="space-y-2 px-5 py-3.5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900">{cp.name}</span>
                                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                    {CHECKPOINT_KIND[cp.kind] ?? cp.kind}
                                  </span>
                                  {aud && (
                                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800">
                                      Khusus: {aud}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                  {(cp.startTime || cp.endTime) && (
                                    <span className="inline-flex items-center gap-1">
                                      <ClockIcon className="h-3.5 w-3.5" />
                                      {[cp.startTime, cp.endTime].filter(Boolean).join(" – ")}
                                    </span>
                                  )}
                                  {cp.place && (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPinIcon className="h-3.5 w-3.5" />
                                      {cp.place}
                                    </span>
                                  )}
                                  {cp.scan && <span className="font-medium text-gray-700">{fmtNum(scanned)} / {fmtNum(totalApproved)} scan</span>}
                                </div>
                              </div>

                              {cp.scan && (
                                <Link to={`/admin/events/${event.id}/scan/${cp.id}`} className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs">
                                  <QrCodeIcon className="h-3.5 w-3.5" />
                                  <span>Scan di Pos Ini</span>
                                </Link>
                              )}
                            </div>

                            {cp.scan && (
                              <div className="space-y-1 pt-1">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                  <div className="h-full rounded-full bg-emerald-600 transition-all duration-300" style={{ width: `${percent}%` }} />
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
                </section>
              );
            })
          )}
        </div>
      )}
    </DataGate>
  );
}

