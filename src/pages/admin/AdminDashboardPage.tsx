import type { Checkpoint, Event, Registration, Scan, User } from "@prisma/client";
import { Link } from "react-router-dom";
import { AttendancePanel, type AttendanceTodayProps } from "@/components/admin/AttendancePanel";
import { ChevronRightIcon, QrCodeIcon } from "@/components/ui/icons";
import { fmtDateRange, fmtDateTime, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type DashboardEvent = Event & {
  checkpoints: (Checkpoint & { _count: { scans: number } })[];
  registrations: (Registration & { user: Pick<User, "id" | "name" | "email">; _count: { scans: number } })[];
};

type RecentScan = Scan & {
  registration: { user: Pick<User, "name"> };
  checkpoint: { name: string; event: { name: string } };
};

type AdminDashboardPayload = {
  greeting: string;
  events: DashboardEvent[];
  recentScans: RecentScan[];
  totalScansByAdmin: number;
  attendanceToday: AttendanceTodayProps;
};

export function AdminDashboardPage() {
  const state = useApiData<AdminDashboardPayload>("/api/admin/dashboard");

  return (
    <DataGate state={state}>
      {({ greeting, events, recentScans, totalScansByAdmin, attendanceToday }) => (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500">{greeting},</p>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Portal Panitia</h1>
              <p className="mt-0.5 text-sm text-gray-600">Absensi petugas, pemindaian QR peserta, dan kendali lapangan.</p>
            </div>
            <Link to="/admin/scan" className="btn btn-primary btn-sm">
              <QrCodeIcon width={16} height={16} />
              Scan QR
            </Link>
          </div>

          <AttendancePanel date={attendanceToday.date} items={attendanceToday.items} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-4">
              <p className="text-xs text-gray-500">Pelatihan ditugaskan</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">{fmtNum(events.length)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Total scan oleh Anda</p>
              <p className="mt-1 text-2xl font-bold text-brand tabular-nums">{fmtNum(totalScansByAdmin)}</p>
            </div>
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Pelatihan yang ditugaskan</h2>
              <Link to="/admin/events" className="text-xs font-medium text-brand hover:underline">Semua event</Link>
            </div>
            {events.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">Belum ada pelatihan aktif yang ditugaskan.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {events.map((e) => (
                  <li key={e.id}>
                    <Link to={`/admin/events/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">
                          {e.location} · {fmtDateRange(e.startDate, e.endDate)} · {fmtNum(e.registrations.length)} peserta · {fmtNum(e.checkpoints.length)} pos
                        </p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {recentScans.length > 0 && (
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Scan terakhir Anda</h2>
                <Link to="/admin/riwayat" className="text-xs font-medium text-brand hover:underline">Lihat riwayat</Link>
              </div>
              <ul className="divide-y divide-gray-100 text-sm">
                {recentScans.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{s.registration.user.name}</p>
                      <p className="truncate text-xs text-gray-500">{s.checkpoint.name} · {s.checkpoint.event.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">{fmtDateTime(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </DataGate>
  );
}

