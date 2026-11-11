import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { startOfTodayJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { EVENT_STATUS, fmtDate, fmtDateTime, fmtNum, fmtRupiah } from "@/lib/format";
import { financeSummary } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireAdmin("superadmin");
  const today = startOfTodayJakarta();
  const [openEvents, pending, approved, scansToday, upcoming, pendingByEvent, latestPending, finance, certificates] = await Promise.all([
    db.event.count({ where: { status: "open" } }),
    db.registration.count({ where: { status: "pending" } }),
    db.registration.count({ where: { status: "approved" } }),
    db.scan.count({ where: { createdAt: { gte: today } } }),
    db.event.findMany({
      where: { status: { in: ["open", "closed"] }, endDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 6,
      include: { _count: { select: { registrations: { where: { status: "approved" } } } } },
    }),
    db.registration.groupBy({ by: ["eventId"], where: { status: "pending" }, _count: true }),
    db.registration.findMany({
      where: { status: "pending" },
      include: { user: true, event: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    financeSummary(),
    db.registration.count({ where: { certificateNo: { not: null } } }),
  ]);
  const pendingOf = (eventId: string) => pendingByEvent.find((p) => p.eventId === eventId)?._count ?? 0;

  const stats = [
    { label: "Event dibuka", value: openEvents, href: "/superadmin/events" },
    { label: "Menunggu persetujuan", value: pending, href: "#menunggu", warn: pending > 0 },
    { label: "Peserta disetujui", value: approved, href: "/superadmin/peserta" },
    { label: "Check-in hari ini", value: scansToday, href: "/superadmin/events" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Dasbor</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-brand">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className={`mt-1 text-3xl font-semibold ${s.warn ? "text-amber-700" : "text-gray-900"}`}>{fmtNum(s.value)}</p>
          </Link>
        ))}
      </div>

      {/* Ringkasan keuangan & sertifikat */}
      <Link href="/superadmin/keuangan" className="card grid grid-cols-2 gap-4 p-5 hover:border-brand sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-600">Total pemasukan</p>
          <p className="mt-1 text-lg font-semibold text-green-700 tabular-nums">{fmtRupiah(finance.totals.registrationIncome + finance.totals.otherIncome)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Pengeluaran</p>
          <p className="mt-1 text-lg font-semibold text-red-700 tabular-nums">{fmtRupiah(finance.totals.expense)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Saldo</p>
          <p className={`mt-1 text-lg font-semibold tabular-nums ${finance.totals.balance < 0 ? "text-red-700" : "text-gray-900"}`}>{fmtRupiah(finance.totals.balance)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Sertifikat terbit</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{fmtNum(certificates)}</p>
        </div>
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Event mendatang</h2>
            <Link href="/superadmin/events" className="text-sm text-brand hover:underline">Semua event</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Mulai</th>
                  <th className="text-right">Disetujui</th>
                  <th className="text-right">Menunggu</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500">Belum ada event yang dibuka.</td>
                  </tr>
                )}
                {upcoming.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/superadmin/events/${e.id}`} className="font-medium text-brand hover:underline">{e.name}</Link>
                      <div className="mt-1"><StatusBadge status={e.status} label={EVENT_STATUS[e.status]} /></div>
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(e.startDate)}</td>
                    <td className="text-right whitespace-nowrap">
                      {fmtNum(e._count.registrations)}
                      {e.quota ? <span className="text-gray-500"> / {fmtNum(e.quota)}</span> : null}
                    </td>
                    <td className={`text-right ${pendingOf(e.id) ? "font-semibold text-amber-700" : ""}`}>{fmtNum(pendingOf(e.id))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="menunggu" className="card lg:col-span-2">
          <h2 className="border-b border-gray-200 px-5 py-3 font-semibold text-gray-900">Menunggu persetujuan</h2>
          <ul className="divide-y divide-gray-100">
            {latestPending.length === 0 && <li className="px-5 py-4 text-sm text-gray-500">Tidak ada pendaftaran yang menunggu.</li>}
            {latestPending.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{r.user.name}</p>
                  <p className="truncate text-xs text-gray-500">{r.event.name} · {fmtDateTime(r.createdAt)}</p>
                </div>
                <Link href={`/superadmin/events/${r.event.id}?status=pending`} className="btn btn-secondary btn-sm shrink-0">Tinjau</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
