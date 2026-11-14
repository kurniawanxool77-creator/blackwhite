"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EyeIcon, MapPinIcon } from "@/components/ui/icons";
import { fmtDuration, fmtNum, fmtTime } from "@/lib/format";
import type { AttendanceRowData, DayReport, MemberAttendanceRow } from "@/lib/attendance";

export type Tone = "green" | "gray" | "amber" | "red";

export const TONE_CLASSES: Record<Tone, string> = {
  green: "text-green-700 bg-green-50 border-green-200",
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  gray: "text-gray-700 bg-gray-50 border-gray-200",
  red: "text-red-700 bg-red-50 border-red-200",
};

type Props = {
  day: DayReport;
  members: MemberAttendanceRow[];
  location: string;
  onOpen: (admin: MemberAttendanceRow["admin"], dayLabel: string, att: AttendanceRowData | null, status: string, tone: Tone) => void;
  onDelete?: (attendanceId: string, adminName: string) => Promise<void> | void;
};

function dayStatus(r: AttendanceRowData | null, day: DayReport): [string, Tone] {
  if (r) return r.checkOut ? ["Selesai", "gray"] : ["Bertugas", "green"];
  if (day.isPast) return ["Tidak hadir", "red"];
  if (day.isFuture) return ["Mendatang", "gray"];
  return ["Belum absen", "amber"];
}

// Foto kecil + jam; klik membuka popup detail absensi.
function PhotoTime({ photo, alt, time, note, onClick }: { photo: string | null; alt: string; time: Date; note: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex cursor-pointer items-center gap-2 text-left hover:opacity-85" title="Klik untuk melihat foto, lokasi, dan jam">
      {photo ? (
        <span className="relative inline-block h-9 w-9 overflow-hidden rounded border border-gray-200">
          <img src={photo} alt={alt} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        </span>
      ) : (
        <span className="inline-block h-9 w-9 rounded border border-dashed border-gray-300" title="Tanpa foto" />
      )}
      <div>
        <span className="block font-mono text-sm font-semibold text-gray-900 group-hover:text-brand">{fmtTime(time)}</span>
        {note}
      </div>
    </button>
  );
}

export function AttendanceDayTable({ day, members, location, onOpen, onDelete }: Props) {
  const presentCount = members.filter((m) => m.attendanceByDate[day.dateKey]).length;

  return (
    <section className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-5 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{day.label}</h3>
          {day.isToday && (
            <span className="rounded border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Hari Ini</span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          <b className="text-gray-900">{fmtNum(presentCount)}</b> dari {fmtNum(members.length)} hadir
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Anggota Tim</th>
              <th>Datang</th>
              <th>Selesai</th>
              <th>Durasi</th>
              <th>Status</th>
              <th className="text-right">Preview</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  Belum ada anggota tim yang ditugaskan.
                </td>
              </tr>
            )}
            {members.map(({ admin, attendanceByDate }) => {
              const r = attendanceByDate[day.dateKey] ?? null;
              const [statusLabel, statusTone] = dayStatus(r, day);
              const open = () => onOpen(admin, day.label, r, statusLabel, statusTone);

              return (
                <tr key={admin.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={admin.name} image={admin.image} size={32} />
                      <div>
                        <Link href={`/superadmin/tim/${admin.id}`} className="font-medium text-brand hover:underline">
                          {admin.name}
                        </Link>
                        <p className="text-xs text-gray-500">{admin.position || "Tim"}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {r ? (
                      <PhotoTime
                        photo={r.checkInPhoto}
                        alt={`Foto datang ${admin.name}`}
                        time={r.checkIn}
                        onClick={open}
                        note={
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                            <MapPinIcon width={10} height={10} className="shrink-0 text-brand" />
                            {location}
                          </span>
                        }
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td>
                    {r?.checkOut ? (
                      <PhotoTime
                        photo={r.checkOutPhoto}
                        alt={`Foto selesai ${admin.name}`}
                        time={r.checkOut}
                        onClick={open}
                        note={<span className="text-[10px] text-gray-500">Selesai tugas</span>}
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="font-mono text-xs whitespace-nowrap text-gray-700">
                    {r?.checkOut ? fmtDuration(+r.checkOut - +r.checkIn) : r ? "Bertugas" : "—"}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[statusTone]}`}>{statusLabel}</span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button type="button" onClick={open} className="btn btn-secondary btn-sm" title="Lihat popup lokasi, foto, dan jam presensi">
                        <EyeIcon width={14} height={14} />
                        Preview
                      </button>
                      {r && onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus data absensi ${admin.name} pada ${day.label}? Catatan presensi dan foto selfie akan dihapus.`)) {
                              onDelete(r.id, admin.name);
                            }
                          }}
                          className="btn btn-danger btn-sm"
                          title="Hapus data absensi ini"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
