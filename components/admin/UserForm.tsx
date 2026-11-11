"use client";

import { useActionState, useState } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { useDrawer } from "./Drawer";

type UserData = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  organization?: string | null;
  emailVerified?: boolean;
};

type Props = {
  user?: UserData;
  action: (prev: unknown, f: FormData) => Promise<unknown>;
};

export function UserForm({ user, action }: Props) {
  const drawer = useDrawer();
  const isEdit = Boolean(user?.id);
  const [accountType, setAccountType] = useState<"credentials" | "google">(
    user?.emailVerified ? "google" : "credentials"
  );

  const [state, formAction, pending] = useActionState(async (_prev: unknown, f: FormData) => {
    try {
      await action(null, f);
      drawer?.close();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Terjadi kesalahan.";
    }
  }, null);

  return (
    <form action={formAction} className="space-y-4 pt-2">
      {state && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {state}
        </div>
      )}

      <div>
        <label className="label" htmlFor="user-name">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          id="user-name"
          name="name"
          type="text"
          required
          defaultValue={user?.name ?? ""}
          placeholder="Nama pengguna"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="user-email">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          required
          defaultValue={user?.email ?? ""}
          placeholder="nama@email.com"
          className="input"
        />
      </div>

      {/* Pilihan Akun Google atau Bukan */}
      <div>
        <label className="label">Status Akun Google</label>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs transition-colors ${
              accountType === "google"
                ? "border-blue-500 bg-blue-50/60 font-semibold text-blue-900"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="accountType"
              value="google"
              checked={accountType === "google"}
              onChange={() => setAccountType("google")}
              className="text-brand focus:ring-brand"
            />
            <span className="flex items-center gap-1.5 min-w-0">
              <GoogleIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">Akun Google</span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-xs transition-colors ${
              accountType === "credentials"
                ? "border-brand bg-brand/5 font-semibold text-gray-900"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="accountType"
              value="credentials"
              checked={accountType === "credentials"}
              onChange={() => setAccountType("credentials")}
              className="text-brand focus:ring-brand"
            />
            <span className="truncate">Bukan Google (Manual)</span>
          </label>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          {accountType === "google"
            ? "Akun terhubung via Google OAuth. User dapat login langsung menggunakan tombol Google."
            : "Akun login mandiri menggunakan alamat email dan kata sandi."}
        </p>
      </div>

      <div>
        <label className="label" htmlFor="user-password">
          Password{" "}
          {isEdit ? (
            <span className="text-xs font-normal text-gray-500">(Kosongkan bila tidak diubah)</span>
          ) : accountType === "google" ? (
            <span className="text-xs font-normal text-gray-500">(Opsional untuk akun Google)</span>
          ) : (
            <span className="text-red-500">*</span>
          )}
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          required={!isEdit && accountType === "credentials"}
          minLength={6}
          placeholder={
            isEdit
              ? "Masukkan password baru jika ingin mereset"
              : accountType === "google"
              ? "Opsional, user bisa login via Google OAuth"
              : "Minimal 6 karakter"
          }
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="user-phone">
          No. Handphone / WhatsApp
        </label>
        <input
          id="user-phone"
          name="phone"
          type="tel"
          defaultValue={user?.phone ?? ""}
          placeholder="081234567890"
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="user-org">
          Instansi / Perusahaan
        </label>
        <input
          id="user-org"
          name="organization"
          type="text"
          defaultValue={user?.organization ?? ""}
          placeholder="PT Contoh Sejahtera atau Pribadi"
          className="input"
        />
      </div>

      <div className="pt-2">
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah User"}
        </button>
      </div>
    </form>
  );
}
