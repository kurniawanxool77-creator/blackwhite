"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CalendarIcon, ClockIcon, EyeIcon, MapPinIcon, UsersIcon } from "@/components/ui/icons";
import { fmtDateRange, fmtDuration, fmtNum, fmtTime } from "@/lib/format";
import type { AttendanceRowData, EventAttendanceReport } from "@/lib/attendance";
import { AttendanceDayTable, TONE_CLASSES, type Tone } from "./AttendanceDayTable";
import { AttendancePhotoModal, type AttendanceDetailPopupData } from "./AttendancePhotoModal";
import { AttendancePreviewModal } from "./AttendancePreviewModal";
import { deleteAttendance } from "@/src/lib/actions/superadmin";

type EventOption = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
  location: string;
  _count: { admins: number };
};

type Props = {
  events: EventOption[];
  report: EventAttendanceReport | null;
  selectedEventId: string;
};

export function AttendanceEventView({ events, report, selectedEventId }: Props) {
  const router = useRouter();
  const [selectedDayKey, setSelectedDayKey] = useState<string>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [popupData, setPopupData] = useState<AttendanceDetailPopupData | null>(null);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedDayKey("all");
    router.push(`/superadmin/absensi?eventId=${newId}`);
  };

  if (!report) {
    return (
      <div className="card p-8 text-center text-gray-600">
        <p className="text-base font-semibold text-gray-900">Belum ada data event</p>
        <p className="mt-1 text-sm">Silakan buat atau pilih event terlebih dahulu.</p>
      </div>
    );
  }

  const { event, days, members, summary } = report;

  // Tentukan hari yang sedang ditampilkan
  const activeDays = selectedDayKey === "all" ? days : days.filter((d) => d.dateKey === selectedDayKey);

  const openDetailPopup = (
    admin: { name: string; position?: string },
    dayLabel: string,
    att?: AttendanceRowData | null,
    status = "Belum absen",
    statusTone: Tone = "amber"
  ) => {
    setPopupData({
      attendanceId: att?.id,
      adminName: admin.name,
      adminPosition: admin.position || "Tim",
      eventName: event.name,
      dateLabel: dayLabel,
      location: event.location,
      checkInTime: att ? fmtTime(att.checkIn) : undefined,
      checkOutTime: att?.checkOut ? fmtTime(att.checkOut) : undefined,
      duration: att?.checkOut ? fmtDuration(+att.checkOut - +att.checkIn) : undefined,
      status,
      statusTone,
      checkInPhoto: att?.checkInPhoto ?? null,
      checkOutPhoto: att?.checkOutPhoto ?? null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Baris Kontrol Utama: Pilih Event & Tombol Preview */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor="event-select" className="label text-xs uppercase tracking-wider text-gray-500">
              Pilih Event / Acara
            </label>
            <div className="relative mt-1">
              <select
                id="event-select"
                value={selectedEventId}
                onChange={handleEventChange}
                className="input font-medium text-gray-900 pr-10"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="btn btn-primary"
            >
              <EyeIcon width={18} height={18} />
              Pratinjau / Preview Rekap
            </button>
          </div>
        </div>

        {/* Ringkasan Header Event */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
              <CalendarIcon width={15} height={15} className="text-brand" />
              Periode: {fmtDateRange(event.startDate, event.endDate)} ({summary.totalDays} hari)
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-gray-700">
              <MapPinIcon width={13} height={13} className="text-gray-500" />
              Lokasi: <b className="text-gray-900">{event.location}</b>
            </span>
            <span>·</span>
            <span>Kategori: <b className="text-gray-900">{event.category || "Umum"}</b></span>
          </div>
          <Link
            href={`/superadmin/events/${event.id}`}
            className="text-brand hover:underline font-medium"
          >
            Kelola event ini →
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <UsersIcon width={16} height={16} className="text-gray-400" />
            <span>Total Tim</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{fmtNum(summary.totalTeam)}</p>
          <p className="text-xs text-gray-500">Tim yang bertugas</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarIcon width={16} height={16} className="text-gray-400" />
            <span>Hari Event</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.totalDays} Hari</p>
          <p className="text-xs text-gray-500">Mulai s/d selesai</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span>Tingkat Presensi</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-brand">{summary.attendanceRate}%</p>
          <p className="text-xs text-gray-500">{summary.totalPresent} dari {summary.totalMandays} kehadiran</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ClockIcon width={16} height={16} className="text-gray-400" />
            <span>Akumulasi Jam</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.formattedTotalWork}</p>
          <p className="text-xs text-gray-500">Total durasi kerja tim</p>
        </div>
      </div>

      {/* Filter Tabs Hari: "Semua Hari (Rekap Mulai s/d Selesai)" atau Hari Tertentu */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setSelectedDayKey("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            selectedDayKey === "all"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Semua Hari (Rekap Mulai s/d Selesai)
        </button>
        {days.map((d) => (
          <button
            key={d.dateKey}
            type="button"
            onClick={() => setSelectedDayKey(d.dateKey)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              selectedDayKey === d.dateKey
                ? "bg-brand text-white shadow-xs"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {d.shortLabel} {d.isToday && "(Hari ini)"}
          </button>
        ))}
      </div>

      {/* Matriks Ringkasan jika "Semua Hari" dipilih */}
      {selectedDayKey === "all" && (
        <section className="card">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 px-5 py-3">
            <div>
              <h2 className="font-semibold text-gray-900">Matriks Kehadiran Tim (Mulai s/d Selesai)</h2>
              <p className="text-xs text-gray-500">Ringkasan presensi seluruh anggota tim dari hari pertama hingga hari terakhir acara.</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1"
            >
              <EyeIcon width={14} height={14} />
              Buka versi cetak
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Anggota Tim</th>
                  {days.map((d) => (
                    <th key={d.dateKey} className="text-center whitespace-nowrap">
                      {d.shortLabel}
                    </th>
                  ))}
                  <th className="text-center">Total Hadir</th>
                  <th className="text-right">Total Durasi</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3 + days.length} className="text-center text-gray-500 py-6">
                      Belum ada anggota tim yang ditugaskan ke event ini.
                    </td>
                  </tr>
                )}
                {members.map((m) => (
                  <tr key={m.admin.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={m.admin.name} image={m.admin.image} size={32} />
                        <div>
                          <Link href={`/superadmin/tim/${m.admin.id}`} className="font-medium text-brand hover:underline">
                            {m.admin.name}
                          </Link>
                          <p className="text-xs text-gray-500">{m.admin.position || "Tim"}</p>
                        </div>
                      </div>
                    </td>
                    {days.map((d) => {
                      const att = m.attendanceByDate[d.dateKey];
                      if (!att) {
                        const label = d.isFuture ? "Mendatang" : d.isToday ? "Belum absen" : "Alpha";
                        const tone = d.isFuture ? "gray" : d.isToday ? "amber" : "red";
                        return (
                          <td key={d.dateKey} className="text-center whitespace-nowrap">
                            <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone]}`}>
                              {label}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td key={d.dateKey} className="text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              openDetailPopup(
                                m.admin,
                                d.label,
                                att,
                                att.checkOut ? "Selesai" : "Bertugas",
                                att.checkOut ? "gray" : "green"
                              )
                            }
                            className="inline-flex flex-col items-center rounded border border-green-200 bg-green-50 px-2 py-1 text-xs hover:border-brand cursor-pointer"
                            title="Klik untuk melihat foto, jam, dan lokasi presensi"
                          >
                            <span className="font-semibold text-green-800 font-mono">
                              {fmtTime(att.checkIn)} {att.checkOut && `– ${fmtTime(att.checkOut)}`}
                            </span>
                            <span className="text-[10px] text-green-700">
                              {att.checkOut ? fmtDuration(+att.checkOut - +att.checkIn) : "Sedang bertugas"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-center font-semibold text-gray-900 whitespace-nowrap">
                      {m.presentDays} / {days.length} hari
                    </td>
                    <td className="text-right font-medium text-gray-800 whitespace-nowrap">
                      {m.formattedWork}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rincian Kehadiran Per Hari (Tabel Detail dengan Popup Foto, Jam, Lokasi, dan Tombol Preview) */}
      <div className="space-y-4">
        {activeDays.map((day) => (
          <AttendanceDayTable
            key={day.dateKey}
            day={day}
            members={members}
            location={event.location}
            onOpen={openDetailPopup}
            onDelete={async (id) => {
              await deleteAttendance(id);
              window.location.reload();
            }}
          />
        ))}
      </div>

      {/* Modal Preview Laporan Resmi */}
      <AttendancePreviewModal
        report={report}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {/* Popup Dialog Foto, Jam, dan Lokasi */}
      <AttendancePhotoModal
        data={popupData}
        onClose={() => setPopupData(null)}
        onDelete={async (id) => {
          await deleteAttendance(id);
          window.location.reload();
        }}
      />
    </div>
  );
}
