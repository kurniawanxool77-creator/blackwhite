import { Link, useSearchParams } from "react-router-dom";
import { AttendanceEventView } from "@/components/admin/AttendanceEventView";
import { SelfieThumb } from "@/components/admin/AttendanceHistory";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { EventAttendanceReport } from "@/lib/attendance";
import { fmtDuration, fmtNum, fmtTime } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type AttendancePagePayload = {
  mode: string;
  allEvents: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    location: string;
    _count: { admins: number };
  }[];
  selectedEventId: string;
  report: EventAttendanceReport | null;
  date: string;
  dateEvents: { id: string; name: string }[];
  dateMembers: { id: string; admins: { id: string; name: string; position: string; image: string | null }[] }[];
  dateRows: {
    id: string;
    adminId: string;
    eventId: string;
    checkIn: Date;
    checkOut: Date | null;
    checkInPhoto: string | null;
    checkOutPhoto: string | null;
  }[];
};

function rowTone(r: AttendancePagePayload["dateRows"][number] | undefined) {
  if (!r) return { label: "Belum absen", cls: "text-amber-700" };
  return r.checkOut ? { label: "Selesai", cls: "text-gray-600" } : { label: "Bertugas", cls: "text-green-700" };
}

export function SuperadminAttendancePage() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const state = useApiData<AttendancePagePayload>(qs ? `/api/superadmin/absensi?${qs}` : "/api/superadmin/absensi");

  return (
    <DataGate state={state}>
      {({ mode, allEvents, selectedEventId, report, date, dateEvents, dateMembers, dateRows }) => {
        const teamOf = (eid: string) => dateMembers.find((d) => d.id === eid)?.admins ?? [];
        const rowOf = (aid: string, eid: string) => dateRows.find((r) => r.adminId === aid && r.eventId === eid);

        return (
          <div className="space-y-6">
            <PageHeader title="Absensi tim panitia" description="Rekap kehadiran panitia dan foto selfie check-in/check-out per event atau tanggal." />

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <Link to="/superadmin/absensi?mode=event" className={`rounded px-3 py-1.5 ${mode !== "date" ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
                Rekap Per Event
              </Link>
              <Link to="/superadmin/absensi?mode=date" className={`rounded px-3 py-1.5 ${mode === "date" ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
                Kalender Harian
              </Link>
            </div>

            {mode !== "date" ? (
              <AttendanceEventView events={allEvents} report={report} selectedEventId={selectedEventId} />
            ) : (
              <div className="space-y-6">
                <div className="card p-4">
                  <form method="get" action="/superadmin/absensi" className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="mode" value="date" />
                    <div>
                      <label className="label text-xs tracking-wider text-gray-500 uppercase" htmlFor="tanggal">Pilih Tanggal Kalender</label>
                      <input id="tanggal" name="tanggal" type="date" defaultValue={date} className="input" />
                    </div>
                    <button className="btn btn-secondary">Tampilkan</button>
                  </form>
                </div>

                {dateEvents.length === 0 && (
                  <p className="card p-6 text-center text-sm text-gray-600">Tidak ada pelatihan yang berlangsung pada tanggal {date}.</p>
                )}

                {dateEvents.map((e) => {
                  const team = teamOf(e.id);
                  const present = team.filter((m) => rowOf(m.id, e.id)).length;
                  return (
                    <section key={e.id} className="card">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-5 py-3">
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-gray-900">{e.name}</h2>
                          <Link to={`/superadmin/absensi?mode=event&eventId=${e.id}`} className="text-xs font-medium text-brand hover:underline">
                            (Lihat rekap penuh event →)
                          </Link>
                        </div>
                        <p className="text-sm text-gray-600">
                          <b className="text-gray-900">{fmtNum(present)}</b> dari {fmtNum(team.length)} hadir
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Anggota tim</th>
                              <th>Datang</th>
                              <th>Selesai</th>
                              <th>Durasi</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.length === 0 && (
                              <tr><td colSpan={5} className="py-4 text-center text-gray-500">Belum ada panitia yang ditugaskan.</td></tr>
                            )}
                            {team.map((m) => {
                              const r = rowOf(m.id, e.id);
                              const st = rowTone(r);
                              return (
                                <tr key={m.id}>
                                  <td>
                                    <div className="flex items-center gap-2.5">
                                      <UserAvatar name={m.name} image={m.image} size={32} />
                                      <div>
                                        <Link to={`/superadmin/tim/${m.id}`} className="font-medium text-brand hover:underline">{m.name}</Link>
                                        <p className="text-xs text-gray-500">{m.position || "Panitia"}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {r ? (
                                      <div className="flex items-center gap-2">
                                        <SelfieThumb src={r.checkInPhoto} label={`Foto datang ${m.name}`} />
                                        <span className="font-mono text-sm">{fmtTime(r.checkIn)}</span>
                                      </div>
                                    ) : "-"}
                                  </td>
                                  <td>
                                    {r?.checkOut ? (
                                      <div className="flex items-center gap-2">
                                        <SelfieThumb src={r.checkOutPhoto} label={`Foto selesai ${m.name}`} />
                                        <span className="font-mono text-sm">{fmtTime(r.checkOut)}</span>
                                      </div>
                                    ) : "-"}
                                  </td>
                                  <td className="font-mono text-xs whitespace-nowrap">
                                    {r?.checkOut ? fmtDuration(+new Date(r.checkOut) - +new Date(r.checkIn)) : "-"}
                                  </td>
                                  <td className={`font-medium ${st.cls}`}>{st.label}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
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

