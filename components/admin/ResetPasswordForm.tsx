"use client";

import { useActionState } from "react";
import { showToast } from "@/components/ui/Toast";
import { resetAdminPassword } from "@/src/lib/actions/superadmin";

// Form kecil per baris admin: atur password baru untuk admin yang lupa password.
export function ResetPasswordForm({ adminId }: { adminId: string }) {
  const [state, action, pending] = useActionState(async (prev: unknown, f: FormData) => {
    const res = await resetAdminPassword(adminId, null, f);
    if (res?.ok) {
      showToast.success(res.message || "Password berhasil direset.");
    } else if (res?.message) {
      showToast.error(res.message);
    }
    return res;
  }, null);

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
        <button className="btn btn-secondary btn-sm inline-flex items-center gap-1" disabled={pending}>
          {pending && (
            <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {pending ? "Mereset..." : "Reset"}
        </button>
      </div>
      {state && <p className={`mt-1 text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
    </form>
  );
}
