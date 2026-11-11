import { useActionState } from "react";
import { AvatarUpload } from "@/components/user/AvatarUpload";
import { ProfileForm } from "@/components/user/ProfileForm";
import { DataGate } from "@/src/components/RouteState";
import { changeUserPassword } from "@/src/lib/actions/user";
import { useApiData } from "@/src/lib/api-client";
import { signOut } from "@/src/lib/auth-client";

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
      <h2 className="text-base font-semibold text-gray-900">Keamanan & Password</h2>
      <p className="mt-1 text-xs text-gray-500">Ganti atau atur password agar bisa masuk dengan email.</p>
      <form action={action} key={state?.ok ? state.message : "pwd"} className="mt-4 space-y-3">
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
      {({ user }) => (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Profil akun</h1>
              <p className="mt-1 text-sm text-gray-600">Lengkapi data peserta untuk tiket QR dan penerbitan sertifikat.</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-secondary btn-sm"
            >
              Keluar
            </button>
          </div>

          <section className="card p-5">
            <AvatarUpload name={user.name} image={user.image} />
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Identitas Peserta</h2>
            <ProfileForm
              name={user.name}
              email={user.email}
              phone={user.phone ?? ""}
              organization={user.organization ?? ""}
            />
          </section>

          <UserPasswordSection />
        </div>
      )}
    </DataGate>
  );
}

