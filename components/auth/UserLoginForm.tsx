"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Login peserta dengan email + password (akun dari halaman Daftar).
export function UserLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const res = await signIn("user", { email: form.get("email"), password: form.get("password"), redirect: false });
      if (res?.ok) {
        router.replace(callbackUrl);
        router.refresh();
        return;
      }
      setError("Email atau password salah. Jika mendaftar dengan Google, silakan gunakan tombol Google di bawah.");
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Masuk..." : "Masuk"}</button>
    </form>
  );
}
