import Link from "next/link";
import { AttendanceEventView } from "@/components/admin/AttendanceEventView";
import { SelfieThumb } from "@/components/admin/AttendanceHistory";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { attendanceStatus, eventsOnDate, getEventAttendanceReport, isDateKey } from "@/lib/attendance";
import { requireAdmin } from "@/lib/auth";
import { isRunning, todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { fmtDuration, fmtNum, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const TONE = { green: "text-green-700", amber: "text-amber-700", gray: "text-gray-700" };

export default async function AttendanceRecapPage({ searchParams }: PageProps<"/superadmin/absensi">) {
  await requireAdmin("superadmin");
  const sp = await searchParams;
  const mode = typeof sp.mode === "string" ? sp.mode : "event"; // default: per event

  // Ambil semua daftar event untuk selektor
  const allEvents = await db.event.findMany({
    orderBy: [{ startDate: "desc" }],
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      status: true,
      location: true,
      _count: { select: { admins: true } },
    },
  });

  // Tentukan event aktif: dari query param, atau event yang sedang berjalan hari ini, atau event terbaru
  const paramEventId = typeof sp.eventId === "string" ? sp.eventId : typeof sp.event === "string" ? sp.event : "";
  const runningEvent = allEvents.find((e) => isRunning(e));
  const selectedEventId = paramEventId || runningEvent?.id || allEvents[0]?.id || "";

  // Jika mode event (default), ambil laporan kehadiran lengkap dari mulai sampai selesai
  const report = selectedEventId ? await getEventAttendanceReport(selectedEventId) : null;

  // Untuk mode tanggal kalender (fallback)
  const rawDate = sp.tanggal;
  const date = isDateKey(rawDate) ? rawDate : todayKeyJakarta();
  const dateEvents = mode === "date" ? await eventsOnDate(date) : [];
  const [dateMembers, dateRows] = mode === "date" ? await Promise.all([
    db.event.findMany({
      where: { id: { in: dateEvents.map((e) => e.id) } },
      select: { id: true, admins: { where: { active: true }, select: { id: true, name: true, position: true, image: true }, orderBy: { name: "asc" } } },
    }),
    db.attendance.findMany({ where: { date } }),
  ]) : [[], []];

  const teamOf = (eventId: string) => dateMembers.find((m) => m.id === eventId)?.admins ?? [];
  const rowOf = (adminId: string, eventId: string) => dateRows.find((r) => r.adminId === adminId && r.eventId === eventId);

  return (
    <div className="space-y-6">
      {/* Header Halaman & Toggle Mode */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Absensi tim</h1>
          <p className="mt-1 text-sm text-gray-600">
            {mode === "event"
              ? "Kehadiran panitia terorganisir per event dari mulai sampai selesai acara, dilengkapi pratinjau rekap."
              : "Kehadiran panitia di pelatihan yang berlangsung pada tanggal kalender tertentu."}
          </p>
        </div>

        {/* Tab Toggle Mode: Per Event (Utama) vs Per Tanggal */}
        <div className="flex items-center rounded-md border border-gray-200 bg-white p-1 text-xs font-medium">
          <Link
            href={`/superadmin/absensi?mode=event${selectedEventId ? `&eventId=${selectedEventId}` : ""}`}
            className={`rounded px-3 py-1.5 transition ${
              mode === "event" ? "bg-brand text-white font-semibold shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rekap Per Event
          </Link>
          <Link
            href={`/superadmin/absensi?mode=date&tanggal=${date}`}
            className={`rounded px-3 py-1.5 transition ${
              mode === "date" ? "bg-brand text-white font-semibold shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Filter Tanggal
          </Link>
        </div>
      </div>

      {/* Mode 1: Per Event (Dari Mulai Sampai Selesai + Preview) */}
      {mode === "event" && (
        <AttendanceEventView
          events={allEvents}
          report={report}
          selectedEventId={selectedEventId}
        />
      )}

      {/* Mode 2: Per Tanggal Kalender (Fallback) */}
      {mode === "date" && (
        <div className="space-y-6">
          <div className="card p-4">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="mode" value="date" />
              <div>
                <label className="label text-xs uppercase tracking-wider text-gray-500" htmlFor="tanggal">
                  Pilih Tanggal Kalender
                </label>
                <input id="tanggal" name="tanggal" type="date" defaultValue={date} className="input" />
              </div>
              <button className="btn btn-secondary">Tampilkan</button>
            </form>
          </div>

          {dateEvents.length === 0 && (
            <p className="card p-6 text-sm text-gray-600 text-center">
              Tidak ada pelatihan yang berlangsung pada tanggal {date}.
            </p>
          )}

          {dateEvents.map((e) => {
            const team = teamOf(e.id);
            const present = team.filter((m) => rowOf(m.id, e.id)).length;
            return (
              <section key={e.id} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{e.name}</h2>
                    <Link
                      href={`/superadmin/absensi?mode=event&eventId=${e.id}`}
                      className="text-xs text-brand hover:underline font-medium"
                    >
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
                        <tr>
                          <td colSpan={5} className="text-center text-gray-500 py-4">
                            Belum ada panitia yang ditugaskan.
                          </td>
                        </tr>
                      )}
                      {team.map((m) => {
                        const r = rowOf(m.id, e.id);
                        const st = attendanceStatus(r, fmtTime);
                        return (
                          <tr key={m.id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={m.name} image={m.image} size={32} />
                                <div>
                                  <Link href={`/superadmin/tim/${m.id}`} className="font-medium text-brand hover:underline">
                                    {m.name}
                                  </Link>
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
                            <td className="whitespace-nowrap font-mono text-xs">
                              {r?.checkOut ? fmtDuration(+r.checkOut - +r.checkIn) : "-"}
                            </td>
                            <td className={`font-medium ${TONE[st.tone]}`}>
                              {r ? (r.checkOut ? "Selesai" : "Bertugas") : "Belum absen"}
                            </td>
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
}
