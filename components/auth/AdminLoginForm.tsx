"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// portal "superadmin" login di /superadmin, portal "admin" untuk panitia di /admin.
export function AdminLoginForm({ portal }: { portal: "superadmin" | "admin" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("admin", {
      email: form.get("email"),
      password: form.get("password"),
      portal,
      redirect: false,
    });
    if (res?.ok) {
      // Proxy mengarahkan ke halaman awal sesuai peran.
      router.replace(`/${portal}`);
      router.refresh();
    } else {
      setError("Email atau password salah, atau akun tidak memiliki akses ke halaman ini.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
