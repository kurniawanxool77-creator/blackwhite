"use client";

import { useActionState } from "react";
import { importParticipants } from "@/src/lib/actions/events";

export function ParticipantImport({ eventId }: { eventId: string }) {
  const [message, action, pending] = useActionState(importParticipants.bind(null, eventId), null);

  return (
    <section className="card">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-900">Tambah peserta</h2>
        <p className="text-xs text-gray-500">
          Satu orang per baris: <span className="font-mono">Nama, email, No. HP, Instansi</span>. Bisa ditempel dari Excel.
          Peserta bisa melihat QR-nya dengan login Google memakai email yang sama.
        </p>
      </div>
      <form action={action} className="space-y-3 p-4">
        <textarea
          name="rows"
          rows={4}
          required
          className="input font-mono"
          placeholder={"Andi Pratama, andi@contoh.co.id, 0812 3456 7890, PT Contoh Abadi\nSiti Rahma, siti@contoh.co.id"}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="approve" defaultChecked className="accent-brand" />
            Langsung setujui dan terbitkan QR (mengikuti kuota)
          </label>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Tambahkan"}</button>
        </div>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
    </section>
  );
}
