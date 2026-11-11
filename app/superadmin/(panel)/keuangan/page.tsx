import Link from "next/link";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { requireAdmin } from "@/lib/auth";
import { todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { queryParam } from "@/lib/event-search";
import { financeSummary } from "@/lib/finance";
import { fmtDate, fmtNum, fmtRupiah } from "@/lib/format";
import { deleteTransaction } from "./actions";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "in" | "out" | "total" }) {
  const color = tone === "out" ? "text-red-700" : tone === "total" ? (value < 0 ? "text-red-700" : "text-gray-900") : "text-green-700";
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{fmtRupiah(value)}</p>
    </div>
  );
}

export default async function FinancePage({ searchParams }: PageProps<"/superadmin/keuangan">) {
  await requireAdmin("superadmin");
  const eventId = queryParam((await searchParams).event);
  const [{ rows, transactions, totals }, events] = await Promise.all([
    financeSummary(eventId),
    db.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
  ]);
  const current = events.find((e) => e.id === eventId);
  const today = todayKeyJakarta();

  return (
    <div className="space-y-6">
      <PageHeader title="Keuangan" description="Pemasukan pendaftaran dihitung otomatis dari peserta yang disetujui. Pemasukan lain dan pengeluaran dicatat manual.">
        <Drawer label="+ Catat transaksi" title="Catat transaksi">
          <TransactionForm events={events} defaultEventId={eventId} today={today} />
        </Drawer>
      </PageHeader>
      <div>
        <form method="get" className="flex flex-wrap gap-2">
          <select name="event" defaultValue={eventId ?? ""} className="input w-auto" aria-label="Pilih event">
            <option value="">Semua event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <button className="btn btn-secondary">Tampilkan</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pemasukan pendaftaran" value={totals.registrationIncome} tone="in" />
        <Stat label="Pemasukan lain" value={totals.otherIncome} tone="in" />
        <Stat label="Pengeluaran" value={totals.expense} tone="out" />
        <Stat label={current ? "Saldo event ini" : "Saldo"} value={totals.balance} tone="total" />
      </div>

      <div className="space-y-6">
        <div className="space-y-6">
          {!current && (
            <section className="card overflow-x-auto">
              <h2 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">Per event</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th className="text-right">Peserta</th>
                    <th className="text-right">Pendaftaran</th>
                    <th className="text-right">Lain</th>
                    <th className="text-right">Pengeluaran</th>
                    <th className="text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.event.id}>
                      <td><Link href={`/superadmin/keuangan?event=${r.event.id}`} className="font-medium text-brand hover:underline">{r.event.name}</Link></td>
                      <td className="text-right tabular-nums">{fmtNum(r.participants)}</td>
                      <td className="text-right tabular-nums whitespace-nowrap">{fmtRupiah(r.registrationIncome)}</td>
                      <td className="text-right tabular-nums whitespace-nowrap">{fmtRupiah(r.otherIncome)}</td>
                      <td className="text-right tabular-nums whitespace-nowrap text-red-700">{fmtRupiah(r.expense)}</td>
                      <td className={`text-right font-semibold tabular-nums whitespace-nowrap ${r.balance < 0 ? "text-red-700" : "text-gray-900"}`}>{fmtRupiah(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="card overflow-x-auto">
            <h2 className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
              Transaksi manual{current && <span className="font-normal text-gray-500"> · {current.name}</span>}
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th className="text-right">Nominal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500">Belum ada transaksi.</td></tr>}
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
                            tx={{ id: t.id, type: t.type, amount: t.amount, label: t.label, note: t.note, date: t.date.toISOString().slice(0, 10), eventId: t.eventId }}
                          />
                        </Drawer>
                        <form action={deleteTransaction.bind(null, t.id)}>
                          <ConfirmSubmit message={`Hapus transaksi "${t.label}"?`} className="btn btn-danger btn-sm">Hapus</ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
