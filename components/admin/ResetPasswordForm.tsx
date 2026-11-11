"use client";

import { useActionState } from "react";
import { resetAdminPassword } from "@/src/lib/actions/superadmin";

// Form kecil per baris admin: atur password baru untuk admin yang lupa password.
export function ResetPasswordForm({ adminId }: { adminId: string }) {
  const [state, action, pending] = useActionState(resetAdminPassword.bind(null, adminId), null);

  return (
    <form action={action} key={state?.ok ? "done" : "form"} className="mt-2">
      <div className="flex gap-1">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="Password baru"
          aria-label="Password baru"
          className="input w-36 py-1 text-xs"
          required
        />
        <button className="btn btn-secondary btn-sm" disabled={pending}>Reset</button>
      </div>
      {state && <p className={`mt-1 text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
