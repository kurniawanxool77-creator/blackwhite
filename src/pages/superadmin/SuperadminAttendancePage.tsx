import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AttendanceEventView } from "@/components/admin/AttendanceEventView";
import { SelfieThumb } from "@/components/admin/AttendanceHistory";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const state = useApiData<AttendancePagePayload>(qs ? `/api/superadmin/absensi?${qs}` : "/api/superadmin/absensi");

  return (
    <DataGate state={state}>
      {({ mode, allEvents, selectedEventId, report, date, dateEvents, dateMembers, dateRows }) => {
        const teamOf = (eid: string) => dateMembers.find((d) => d.id === eid)?.admins ?? [];
        const rowOf = (aid: string, eid: string) => dateRows.find((r) => r.adminId === aid && r.eventId === eid);

        function onFilterDate(e: React.SubmitEvent<HTMLFormElement>) {
          e.preventDefault();
          const val = String(new FormData(e.currentTarget).get("tanggal") ?? "").trim();
          navigate(`/superadmin/absensi?mode=date${val ? `&tanggal=${encodeURIComponent(val)}` : ""}`);
        }

        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Absensi tim</h1>
                <p className="mt-1 text-sm text-gray-600">
                  {mode !== "date"
                    ? "Kehadiran panitia terorganisir per event dari mulai sampai selesai acara, dilengkapi pratinjau rekap."
                    : "Kehadiran panitia di pelatihan yang berlangsung pada tanggal kalender tertentu."}
                </p>
              </div>
              <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 text-xs font-medium">
                <Link
                  to={`/superadmin/absensi?mode=event${selectedEventId ? `&eventId=${selectedEventId}` : ""}`}
                  className={`rounded px-3 py-1.5 transition ${mode !== "date" ? "bg-brand font-semibold text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Rekap Per Event
                </Link>
                <Link
                  to={`/superadmin/absensi?mode=date&tanggal=${date}`}
                  className={`rounded px-3 py-1.5 transition ${mode === "date" ? "bg-brand font-semibold text-white shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Filter Tanggal
                </Link>
              </div>
            </div>

            {mode !== "date" ? (
              <AttendanceEventView events={allEvents} report={report} selectedEventId={selectedEventId} />
            ) : (
              <div className="space-y-6">
                <div className="card p-4">
                  <form method="get" onSubmit={onFilterDate} action="/superadmin/absensi" className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="mode" value="date" />
                    <div>
                      <label className="label text-xs tracking-wider text-gray-500 uppercase" htmlFor="tanggal">Pilih Tanggal Kalender</label>
                      <input id="tanggal" name="tanggal" type="date" defaultValue={date} key={date} className="input" />
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

