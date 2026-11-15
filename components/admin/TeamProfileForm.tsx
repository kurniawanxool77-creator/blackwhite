"use client";

import { useActionState } from "react";
import { showToast } from "@/components/ui/Toast";
import { updateTeamProfile } from "@/src/lib/actions/superadmin";
import { TeamFields } from "./TeamFields";

type Admin = { id: string; name: string; position: string; phone: string | null; duties: string };

// Superadmin: ubah nama dan data tim seorang anggota (jabatan, No. HP, tugas).
export function TeamProfileForm({ admin }: { admin: Admin }) {
  const [state, action, pending] = useActionState(async (prev: unknown, f: FormData) => {
    const res = await updateTeamProfile(admin.id, null, f);
    if (res?.ok) {
      showToast.success(res.message || "Data profil tim berhasil disimpan.");
    } else if (res?.message) {
      showToast.error(res.message);
    }
    return res;
  }, null);

  return (
    <form action={action} className="mt-3 space-y-3">
      <div>
        <label className="label" htmlFor={`n-${admin.id}`}>Nama</label>
        <input id={`n-${admin.id}`} name="name" defaultValue={admin.name} className="input" required />
      </div>
      <TeamFields values={admin} idPrefix={admin.id} />
      {state && <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
      <button className="btn btn-primary btn-sm inline-flex items-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : "Simpan data tim"}
      </button>
    </form>
  );
}
