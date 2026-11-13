import type { Checkpoint, Event, Registration, Scan, User } from "@prisma/client";
import { Link } from "react-router-dom";
import { AppMenu } from "@/components/admin/AppMenu";
import { AttendancePanel, type AttendanceTodayProps } from "@/components/admin/AttendancePanel";
import { MapPinIcon, QrCodeIcon } from "@/components/ui/icons";
import { fmtDate, fmtDateTime, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

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
  const { user: admin } = useAuth();
  const state = useApiData<AdminDashboardPayload>("/api/admin/dashboard");

  return (
    <DataGate state={state}>
      {({ greeting, events, recentScans, totalScansByAdmin, attendanceToday }) => {
        const firstName = (admin?.name ?? "").split(" ")[0] || "Panitia";
        const totalEvents = events.length;
        const totalApproved = events.reduce((acc, ev) => acc + ev.registrations.length, 0);
        const checkedInCount = events.reduce(
          (acc, ev) => acc + ev.registrations.filter((r) => r._count.scans > 0).length,
          0,
        );

        return (
          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    Halo {firstName}, {greeting}
                  </h1>
                  <p className="mt-0.5 text-sm text-gray-600">
                    Absen datang dulu sebelum memulai kegiatan di event Anda.
                  </p>
                </div>
                <Link to="/admin/events" className="btn btn-primary flex items-center justify-center gap-2">
                  <QrCodeIcon className="h-4 w-4" />
                  <span>Event saya</span>
                </Link>
              </div>
            </div>

            <AttendancePanel date={attendanceToday.date} items={attendanceToday.items} />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="card p-4">
                <span className="text-[11px] font-medium text-gray-500">Event Ditugaskan</span>
                <p className="mt-1 text-2xl font-bold text-gray-900">{fmtNum(totalEvents)}</p>
                <span className="text-[10px] text-gray-400">Oleh Superadmin</span>
              </div>

              <div className="card p-4">
                <span className="text-[11px] font-medium text-gray-500">Total Peserta Disetujui</span>
                <p className="mt-1 text-2xl font-bold text-gray-900">{fmtNum(totalApproved)}</p>
                <span className="text-[10px] text-gray-400">Siap verifikasi</span>
              </div>

              <div className="card border-emerald-200 bg-emerald-50/30 p-4">
                <span className="text-[11px] font-medium text-emerald-800">Peserta Sudah Hadir (Kedeteksi)</span>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{fmtNum(checkedInCount)}</p>
                <span className="text-[10px] text-emerald-600">
                  {totalApproved > 0 ? `${Math.round((checkedInCount / totalApproved) * 100)}% dari total peserta` : "0%"}
                </span>
              </div>

              <div className="card p-4">
                <span className="text-[11px] font-medium text-gray-500">Scan Oleh Anda</span>
                <p className="mt-1 text-2xl font-bold text-brand">{fmtNum(totalScansByAdmin)}</p>
                <span className="text-[10px] text-gray-400">Riwayat scan aktif</span>
              </div>
            </div>

            <AppMenu />

            <div className="grid gap-6 lg:grid-cols-12">
              <section className="card space-y-4 p-5 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Event Yang Ditugaskan</h2>
                    <p className="text-[11px] text-gray-500">Ditugaskan oleh Superadmin untuk Anda tangani</p>
                  </div>
                  <Link to="/admin/events" className="text-xs font-medium text-brand hover:underline">
                    Semua event →
                  </Link>
                </div>

                {events.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-500">
                    Belum ada event yang ditugaskan kepada Anda. Silakan hubungi Superadmin.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const checkedIn = ev.registrations.filter((r) => r._count.scans > 0).length;
                      const total = ev.registrations.length;
                      const percent = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

                      return (
                        <div key={ev.id} className="space-y-2 rounded-md border border-gray-200 bg-gray-50/50 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <Link to={`/admin/events/${ev.id}`} className="text-xs font-semibold text-brand hover:underline sm:text-sm">
                                {ev.name}
                              </Link>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                                <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                                <span>{ev.location} · {fmtDate(ev.startDate)}</span>
                              </p>
                            </div>
                            <Link to={`/admin/events/${ev.id}`} className="btn btn-secondary btn-sm py-1 text-[11px]">
                              Detail Event
                            </Link>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-gray-600">
                                Kehadiran Peserta: <strong>{checkedIn}</strong> dari {total} hadir
                              </span>
                              <span className="font-semibold text-brand">{percent}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="card space-y-3 p-5 lg:col-span-5">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-sm font-bold text-gray-900">Pemindaian Terkini Oleh Anda</h2>
                  <p className="text-[11px] text-gray-500">Peserta yang baru saja Anda verifikasi</p>
                </div>

                {recentScans.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-500">
                    Belum ada riwayat scan. Mulai pindai barcode dari tombol scanner.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 text-xs">
                    {recentScans.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{s.registration.user.name}</p>
                          <p className="truncate text-[11px] text-gray-500">{s.checkpoint.name}</p>
                        </div>
                        <span className="mt-0.5 shrink-0 text-[10px] text-gray-400">{fmtDateTime(s.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-gray-100 pt-2">
                  <Link to="/admin/riwayat" className="btn btn-secondary block w-full text-center text-xs">
                    Lihat Semua Riwayat Scan
                  </Link>
                </div>
              </section>
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}
