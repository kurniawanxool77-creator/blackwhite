import { useActionState } from "react";
import { Link } from "react-router-dom";
import { SignOutButton } from "@/components/auth/AuthButtons";
import { CalendarIcon, CheckCircleIcon, TicketIcon } from "@/components/ui/icons";
import { AvatarUpload } from "@/components/user/AvatarUpload";
import { ProfileForm } from "@/components/user/ProfileForm";
import { DataGate } from "@/src/components/RouteState";
import { changeUserPassword } from "@/src/lib/actions/user";
import { useApiData } from "@/src/lib/api-client";

type AccountPayload = {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    phone: string | null;
    organization: string | null;
    emailVerified: Date | null;
  };
};

function UserPasswordSection() {
  const [state, action, pending] = useActionState(changeUserPassword, null);
  return (
    <section className="card p-5">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-gray-900">Keamanan & Password</h2>
        <p className="text-[11px] text-gray-500">Ganti atau atur password agar bisa masuk juga dengan email.</p>
      </div>
      <form action={action} key={state?.ok ? state.message : "pwd"} className="space-y-3">
        <div>
          <label className="label text-xs" htmlFor="u-current">Password lama (kosongkan jika daftar via Google)</label>
          <input id="u-current" name="current" type="password" autoComplete="current-password" className="input text-xs" />
        </div>
        <div>
          <label className="label text-xs" htmlFor="u-next">Password baru (min. 8 karakter)</label>
          <input id="u-next" name="next" type="password" autoComplete="new-password" minLength={8} className="input text-xs" required />
        </div>
        <div>
          <label className="label text-xs" htmlFor="u-confirm">Ulangi password baru</label>
          <input id="u-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input text-xs" required />
        </div>
        {state && <p className={`text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>{state.message}</p>}
        <button className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan password"}
        </button>
      </form>
    </section>
  );
}

export function UserAccountPage() {
  const state = useApiData<AccountPayload>("/api/user/account");

  return (
    <DataGate state={state} notFoundTitle="Akun tidak ditemukan" backTo="/login">
      {({ user }) => {
        const name = user.name || user.email || "";
        const initial = name.charAt(0).toUpperCase() || "P";

        return (
          <div className="mx-auto max-w-xl animate-rise space-y-5">
            <div className="card flex items-center gap-4 p-5">
              {user.image ? (
                <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-bold text-white shadow-xs">
                  {initial}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-bold text-gray-900">{name}</h1>
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircleIcon className="h-3 w-3" />
                      Terverifikasi
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
                {(user.phone || user.organization) && (
                  <p className="mt-1 truncate text-xs font-medium text-gray-700">
                    {[user.phone, user.organization].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <AvatarUpload name={name} image={user.image ?? null} />
            </div>

            <div className="card divide-y divide-gray-100 overflow-hidden">
              <Link
                to="/dashboard"
                className="flex items-center justify-between px-5 py-3.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <TicketIcon className="h-4 w-4 text-brand" />
                  <span>Tiket & Status Pendaftaran Saya</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              <Link
                to="/event"
                className="flex items-center justify-between px-5 py-3.5 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="h-4 w-4 text-brand" />
                  <span>Katalog Event & Acara</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>

            <section className="card p-5">
              <div className="mb-4 border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">Data Profil Peserta</h2>
                <p className="text-[11px] text-gray-500">
                  Perbarui data diri untuk mempermudah verifikasi dan pencetakan sertifikat acara.
                </p>
              </div>
              <ProfileForm
                name={user.name ?? ""}
                email={user.email ?? ""}
                phone={user.phone ?? ""}
                organization={user.organization ?? ""}
              />
            </section>

            <UserPasswordSection />

            <div className="pt-2">
              <SignOutButton />
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}

