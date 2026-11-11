import type { Transaction } from "@prisma/client";
import { Link, useSearchParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { fmtDate, fmtNum, fmtRupiah } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { deleteTransaction } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";

type FinancePayload = {
  income: number;
  expense: number;
  balance: number;
  regTotal: number;
  regByEvent: { eventId: string; eventName: string; count: number; total: number }[];
  transactions: (Transaction & { event: { name: string } | null })[];
  events: { id: string; name: string }[];
  eventId: string;
  today: string;
};

export function SuperadminFinancePage() {
  const [searchParams] = useSearchParams();
  const qEvent = searchParams.get("event") || "";
  const apiUrl = qEvent ? `/api/superadmin/keuangan?event=${encodeURIComponent(qEvent)}` : "/api/superadmin/keuangan";
  const state = useApiData<FinancePayload>(apiUrl);

  return (
    <DataGate state={state}>
      {({ income, expense, balance, regTotal, regByEvent, transactions, events, eventId, today }) => (
        <div className="space-y-6">
          <PageHeader title="Keuangan" description="Rekap pembayaran pendaftaran peserta serta pemasukan dan pengeluaran operasional.">
            <Drawer label="+ Catat transaksi" title="Catat pemasukan atau pengeluaran">
              <TransactionForm events={events} defaultEventId={eventId} today={today} />
            </Drawer>
          </PageHeader>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link to="/superadmin/keuangan" className={`rounded px-3 py-1.5 font-medium ${!eventId ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}>
              Semua event
            </Link>
            {events.map((ev) => (
              <Link
                key={ev.id}
                to={`/superadmin/keuangan?event=${encodeURIComponent(ev.id)}`}
                className={`rounded px-3 py-1.5 font-medium ${eventId === ev.id ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-700"}`}
              >
                {ev.name}
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500">Pemasukan pendaftaran</p>
              <p className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{fmtRupiah(regTotal)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Total pemasukan</p>
              <p className="mt-1 text-xl font-bold text-green-700 tabular-nums">{fmtRupiah(income)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Total pengeluaran</p>
              <p className="mt-1 text-xl font-bold text-red-700 tabular-nums">{fmtRupiah(expense)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500">Saldo bersih</p>
              <p className="mt-1 text-xl font-bold text-gray-900 tabular-nums">{fmtRupiah(balance)}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="card overflow-hidden lg:col-span-2">
              <h2 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">Pemasukan per event</h2>
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th className="text-right">Peserta</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {regByEvent.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-gray-500">Belum ada pembayaran peserta.</td></tr>
                  )}
                  {regByEvent.map((row) => (
                    <tr key={row.eventId}>
                      <td className="font-medium text-gray-900">{row.eventName}</td>
                      <td className="text-right tabular-nums">{fmtNum(row.count)}</td>
                      <td className="text-right font-semibold tabular-nums">{fmtRupiah(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="card overflow-hidden lg:col-span-3">
              <h2 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">Buku kas & transaksi</h2>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th className="text-right">Nominal</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-gray-500">Belum ada transaksi.</td></tr>
                    )}
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap">{fmtDate(t.date)}</td>
                        <td>
                          <p className="font-medium text-gray-900">{t.label}</p>
                          <p className="text-xs text-gray-500">{[t.event?.name ?? "Umum", t.note, `oleh ${t.adminName}`].filter(Boolean).join(" · ")}</p>
                        </td>
                        <td className={`text-right font-semibold tabular-nums whitespace-nowrap ${t.type === "out" ? "text-red-700" : "text-green-700"}`}>
                          {t.type === "out" ? "−" : "+"}{fmtRupiah(t.amount)}
                        </td>
                        <td>
                          <div className="flex justify-end gap-1.5">
                            <Drawer label="Ubah" title="Ubah transaksi" variant="secondary">
                              <TransactionForm
                                events={events}
                                today={today}
                                tx={{
                                  id: t.id,
                                  type: t.type,
                                  amount: t.amount,
                                  label: t.label,
                                  note: t.note,
                                  date: new Date(t.date).toISOString().slice(0, 10),
                                  eventId: t.eventId,
                                }}
                              />
                            </Drawer>
                            <form action={async () => { await deleteTransaction(t.id); }}>
                              <ConfirmSubmit message={`Hapus transaksi "${t.label}"?`} className="btn btn-danger btn-sm">Hapus</ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}
    </DataGate>
  );
}

