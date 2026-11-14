import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserForm } from "@/components/admin/UserForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { GoogleIcon } from "@/components/ui/icons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtDate, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { deleteUser } from "@/src/lib/actions/events";
import { createUser, updateUser } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";

const LIMIT = 200;

type SafeUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  image: string | null;
  emailVerified: Date | null;
  hasPassword: boolean;
  lockedUntil: Date | null;
  createdAt: Date;
};

export function SuperadminUsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q")?.trim() || undefined;
  const tipe = searchParams.get("tipe") || undefined;
  const state = useApiData<{ users: SafeUserRow[] }>("/api/superadmin/users");

  return (
    <DataGate state={state}>
      {({ users }) => {
        const now = new Date();
        const googleCount = users.filter((u) => u.emailVerified).length;
        const manualCount = users.filter((u) => !u.emailVerified).length;

        const filtered = tipe === "google"
          ? users.filter((u) => u.emailVerified)
          : tipe === "manual"
            ? users.filter((u) => !u.emailVerified)
            : users;

        const needle = q?.toLowerCase();
        const found = needle
          ? filtered.filter((u) =>
              [u.name, u.email, u.phone ?? "", u.organization ?? ""].some((v) => v.toLowerCase().includes(needle)),
            )
          : filtered;

        function onSearch(e: React.SubmitEvent<HTMLFormElement>) {
          e.preventDefault();
          const val = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          const params = new URLSearchParams();
          if (tipe) params.set("tipe", tipe);
          if (val) params.set("q", val);
          const qs = params.toString();
          navigate(qs ? `/superadmin/peserta?${qs}` : "/superadmin/peserta");
        }

        return (
          <div className="space-y-4">
            <PageHeader
              title="Manajemen user"
              description="Kelola akun pengguna, data profil, dan status autentikasi Akun Google."
            >
              <Drawer label="+ Tambah user" title="Tambah User Baru">
                <UserForm action={createUser} />
              </Drawer>
            </PageHeader>

            <div className="flex border-b border-gray-200">
              <Link
                to={`/superadmin/peserta${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  !tipe ? "border-brand font-semibold text-brand" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Semua ({fmtNum(users.length)})
              </Link>
              <Link
                to={`/superadmin/peserta?tipe=google${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tipe === "google" ? "border-blue-600 font-semibold text-blue-700" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <GoogleIcon className="h-3.5 w-3.5" />
                Akun Google ({fmtNum(googleCount)})
              </Link>
              <Link
                to={`/superadmin/peserta?tipe=manual${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  tipe === "manual" ? "border-gray-700 font-semibold text-gray-900" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Bukan Google ({fmtNum(manualCount)})
              </Link>
            </div>

            <form method="get" onSubmit={onSearch} role="search" className="flex flex-wrap items-center gap-2">
              {tipe && <input type="hidden" name="tipe" value={tipe} />}
              <input
                name="q"
                defaultValue={q}
                key={q ?? ""}
                placeholder="Cari nama, email, no. HP, atau instansi"
                aria-label="Cari pengguna"
                className="input max-w-sm flex-1"
              />
              <button className="btn btn-secondary">Cari</button>
              <span className="text-sm text-gray-600">
                {q || tipe
                  ? `${fmtNum(found.length)} dari ${fmtNum(users.length)} pengguna`
                  : `${fmtNum(users.length)} pengguna terdaftar`}
              </span>
              {(q || tipe) && (
                <Link to="/superadmin/peserta" className="text-sm font-medium text-brand hover:underline">Reset</Link>
              )}
            </form>

            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pengguna</th>
                    <th>Kontak</th>
                    <th>Status Akun</th>
                    <th>Akun Google</th>
                    <th>Bergabung</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {found.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {q || tipe ? "Tidak ada pengguna yang cocok dengan filter pencarian." : "Belum ada data pengguna."}
                      </td>
                    </tr>
                  )}
                  {found.slice(0, LIMIT).map((u) => {
                    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > now;
                    return (
                      <tr key={u.id} className="align-middle">
                        <td>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={u.name} image={u.image} size={36} />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.organization || "Pribadi / Umum"}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-sm font-medium text-gray-900">{u.email}</p>
                          <p className="text-xs text-gray-500">{u.phone || "Tanpa No. HP"}</p>
                        </td>
                        <td>
                          {isLocked ? (
                            <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              Terkunci sementara
                            </span>
                          ) : (
                            <span className="inline-block rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                              Aktif
                            </span>
                          )}
                        </td>
                        <td>
                          {u.emailVerified ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                <GoogleIcon className="h-3.5 w-3.5" />
                                Akun Google
                              </span>
                              <p className="text-[11px] text-gray-500">
                                {u.hasPassword ? "Google OAuth + Password" : "Login via Google OAuth"}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                                Bukan Google
                              </span>
                              <p className="text-[11px] text-gray-500">
                                {u.hasPassword ? "Email & Password manual" : "Belum diatur password"}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap font-mono text-xs text-gray-600">{fmtDate(u.createdAt)}</td>
                        <td>
                          <div className="flex justify-end gap-1.5">
                            <Drawer label="Ubah" title={`Ubah Akun ${u.name}`} variant="secondary">
                              <UserForm user={{ ...u, emailVerified: Boolean(u.emailVerified) }} action={updateUser.bind(null, u.id)} />
                            </Drawer>
                            <form action={async () => { await deleteUser(u.id); }}>
                              <ConfirmSubmit
                                message={`Hapus akun ${u.name} (${u.email})? Tindakan ini tidak bisa dibatalkan.`}
                                className="btn btn-danger btn-sm"
                              >
                                Hapus
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}
