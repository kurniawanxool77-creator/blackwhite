"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { digits, str } from "@/lib/form";
import { fmtRupiah } from "@/lib/format";

// Data transaksi dari form (dipakai catat dan ubah). Mengembalikan pesan error atau data.
async function readTransaction(f: FormData) {
  const type = str(f, "type") === "out" ? "out" : "in";
  const amount = digits(f, "amount");
  const label = str(f, "label").slice(0, 120);
  const date = new Date(str(f, "date"));
  const eventId = str(f, "eventId") || null;
  if (!label) return "Keterangan wajib diisi.";
  if (amount <= 0 || amount > 100_000_000_000) return "Nominal tidak valid.";
  if (isNaN(+date)) return "Tanggal tidak valid.";
  if (eventId && !(await db.event.findUnique({ where: { id: eventId }, select: { id: true } }))) return "Event tidak ditemukan.";
  return { type, amount, label, note: str(f, "note").slice(0, 300), date, eventId };
}

export async function createTransaction(_prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = await readTransaction(f);
  if (typeof data === "string") return data;
  await db.transaction.create({ data: { ...data, adminName: admin.name } });
  await audit(admin, data.type === "in" ? "Catat pemasukan" : "Catat pengeluaran", `${data.label} · ${fmtRupiah(data.amount)}`);
  revalidatePath("/superadmin/keuangan");
  return null;
}

export async function updateTransaction(id: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = await readTransaction(f);
  if (typeof data === "string") return data;
  const before = await db.transaction.findUnique({ where: { id } });
  if (!before) return "Transaksi tidak ditemukan.";
  await db.transaction.update({ where: { id }, data });
  await audit(admin, "Ubah transaksi", `${before.label} ${fmtRupiah(before.amount)} → ${data.label} ${fmtRupiah(data.amount)}`);
  revalidatePath("/superadmin/keuangan");
  return null;
}

export async function deleteTransaction(id: string) {
  const admin = await requireAdmin("superadmin");
  const t = await db.transaction.delete({ where: { id } });
  await audit(admin, "Hapus transaksi", `${t.label} · ${fmtRupiah(t.amount)}`);
  revalidatePath("/superadmin/keuangan");
}
