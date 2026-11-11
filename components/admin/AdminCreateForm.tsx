"use client";

import { useActionState } from "react";
import { createAdmin } from "@/src/lib/actions/superadmin";
import { useDrawer } from "./Drawer";
import { TeamFields } from "./TeamFields";

export function AdminCreateForm({ events }: { events: { id: string; name: string }[] }) {
  const drawer = useDrawer();
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await createAdmin(prev, f);
    if (!result) drawer?.close(); // berhasil: tutup panel Tambah
    return result;
  }, null);

  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label className="label" htmlFor="name">Nama</label>
        <input id="name" name="name" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password (min. 8 karakter)</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <label className="label" htmlFor="role">Peran</label>
        <select id="role" name="role" className="input">
          <option value="scanner">Admin / panitia</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>
      <TeamFields idPrefix="new" />
      {events.length > 0 && (
        <fieldset>
          <legend className="label">Tugaskan ke event</legend>
          <div className="space-y-1">
            {events.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="events" value={e.id} className="accent-brand" />
                {e.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Tambah anggota tim"}
      </button>
    </form>
  );
}
