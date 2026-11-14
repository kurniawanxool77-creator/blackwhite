import type { Event } from "@prisma/client";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EVENT_STATUS, fmtDate, fmtDateTime, fmtNum, fmtRupiah } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

type DashboardPayload = {
  openEvents: number;
  pending: number;
  approved: number;
  scansToday: number;
  upcoming: (Event & { _count: { registrations: number } })[];
  pendingByEvent: { eventId: string; count: number }[];
  latestPending: { id: string; createdAt: Date; user: { id: string; name: string }; event: { id: string; name: string } }[];
  finance: {
    totals: {
      registrationIncome: number;
      otherIncome: number;
      expense: number;
      balance: number;
    };
  };
  certificates: number;
};

export function SuperadminDashboardPage() {
  const state = useApiData<DashboardPayload>("/api/superadmin/dashboard");

  return (
    <DataGate state={state}>
      {({ openEvents, pending, approved, scansToday, upcoming, pendingByEvent, latestPending, finance, certificates }) => {
        const pendingMap = new Map(pendingByEvent.map((p) => [p.eventId, p.count]));
        const pendingOf = (id: string) => pendingMap.get(id) ?? 0;
        const totalIncome = finance.totals.registrationIncome + finance.totals.otherIncome;

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
                <Link key={s.label} to={s.href} className="card p-5 hover:border-brand">
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className={`mt-1 text-3xl font-semibold ${s.warn ? "text-amber-700" : "text-gray-900"}`}>{fmtNum(s.value)}</p>
                </Link>
              ))}
            </div>

            <Link to="/superadmin/keuangan" className="card grid grid-cols-2 gap-4 p-5 hover:border-brand sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-600">Total pemasukan</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{fmtRupiah(totalIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Pengeluaran</p>
                <p className="mt-1 text-lg font-semibold text-red-700 tabular-nums">{fmtRupiah(finance.totals.expense)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Saldo</p>
                <p className={`mt-1 text-lg font-semibold tabular-nums ${finance.totals.balance < 0 ? "text-red-700" : "text-gray-900"}`}>
                  {fmtRupiah(finance.totals.balance)}
                </p>
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
                  <Link to="/superadmin/events" className="text-sm text-brand hover:underline">Semua event</Link>
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
                        <tr><td colSpan={4} className="text-center text-gray-500">Belum ada event yang dibuka.</td></tr>
                      )}
                      {upcoming.map((e) => (
                        <tr key={e.id}>
                          <td>
                            <Link to={`/superadmin/events/${e.id}`} className="font-medium text-brand hover:underline">{e.name}</Link>
                            <div className="mt-1"><StatusBadge status={e.status} label={EVENT_STATUS[e.status] ?? e.status} /></div>
                          </td>
                          <td className="whitespace-nowrap">{fmtDate(e.startDate)}</td>
                          <td className="text-right whitespace-nowrap">
                            {fmtNum(e._count.registrations)}
                            {e.quota ? <span className="text-gray-500"> / {fmtNum(e.quota)}</span> : null}
                          </td>
                          <td className={`text-right ${pendingOf(e.id) ? "font-semibold text-amber-700" : ""}`}>
                            {fmtNum(pendingOf(e.id))}
                          </td>
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
                      <Link to={`/superadmin/events/${r.event.id}?status=pending`} className="btn btn-secondary btn-sm shrink-0">
                        Tinjau
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}
