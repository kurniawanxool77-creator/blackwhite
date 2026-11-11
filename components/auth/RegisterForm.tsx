"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerUser } from "@/app/(landing)/daftar/actions";

// Daftar akun peserta lalu langsung masuk.
export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const result = await registerUser(null, form);
    if (!result?.ok) {
      setError(result?.message ?? "Pendaftaran gagal.");
      setPending(false);
      return;
    }
    const res = await signIn("user", { email: form.get("email"), password: form.get("password"), redirect: false });
    router.replace(res?.ok ? callbackUrl : "/login");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Nama lengkap</label>
        <input id="name" name="name" autoComplete="name" className="input" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">No. HP / WhatsApp</label>
        <input id="phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" className="input" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Ulangi password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required />
        </div>
      </div>
      <p className="text-xs text-gray-500">Minimal 8 karakter.</p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-success w-full" disabled={pending}>{pending ? "Mendaftar..." : "Daftar"}</button>
    </form>
  );
}
