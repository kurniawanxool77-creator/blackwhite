import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { UserForm } from "@/components/admin/UserForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtDate, fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { createUser, updateUser } from "@/src/lib/actions/superadmin";
import { deleteUser } from "@/src/lib/actions/events";
import { useApiData } from "@/src/lib/api-client";

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
  const state = useApiData<{ users: SafeUserRow[] }>("/api/superadmin/users");

  return (
    <DataGate state={state}>
      {({ users }) => (
        <div className="space-y-6">
          <PageHeader title="Manajemen user" description={`${fmtNum(users.length)} akun peserta terdaftar.`}>
            <Drawer label="+ Tambah peserta" title="Tambah akun peserta">
              <UserForm action={createUser} />
            </Drawer>
          </PageHeader>

          <section className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Kontak & Instansi</th>
                    <th>Metode login</th>
                    <th>Bergabung</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-500">Belum ada akun user.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} image={u.image} size={32} />
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-gray-600">
                        <p>{u.phone || "-"}</p>
                        <p className="text-gray-500">{u.organization || "-"}</p>
                      </td>
                      <td className="text-xs text-gray-600">
                        {[u.hasPassword && "Password", u.emailVerified && "Google"].filter(Boolean).join(" · ") || "Belum diset"}
                      </td>
                      <td className="whitespace-nowrap text-xs text-gray-500">{fmtDate(u.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Drawer label="Ubah" title={`Ubah ${u.name}`} variant="secondary">
                            <UserForm
                              action={updateUser.bind(null, u.id)}
                              user={{ ...u, emailVerified: Boolean(u.emailVerified) }}
                            />
                          </Drawer>
                          <form action={async () => { await deleteUser(u.id); }}>
                            <ConfirmSubmit message={`Hapus akun "${u.name}" beserta seluruh tiketnya?`} className="btn btn-danger btn-sm">
                              Hapus
                            </ConfirmSubmit>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </DataGate>
  );
}

