import Link from "next/link";
import type { myAttendanceToday } from "@/lib/attendance";
import { dayStart } from "@/lib/schedule";
import { fmtDuration, fmtTime } from "@/lib/format";
import { AttendanceButton } from "./AttendanceButton";
import { LiveClock } from "./LiveClock";

function Selfie({ src, label }: { src: string | null; label: string }) {
  if (!src) return null;
  return <img src={src} alt={label} title={label} className="h-14 w-14 rounded-md border border-gray-200 object-cover" />;
}

export type AttendanceTodayProps = Awaited<ReturnType<typeof myAttendanceToday>>;

// Kartu absensi hari ini (gaya aplikasi HRIS): jam berjalan, lalu per pelatihan yang berlangsung
// tombol besar absen datang / selesai acara dengan foto. Fitur event baru terbuka setelah absen datang.
export function AttendancePanel({ date, items }: AttendanceTodayProps) {
  const today = dayStart(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <section className="card overflow-hidden">
      <div className="bg-brand px-5 py-4 text-white">
        <p className="text-sm text-white/80">{today}</p>
        <LiveClock className="mt-0.5 block text-4xl font-bold tracking-tight tabular-nums" />
        <p className="mt-1 text-xs text-white/80">Absen datang dulu untuk membuka fitur event.</p>
      </div>

      {items.length === 0 ? (
        <p className="p-5 text-sm text-gray-600">Tidak ada pelatihan yang Anda pegang yang berlangsung hari ini.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map(({ event, row }) => (
            <li key={event.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{event.name}</p>
                  <p className={`mt-0.5 text-sm font-medium ${!row ? "text-amber-700" : row.checkOut ? "text-gray-600" : "text-green-700"}`}>
                    {!row && "Belum absen · fitur event terkunci"}
                    {row && !row.checkOut && `Bertugas sejak ${fmtTime(row.checkIn)}`}
                    {row?.checkOut && `Selesai ${fmtTime(row.checkOut)} · ${fmtDuration(+row.checkOut - +row.checkIn)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Selfie src={row?.checkInPhoto ?? null} label="Foto absen datang" />
                  <Selfie src={row?.checkOutPhoto ?? null} label="Foto absen selesai" />
                </div>
              </div>

              {row && (
                <div className="grid grid-cols-2 gap-2 rounded-md bg-gray-50 p-3 text-center text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Datang</p>
                    <p className="font-semibold text-gray-900 tabular-nums">{fmtTime(row.checkIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Selesai</p>
                    <p className="font-semibold text-gray-900 tabular-nums">{row.checkOut ? fmtTime(row.checkOut) : "--.--"}</p>
                  </div>
                </div>
              )}

              {!row && <AttendanceButton eventId={event.id} type="in" className="btn btn-success h-14 w-full text-base" />}
              {row && !row.checkOut && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link href={`/admin/events/${event.id}`} className="btn btn-primary h-12 w-full">Buka event</Link>
                  <AttendanceButton eventId={event.id} type="out" className="btn btn-secondary h-12 w-full" />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
