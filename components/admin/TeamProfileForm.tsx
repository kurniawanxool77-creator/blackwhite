"use client";

import { useActionState } from "react";
import { updateTeamProfile } from "@/src/lib/actions/superadmin";
import { TeamFields } from "./TeamFields";

type Admin = { id: string; name: string; position: string; phone: string | null; duties: string };

// Superadmin: ubah nama dan data tim seorang anggota (jabatan, No. HP, tugas).
export function TeamProfileForm({ admin }: { admin: Admin }) {
  const [state, action, pending] = useActionState(updateTeamProfile.bind(null, admin.id), null);
  return (
    <form action={action} className="mt-3 space-y-3">
      <div>
        <label className="label" htmlFor={`n-${admin.id}`}>Nama</label>
        <input id={`n-${admin.id}`} name="name" defaultValue={admin.name} className="input" required />
      </div>
      <TeamFields values={admin} idPrefix={admin.id} />
      {state && <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
      <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Menyimpan..." : "Simpan data tim"}</button>
    </form>
  );
}
