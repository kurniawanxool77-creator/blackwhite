import Link from "next/link";
import { AutoRefresh } from "@/components/ui/AutoRefresh";
import { MapPinIcon, QrCodeIcon } from "@/components/ui/icons";
import { AppMenu } from "@/components/admin/AppMenu";
import { AttendancePanel } from "@/components/admin/AttendancePanel";
import { requireAdmin } from "@/lib/auth";
import { greetingJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("scanner");

  // Ambil event yang ditugaskan superadmin kepada panitia ini
  const events = await db.event.findMany({
    where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
    include: {
      checkpoints: { where: { scan: true }, orderBy: { order: "asc" }, include: { _count: { select: { scans: true } } } },
      registrations: {
        where: { status: "approved" },
        include: { user: true, _count: { select: { scans: true } } },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // Scan terakhir yang dilakukan panitia
  const recentScans = await db.scan.findMany({
    where: { adminId: admin.id },
    include: {
      registration: { include: { user: true } },
      checkpoint: { select: { name: true, event: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalEvents = events.length;
  const totalApproved = events.reduce((acc, ev) => acc + ev.registrations.length, 0);
  const checkedInCount = events.reduce(
    (acc, ev) => acc + ev.registrations.filter((r) => r._count.scans > 0).length,
    0
  );
  const totalScansByAdmin = await db.scan.count({ where: { adminId: admin.id } });

  return (
    <div className="space-y-6">
      {/* 1. Header Selamat Datang & Status Tugas */}
      <div className="card p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              Halo {admin.name.split(" ")[0]}, {greetingJakarta()}
            </h1>
            <p className="mt-0.5 text-sm text-gray-600">
              {admin.position ? `${admin.position} · ` : ""}Absen datang dulu sebelum memulai kegiatan di pelatihan Anda.
            </p>
          </div>
          <Link href="/admin/events" className="btn btn-primary flex items-center justify-center gap-2">
            <QrCodeIcon className="h-4 w-4" />
            <span>Event saya</span>
          </Link>
        </div>
      </div>

      {/* Absensi hari ini (absen masuk / pulang) */}
      <AttendancePanel adminId={admin.id} />

      {/* 2. Kartu Statistik Realtime */}
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

        <div className="card p-4 border-emerald-200 bg-emerald-50/30">
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

      {/* 3. Menu ala aplikasi */}
      <AppMenu />

      {/* 4. Event Aktif & Deteksi Kehadiran Realtime */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Daftar Event Ditugaskan */}
        <section className="card p-5 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Event Yang Ditugaskan</h2>
              <p className="text-[11px] text-gray-500">Ditugaskan oleh Superadmin untuk Anda tangani</p>
            </div>
            <Link href="/admin/events" className="text-xs font-medium text-brand hover:underline">
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
                  <div key={ev.id} className="rounded-md border border-gray-200 bg-gray-50/50 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link href={`/admin/events/${ev.id}`} className="font-semibold text-brand text-xs sm:text-sm hover:underline">
                          {ev.name}
                        </Link>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                          <span>{ev.location} · {fmtDate(ev.startDate)}</span>
                        </p>
                      </div>
                      <Link
                        href={`/admin/events/${ev.id}`}
                        className="btn btn-secondary btn-sm text-[11px] py-1"
                      >
                        Detail Event
                      </Link>
                    </div>

                    {/* Progress Bar Kedeteksi Hadir */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-600">
                          Kehadiran Peserta: <strong>{checkedIn}</strong> dari {total} hadir
                        </span>
                        <span className="font-semibold text-brand">{percent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
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

        {/* Kolom Kanan: Live Feed Pemindaian Terkini */}
        <section className="card p-5 lg:col-span-5 space-y-3">
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
                <li key={s.id} className="py-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.registration.user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{s.checkpoint.name}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                    {fmtDateTime(s.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-gray-100">
            <Link href="/admin/riwayat" className="btn btn-secondary w-full text-xs text-center block">
              Lihat Semua Riwayat Scan
            </Link>
          </div>
        </section>
      </div>

      <AutoRefresh seconds={30} />
    </div>
  );
}
