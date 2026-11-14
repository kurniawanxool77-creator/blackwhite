import { db } from "./db";
import { finalPrice } from "./format";
import { readDetails } from "./registration-form";

export type RegistrationPaymentItem = {
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
  createdAt: Date;
  amount: number;
  paymentMethod?: string;
  paymentProof?: string;
  paymentProofUrl?: string;
};

// Keuangan: pemasukan pendaftaran dihitung otomatis dari peserta disetujui (harga paket atau harga event),
// ditambah pemasukan lain dan pengeluaran yang dicatat manual (Transaction).
export async function financeSummary(eventId?: string) {
  const where = eventId ? { id: eventId } : {};
  const [events, transactions, registrations] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { registrations: { where: { status: "approved" }, select: { details: true } } },
    }),
    db.transaction.findMany({
      where: eventId ? { eventId } : {},
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { event: { select: { name: true } } },
    }),
    db.registration.findMany({
      where: eventId ? { eventId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
        event: { select: { id: true, name: true, price: true, discount: true } },
      },
    }),
  ]);

  const rows = events.map((e) => {
    const registrationIncome = e.registrations.reduce((sum, r) => sum + (readDetails(r.details).total ?? finalPrice(e)), 0);
    const own = transactions.filter((t) => t.eventId === e.id);
    const otherIncome = own.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
    const expense = own.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);
    return { event: e, participants: e.registrations.length, registrationIncome, otherIncome, expense, balance: registrationIncome + otherIncome - expense };
  });

  const registrationPayments: RegistrationPaymentItem[] = registrations
    .map((r) => {
      const d = readDetails(r.details);
      const amount = d.total ?? finalPrice(r.event);
      const payAnswer = d.answers.find(
        (a) =>
          a.id.toLowerCase().includes("bayar") ||
          a.label.toLowerCase().includes("pembayaran") ||
          a.label.toLowerCase().includes("metode"),
      );
      return {
        id: r.id,
        eventId: r.eventId,
        eventName: r.event.name,
        userId: r.user.id,
        userName: r.user.name,
        userEmail: r.user.email,
        userPhone: r.user.phone,
        userImage: r.user.image,
        code: r.code,
        status: r.status,
        createdAt: r.createdAt,
        amount,
        paymentMethod: payAnswer ? String(payAnswer.value) : undefined,
        paymentProof: d.paymentProof || undefined,
        paymentProofUrl: d.paymentProofUrl || undefined,
      };
    })
    .filter((item) => item.amount > 0 || item.paymentProof || item.paymentProofUrl);

  // Transaksi umum (tanpa event) hanya dihitung di ringkasan keseluruhan.
  const general = eventId ? [] : transactions.filter((t) => !t.eventId);
  const sum = (k: "registrationIncome" | "otherIncome" | "expense") => rows.reduce((s, r) => s + r[k], 0);
  const totals = {
    registrationIncome: sum("registrationIncome"),
    otherIncome: sum("otherIncome") + general.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0),
    expense: sum("expense") + general.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0),
  };
  return {
    rows,
    transactions,
    registrationPayments,
    totals: { ...totals, balance: totals.registrationIncome + totals.otherIncome - totals.expense },
  };
}
