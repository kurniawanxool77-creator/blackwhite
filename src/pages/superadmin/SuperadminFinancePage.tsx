import type { Event, Transaction } from "@prisma/client";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { TransactionForm } from "@/components/admin/TransactionForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtDate, fmtDateTime, fmtNum, fmtRupiah, REG_STATUS } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { deleteTransaction } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";

type FinanceRow = {
  event: Event;
  participants: number;
  registrationIncome: number;
  otherIncome: number;
  expense: number;
  balance: number;
};

type RegistrationPaymentRow = {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  userImage: string | null;
  code: string | null;
  status: string;
  createdAt: string;
  amount: number;
  paymentMethod?: string;
  paymentProof?: string;
  paymentProofUrl?: string;
};

type FinancePayload = {
  rows: FinanceRow[];
  transactions: (Transaction & { event: { name: string } | null })[];
  registrationPayments?: RegistrationPaymentRow[];
  totals: {
    registrationIncome: number;
    otherIncome: number;
    expense: number;
    balance: number;
  };
  events: { id: string; name: string }[];
  eventId: string;
  today: string;
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: "in" | "out" | "total" }) {
  const color = tone === "out" ? "text-red-700" : tone === "total" ? (value < 0 ? "text-red-700" : "text-gray-900") : "text-gray-900";
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{fmtRupiah(value)}</p>
    </div>
  );
}

