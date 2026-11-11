"use client";

import { useActionState } from "react";
import { updateProfile } from "@/src/lib/actions/user";
import { CheckCircleIcon } from "@/components/ui/icons";

type Props = { name: string; email: string; phone: string; organization: string };

export function ProfileForm({ name, email, phone, organization }: Props) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label text-xs" htmlFor="name">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          autoComplete="name"
          className="input text-xs"
          required
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Nama ini akan dicantumkan pada tiket barcode dan sertifikat kegiatan.
        </p>
      </div>

      <div>
        <label className="label text-xs" htmlFor="email">
          Alamat Email
        </label>
        <input
          id="email"
          value={email}
          className="input bg-gray-50 text-xs text-gray-500 cursor-not-allowed"
          readOnly
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="mt-1 text-[11px] text-gray-400">
          Email terverifikasi terikat dengan sesi akun dan tidak dapat diubah.
        </p>
      </div>

      <div>
        <label className="label text-xs" htmlFor="phone">
          Nomor WhatsApp / HP
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={phone}
          inputMode="tel"
          autoComplete="tel"
          placeholder="contoh: 0812 3456 7890"
          className="input text-xs"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Digunakan panitia untuk mengirimkan info perubahan jadwal atau instruksi acara.
        </p>
      </div>

      <div>
        <label className="label text-xs" htmlFor="organization">
          Instansi / Perusahaan
        </label>
        <input
          id="organization"
          name="organization"
          defaultValue={organization}
          autoComplete="organization"
          placeholder="contoh: PT Industri Mandiri Jaya"
          className="input text-xs"
        />
      </div>

      {state && (
        <div
          className={`flex items-center gap-2 rounded border p-3 text-xs ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.ok && <CheckCircleIcon className="h-4 w-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full text-xs"
        disabled={pending}
      >
        {pending ? "Menyimpan Perubahan..." : "Simpan Profil Saya"}
      </button>
    </form>
  );
}
