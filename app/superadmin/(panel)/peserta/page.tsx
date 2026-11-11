import Link from "next/link";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { GoogleIcon } from "@/components/ui/icons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserForm } from "@/components/admin/UserForm";
import { deleteUser } from "../events/registration-actions";
import { createUser, updateUser } from "./actions";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { queryParam } from "@/lib/event-search";
import { fmtDate, fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";

const LIMIT = 200;

export default async function UserManagementPage({ searchParams }: PageProps<"/superadmin/peserta">) {
  await requireAdmin("superadmin");
  const sp = await searchParams;
  const q = queryParam(sp.q);
  const tipe = sp.tipe; // "google" | "manual" | undefined
  const now = new Date();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const googleCount = users.filter((u) => u.emailVerified).length;
  const manualCount = users.filter((u) => !u.emailVerified).length;

  let filtered = users;
  if (tipe === "google") {
    filtered = filtered.filter((u) => u.emailVerified);
  } else if (tipe === "manual") {
    filtered = filtered.filter((u) => !u.emailVerified);
  }

  const needle = q?.toLowerCase();
  const found = needle
    ? filtered.filter((u) =>
        [u.name, u.email, u.phone ?? "", u.organization ?? ""].some((v) =>
          v.toLowerCase().includes(needle)
        )
      )
    : filtered;

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

      {/* Filter tab: Semua / Akun Google / Bukan Google */}
      <div className="flex border-b border-gray-200">
        <Link
          href={`/superadmin/peserta${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            !tipe
              ? "border-brand text-brand font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Semua ({fmtNum(users.length)})
        </Link>
        <Link
          href={`/superadmin/peserta?tipe=google${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tipe === "google"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <GoogleIcon className="h-3.5 w-3.5" />
          Akun Google ({fmtNum(googleCount)})
        </Link>
        <Link
          href={`/superadmin/peserta?tipe=manual${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tipe === "manual"
              ? "border-gray-700 text-gray-900 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Bukan Google ({fmtNum(manualCount)})
        </Link>
      </div>

      <form method="get" role="search" className="flex flex-wrap items-center gap-2">
        {tipe && <input type="hidden" name="tipe" value={tipe} />}
        <input
          name="q"
          defaultValue={q}
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
          <Link href="/superadmin/peserta" className="text-sm text-brand hover:underline font-medium">
            Reset
          </Link>
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
                <td colSpan={6} className="text-center text-gray-500 py-6">
                  {q || tipe ? "Tidak ada pengguna yang cocok dengan filter pencarian." : "Belum ada data pengguna."}
                </td>
              </tr>
            )}
            {found.slice(0, LIMIT).map((u) => {
              const isLocked = u.lockedUntil && u.lockedUntil > now;
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
                    <p className="text-sm text-gray-900 font-medium">{u.email}</p>
                    <p className="text-xs text-gray-500">{u.phone || "Tanpa No. HP"}</p>
                  </td>
                  <td>
                    {isLocked ? (
                      <span className="inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Terkunci sementara
                      </span>
                    ) : (
                      <span className="inline-block rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
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
                          {u.passwordHash ? "Google OAuth + Password" : "Login via Google OAuth"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                          Bukan Google
                        </span>
                        <p className="text-[11px] text-gray-500">
                          {u.passwordHash ? "Email & Password manual" : "Belum diatur password"}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap font-mono text-xs text-gray-600">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Drawer label="Ubah" title={`Ubah Akun ${u.name}`} variant="secondary">
                        <UserForm
                          user={{
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            phone: u.phone,
                            organization: u.organization,
                            emailVerified: u.emailVerified,
                          }}
                          action={updateUser.bind(null, u.id)}
                        />
                      </Drawer>

                      <form action={deleteUser.bind(null, u.id)}>
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
}
