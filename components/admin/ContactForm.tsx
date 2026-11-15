"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/form";
import { showToast } from "@/components/ui/Toast";
import { updateOwnContact } from "@/src/lib/actions/admin";

// Panitia/superadmin memperbarui No. HP sendiri; tampil di halaman Tim agar mudah dihubungi.
export function ContactForm({ phone }: { phone: string | null }) {
  const [state, action, pending] = useActionState(async (prev: FormState | null, f: FormData) => {
    const res = await updateOwnContact(prev, f);
    if (res?.ok) {
      showToast.success(res.message);
    } else if (res?.message) {
      showToast.error(res.message);
    }
    return res;
  }, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="own-phone">No. HP / WhatsApp</label>
        <input id="own-phone" name="phone" defaultValue={phone ?? ""} inputMode="tel" placeholder="0812 3456 7890" className="input" />
      </div>
      <button className="btn btn-primary inline-flex items-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
      {state && <p className={`w-full text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
