import { dayStart } from "@/lib/attendance";
import { fmtDuration, fmtTime } from "@/lib/format";

type Row = {
  id: string;
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  event: { name: string };
};

// Foto selfie kecil; klik untuk membuka ukuran penuh.
export function SelfieThumb({ src, label }: { src: string | null; label: string }) {
  if (!src) return <span className="inline-block h-9 w-9 rounded-md border border-dashed border-gray-300" title={`${label}: tidak ada foto`} />;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" title={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} loading="lazy" className="h-9 w-9 rounded-md border border-gray-200 object-cover" />
    </a>
  );
}

const dayLabel = (date: string) =>
  dayStart(date).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Riwayat absensi: kartu ringkas di HP, tabel di layar lebar.
export function AttendanceHistory({ rows, empty = "Belum ada absensi." }: { rows: Row[]; empty?: string }) {
  return (
    <>
    <ul className="space-y-2 md:hidden">
      {rows.length === 0 && <li className="card p-4 text-center text-sm text-gray-500">{empty}</li>}
      {rows.map((r) => (
        <li key={r.id} className="card flex items-center gap-3 p-3">
          <SelfieThumb src={r.checkInPhoto} label="Foto absen datang" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{r.event.name}</p>
            <p className="text-xs text-gray-600">{dayLabel(r.date)}</p>
          </div>
          <div className="text-right text-sm tabular-nums">
            <p className="font-semibold text-gray-900">
              {fmtTime(r.checkIn)} – {r.checkOut ? fmtTime(r.checkOut) : "…"}
            </p>
            <p className="text-xs text-gray-500">{r.checkOut ? fmtDuration(+r.checkOut - +r.checkIn) : "Belum selesai"}</p>
          </div>
        </li>
      ))}
    </ul>
    <div className="card hidden overflow-x-auto md:block">
      <table className="table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Pelatihan</th>
            <th>Datang</th>
            <th>Selesai</th>
            <th className="text-right">Durasi</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-gray-500">{empty}</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">
                {dayLabel(r.date)}
              </td>
              <td>{r.event.name}</td>
              <td>
                <div className="flex items-center gap-2">
                  <SelfieThumb src={r.checkInPhoto} label="Foto absen datang" />
                  {fmtTime(r.checkIn)}
                </div>
              </td>
              <td>
                {r.checkOut ? (
                  <div className="flex items-center gap-2">
                    <SelfieThumb src={r.checkOutPhoto} label="Foto absen selesai" />
                    {fmtTime(r.checkOut)}
                  </div>
                ) : (
                  <span className="text-amber-700">Belum selesai</span>
                )}
              </td>
              <td className="text-right whitespace-nowrap">{r.checkOut ? fmtDuration(+r.checkOut - +r.checkIn) : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
