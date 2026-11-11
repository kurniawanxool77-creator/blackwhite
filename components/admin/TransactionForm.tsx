"use client";

import { useActionState, useRef, useState } from "react";
import { createTransaction, updateTransaction } from "@/app/superadmin/(panel)/keuangan/actions";
import { useDrawer } from "./Drawer";

export type TransactionValues = { id: string; type: string; amount: number; label: string; note: string; date: string; eventId: string | null };

const fmt = (n: number) => (n ? n.toLocaleString("id-ID") : "");

// Catat / ubah pemasukan lain (sponsor, dll.) atau pengeluaran (venue, konsumsi, honor, dll.). Nominal berformat ribuan.
export function TransactionForm({ events, defaultEventId, today, tx }: { events: { id: string; name: string }[]; defaultEventId?: string; today: string; tx?: TransactionValues }) {
  const drawer = useDrawer();
  const form = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState(fmt(tx?.amount ?? 0));
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = tx ? await updateTransaction(tx.id, prev, f) : await createTransaction(prev, f);
    if (!result) {
      form.current?.reset();
      setAmount("");
      drawer?.close();
    }
    return result;
  }, null);

  return (
    <form ref={form} action={action} className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {([["out", "Pengeluaran"], ["in", "Pemasukan"]] as const).map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-200 py-2 text-sm font-medium has-checked:border-brand has-checked:bg-green-50/60">
            <input type="radio" name="type" value={v} defaultChecked={v === (tx?.type ?? "out")} className="accent-brand" />
            {l}
          </label>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="t-label">Keterangan</label>
        <input id="t-label" name="label" className="input" defaultValue={tx?.label} placeholder="contoh: Sewa ruang, konsumsi, sponsor" required maxLength={120} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="t-amount">Nominal (Rp)</label>
          <input
            id="t-amount"
            name="amount"
            className="input"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setAmount(raw ? Number(raw).toLocaleString("id-ID") : "");
            }}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="t-date">Tanggal</label>
          <input id="t-date" name="date" type="date" className="input" defaultValue={tx?.date ?? today} required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="t-event">Event</label>
        <select id="t-event" name="eventId" className="input" defaultValue={tx ? (tx.eventId ?? "") : (defaultEventId ?? "")}>
          <option value="">Umum (tanpa event)</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="t-note">Catatan (opsional)</label>
        <input id="t-note" name="note" className="input" defaultValue={tx?.note} maxLength={300} placeholder="contoh: No. nota 0012" />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menyimpan..." : tx ? "Simpan perubahan" : "Simpan transaksi"}</button>
    </form>
  );
}