export function SuperadminFinancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qEvent = searchParams.get("event") || "";
  const apiUrl = qEvent ? `/api/superadmin/keuangan?event=${encodeURIComponent(qEvent)}` : "/api/superadmin/keuangan";
  const state = useApiData<FinancePayload>(apiUrl);

  return (
    <DataGate state={state}>
      {({ rows, transactions, totals, events, eventId, today, registrationPayments = [] }) => {
        const current = events.find((e) => e.id === eventId);

        function onSelectEvent(e: React.SubmitEvent<HTMLFormElement>) {
          e.preventDefault();
          const picked = new FormData(e.currentTarget).get("event");
          const val = typeof picked === "string" ? picked.trim() : "";
          navigate(val ? `/superadmin/keuangan?event=${encodeURIComponent(val)}` : "/superadmin/keuangan");
        }

        return (
          <div className="space-y-6">
            <PageHeader
              title="Keuangan"
              description="Pemasukan pendaftaran dihitung otomatis dari peserta yang disetujui. Pemasukan lain dan pengeluaran dicatat manual."
            >
              <Drawer label="+ Catat transaksi" title="Catat transaksi">
                <TransactionForm events={events} defaultEventId={eventId} today={today} />
              </Drawer>
            </PageHeader>

            <div>
              <form method="get" onSubmit={onSelectEvent} className="flex flex-wrap gap-2">
                <select name="event" defaultValue={eventId} className="input w-auto" aria-label="Pilih event" key={eventId}>
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
                          <td>
                            <Link to={`/superadmin/keuangan?event=${r.event.id}`} className="font-medium text-brand hover:underline">
                              {r.event.name}
                            </Link>
                          </td>
                          <td className="text-right tabular-nums">{fmtNum(r.participants)}</td>
                          <td className="text-right whitespace-nowrap tabular-nums">{fmtRupiah(r.registrationIncome)}</td>
                          <td className="text-right whitespace-nowrap tabular-nums">{fmtRupiah(r.otherIncome)}</td>
                          <td className="text-right whitespace-nowrap tabular-nums text-red-700">{fmtRupiah(r.expense)}</td>
                          <td className={`text-right font-semibold whitespace-nowrap tabular-nums ${r.balance < 0 ? "text-red-700" : "text-gray-900"}`}>
                            {fmtRupiah(r.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Rincian Pembayaran Pendaftaran Peserta */}
              <section className="card overflow-x-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Pembayaran Pendaftaran{current && <span className="font-normal text-gray-500"> · {current.name}</span>}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Rincian transaksi pembayaran pendaftaran peserta dari formulir registrasi online.
                    </p>
                  </div>
                  {registrationPayments.length > 0 && (
                    <span className="rounded border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-800">
                      {fmtNum(registrationPayments.length)} pembayaran
                    </span>
                  )}
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Peserta</th>
                      {!current && <th>Event</th>}
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Bukti Bayar</th>
                      <th className="text-right">Nominal</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrationPayments.length === 0 ? (
                      <tr>
                        <td colSpan={!current ? 7 : 6} className="text-center text-gray-500 py-6">
                          {current
                            ? "Belum ada transaksi pembayaran pendaftaran pada event ini."
                            : "Belum ada transaksi pembayaran pendaftaran."}
                        </td>
                      </tr>
                    ) : (
                      registrationPayments.map((p) => {
                        const hasProof = !!(p.paymentProof || p.paymentProofUrl);
                        return (
                          <tr key={p.id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <UserAvatar name={p.userName} image={p.userImage} size={36} />
                                <div className="min-w-0">
                                  <Link
                                    to={`/superadmin/events/${p.eventId}/peserta/${p.id}`}
                                    className="font-semibold text-brand hover:underline"
                                  >
                                    {p.userName}
                                  </Link>
                                  {p.code && <span className="ml-1.5 font-mono text-xs text-gray-700">({p.code})</span>}
                                  <p className="text-xs text-gray-500">{p.userEmail}</p>
                                  {p.userPhone && <p className="text-xs text-gray-400">{p.userPhone}</p>}
                                </div>
                              </div>
                            </td>
                            {!current && (
                              <td>
                                <Link
                                  to={`/superadmin/keuangan?event=${p.eventId}`}
                                  className="font-medium text-gray-900 hover:text-brand"
                                >
                                  {p.eventName}
                                </Link>
                              </td>
                            )}
                            <td className="whitespace-nowrap font-mono text-xs text-gray-600">
                              {fmtDateTime(p.createdAt)}
                            </td>
                            <td>
                              <StatusBadge status={p.status} label={REG_STATUS[p.status] ?? p.status} />
                              {p.paymentMethod && (
                                <p className="mt-0.5 text-[11px] text-gray-500">{p.paymentMethod}</p>
                              )}
                            </td>
                            <td>
                              {hasProof ? (
                                <div className="flex flex-col gap-1">
                                  {p.paymentProofUrl && (
                                    <a
                                      href={p.paymentProofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-block shrink-0"
                                    >
                                      <img
                                        src={p.paymentProofUrl}
                                        alt="Bukti transfer"
                                        className="h-12 w-12 rounded border border-gray-200 object-cover hover:opacity-80 transition"
                                        title="Klik untuk perbesar"
                                      />
                                    </a>
                                  )}
                                  {p.paymentProof && (
                                    <p className="text-xs text-gray-700 font-mono leading-tight max-w-[8rem] break-all">
                                      {p.paymentProof}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <span className="font-semibold text-gray-900 tabular-nums">
                                {fmtRupiah(p.amount)}
                              </span>
                              <p className="text-[10px] text-gray-500">
                                {p.status === "approved" ? "Masuk saldo" : "Menunggu persetujuan"}
                              </p>
                            </td>
                            <td className="text-right whitespace-nowrap">
                              <Link
                                to={`/superadmin/events/${p.eventId}/peserta/${p.id}`}
                                className="btn btn-secondary btn-sm"
                              >
                                Detail
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </section>

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
                        <td className={`text-right font-semibold whitespace-nowrap tabular-nums ${t.type === "out" ? "text-red-700" : "text-gray-900"}`}>
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
                              <ConfirmSubmit message={`Hapus transaksi "${t.label}"?`} className="btn btn-danger btn-sm">
                                Hapus
                              </ConfirmSubmit>
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
        );
      }}
    </DataGate>
  );
}
