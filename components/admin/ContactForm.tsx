"use client";

import { useActionState } from "react";
import { updateOwnContact } from "@/src/lib/actions/admin";

// Panitia/superadmin memperbarui No. HP sendiri; tampil di halaman Tim agar mudah dihubungi.
export function ContactForm({ phone }: { phone: string | null }) {
  const [state, action, pending] = useActionState(updateOwnContact, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="own-phone">No. HP / WhatsApp</label>
        <input id="own-phone" name="phone" defaultValue={phone ?? ""} inputMode="tel" placeholder="0812 3456 7890" className="input" />
      </div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
      {state && <p className={`w-full text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
