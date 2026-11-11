import { db } from "./db";
import { finalPrice } from "./format";
import { readDetails } from "./registration-form";

// Keuangan: pemasukan pendaftaran dihitung otomatis dari peserta disetujui (harga paket atau harga event),
// ditambah pemasukan lain dan pengeluaran yang dicatat manual (Transaction).
export async function financeSummary(eventId?: string) {
  const where = eventId ? { id: eventId } : {};
  const [events, transactions] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { registrations: { where: { status: "approved" }, select: { details: true } } },
    }),
    db.transaction.findMany({ where: eventId ? { eventId } : {}, orderBy: [{ date: "desc" }, { createdAt: "desc" }], include: { event: { select: { name: true } } } }),
  ]);

  const rows = events.map((e) => {
    const registrationIncome = e.registrations.reduce((sum, r) => sum + (readDetails(r.details).total ?? finalPrice(e)), 0);
    const own = transactions.filter((t) => t.eventId === e.id);
    const otherIncome = own.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const expense = own.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
    return { event: e, participants: e.registrations.length, registrationIncome, otherIncome, expense, balance: registrationIncome + otherIncome - expense };
  });

  // Transaksi umum (tanpa event) hanya dihitung di ringkasan keseluruhan.
  const general = eventId ? [] : transactions.filter((t) => !t.eventId);
  const sum = (k: "registrationIncome" | "otherIncome" | "expense") => rows.reduce((s, r) => s + r[k], 0);
  const totals = {
    registrationIncome: sum("registrationIncome"),
    otherIncome: sum("otherIncome") + general.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0),
    expense: sum("expense") + general.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0),
  };
  return { rows, transactions, totals: { ...totals, balance: totals.registrationIncome + totals.otherIncome - totals.expense } };
}
