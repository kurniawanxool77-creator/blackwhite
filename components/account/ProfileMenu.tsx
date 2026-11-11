"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { changeUserPassword } from "@/app/(user)/actions";
import { KeyIcon, LogoutIcon } from "@/components/ui/icons";
import { changeOwnPassword } from "@/lib/account-actions";
import type { ProfileInfo } from "@/lib/profile";

function Avatar({ name, image, size }: { name: string; image: string | null; size: number }) {
  const style = { width: size, height: size };
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" style={style} className="shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
  ) : (
    <span style={{ ...style, fontSize: size * 0.4 }} className="flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function PasswordSection({ profile, onDone }: { profile: ProfileInfo; onDone: () => void }) {
  const [state, action, pending] = useActionState(profile.kind === "admin" ? changeOwnPassword : changeUserPassword, null);
  if (state?.ok) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-green-700">{state.message}</p>
        <button type="button" className="btn btn-secondary btn-sm w-full" onClick={onDone}>Tutup</button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-3">
      {profile.hasPassword ? (
        <div>
          <label className="label" htmlFor="pm-current">Password lama</label>
          <input id="pm-current" name="current" type="password" autoComplete="current-password" className="input" required />
        </div>
      ) : (
        <p className="text-xs text-gray-600">Akun Anda masuk lewat Google. Buat password agar bisa masuk juga dengan email.</p>
      )}
      <div>
        <label className="label" htmlFor="pm-next">Password baru (min. 8 karakter)</label>
        <input id="pm-next" name="next" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="pm-confirm">Ulangi password baru</label>
        <input id="pm-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required />
      </div>
      {state && <p className="text-sm text-red-700">{state.message}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary btn-sm flex-1" onClick={onDone}>Batal</button>
        <button className="btn btn-primary btn-sm flex-1" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</button>
      </div>
    </form>
  );
}

// Header: foto + nama + peran (klik = popup profil) dan ikon keluar. tone "dark" untuk header biru panel admin.
export function ProfileMenu({ profile, tone = "light" }: { profile: ProfileInfo; tone?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    setEditing(false);
  };
  const logout = () => signOut({ callbackUrl: profile.logoutUrl });

  return (
    <div ref={root} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex min-h-11 items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
      >
        <Avatar name={profile.name} image={profile.image} size={34} />
        <span className="hidden min-w-0 sm:block">
          <span className={`block max-w-40 truncate text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{profile.name}</span>
          <span className={`block text-xs ${dark ? "text-white/75" : "text-gray-600"}`}>{profile.roleLabel}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={logout}
        aria-label="Keluar"
        title="Keluar"
        className={`flex h-11 w-11 items-center justify-center rounded-md transition-colors ${dark ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
      >
        <LogoutIcon width={20} height={20} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Profil akun"
          className="card animate-rise absolute top-full right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] text-gray-800 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-gray-100 p-4">
            <Avatar name={profile.name} image={profile.image} size={52} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{profile.name}</p>
              <p className="truncate text-sm text-gray-600">{profile.email}</p>
              <span className="mt-1 inline-block rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-brand">
                {profile.roleLabel}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="p-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">{profile.hasPassword ? "Ubah password" : "Buat password"}</p>
              <PasswordSection profile={profile} onDone={() => setEditing(false)} />
            </div>
          ) : (
            <>
              <dl className="space-y-2 p-4 text-sm">
                {profile.details.map((d) => (
                  <div key={d.label} className="flex justify-between gap-4">
                    <dt className="text-gray-600">{d.label}</dt>
                    <dd className="text-right font-medium text-gray-900">{d.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col border-t border-gray-100 py-1 text-sm">
                {profile.links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-800 hover:bg-gray-50">
                    {l.label}
                  </Link>
                ))}
                <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2.5 text-left text-gray-800 hover:bg-gray-50">
                  <KeyIcon width={16} height={16} className="text-gray-500" />
                  {profile.hasPassword ? "Ubah password" : "Buat password"}
                </button>
              </div>
              <div className="border-t border-gray-100 p-3">
                <button type="button" onClick={logout} className="btn btn-secondary btn-sm w-full">
                  <LogoutIcon width={16} height={16} />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
