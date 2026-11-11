"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/src/lib/actions/admin";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, null);

  return (
    <form action={action} key={state?.ok ? state.message : "form"} className="space-y-4">
      <div>
        <label className="label" htmlFor="current">Password lama</label>
        <input id="current" name="current" type="password" autoComplete="current-password" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="next">Password baru (min. 8 karakter)</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Ulangi password baru</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </div>
      {state && <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Menyimpan..." : "Ganti password"}</button>
    </form>
  );
}
