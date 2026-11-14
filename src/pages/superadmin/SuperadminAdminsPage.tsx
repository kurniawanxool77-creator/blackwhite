import { Link } from "react-router-dom";
import { AdminCreateForm } from "@/components/admin/AdminCreateForm";
import { Drawer } from "@/components/admin/Drawer";
import { DrawerForm } from "@/components/admin/DrawerForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { TeamProfileForm } from "@/components/admin/TeamProfileForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ROLE_LABEL } from "@/lib/roles";
import { DataGate } from "@/src/components/RouteState";
import { deleteAdmin, setAdminEvents, toggleAdmin } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";
import { useAuth } from "@/src/lib/auth-client";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  phone: string | null;
  image: string | null;
  duties: string;
  active: boolean;
  lockedUntil: Date | null;
  createdAt: Date;
  events: { id: string; name: string }[];
  _count: { scans: number };
};

export function SuperadminAdminsPage() {
  const { user: me } = useAuth();
  const state = useApiData<{ admins: AdminRow[]; events: { id: string; name: string }[] }>("/api/superadmin/admins");

  return (
    <DataGate state={state}>
      {({ admins, events }) => {
        const now = new Date();
        return (
          <div className="space-y-4">
            <PageHeader
              title="Tim & admin"
              description="Panitia/relawan login di halaman Login panitia dan hanya melihat event yang ditugaskan. Jabatan, kontak, dan tugas tampil di halaman Tim panitia."
            >
              <Drawer label="+ Tambah anggota tim" title="Tambah anggota tim">
                <AdminCreateForm events={events} />
              </Drawer>
            </PageHeader>

            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Peran</th>
                    <th>Event yang ditugaskan</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="align-top">
                      <td>
                        <div className="flex items-start gap-2.5">
                          <UserAvatar name={a.name} image={a.image} size={36} />
                          <div className="min-w-0">
                            <Link to={`/superadmin/tim/${a.id}`} className="font-medium text-brand hover:underline">{a.name}</Link>
                            <p className="text-xs text-gray-500">{a.email}</p>
                            {a.phone && <p className="text-xs text-gray-500">{a.phone}</p>}
                            {a.position && <p className="text-xs font-medium text-gray-700">{a.position}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {ROLE_LABEL[a.role] ?? a.role}
                        {a.duties && <p className="text-xs text-gray-500">{a.duties.split("\n").length} tugas</p>}
                      </td>
                      <td className="text-sm">
                        {a.role === "superadmin" ? (
                          <span className="text-gray-500">Semua event</span>
                        ) : a.events.length ? (
                          a.events.map((e) => e.name).join(", ")
                        ) : (
                          <span className="text-gray-400">Belum ditugaskan</span>
                        )}
                      </td>
                      <td>
                        <span className={a.active ? "text-gray-900 font-medium" : "text-gray-500"}>{a.active ? "Aktif" : "Nonaktif"}</span>
                        {a.lockedUntil && new Date(a.lockedUntil) > now && (
                          <p className="mt-1 text-xs text-amber-700">Terkunci sementara (salah password)</p>
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <Drawer label="Ubah" title={`Ubah ${a.name}`} variant="secondary">
                            <TeamProfileForm admin={{ id: a.id, name: a.name, position: a.position, phone: a.phone, duties: a.duties }} />
                            {a.role !== "superadmin" && (
                              <div className="mt-6 border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-900">Event yang ditugaskan</p>
                                <DrawerForm action={setAdminEvents.bind(null, a.id)} submitLabel="Simpan penugasan">
                                  {events.length === 0 && <p className="text-sm text-gray-500">Belum ada event aktif.</p>}
                                  {events.map((e) => (
                                    <label key={e.id} className="flex items-center gap-2 text-sm text-gray-800">
                                      <input
                                        type="checkbox"
                                        name="events"
                                        value={e.id}
                                        defaultChecked={a.events.some((x) => x.id === e.id)}
                                        className="h-4 w-4 accent-brand"
                                      />
                                      {e.name}
                                    </label>
                                  ))}
                                </DrawerForm>
                              </div>
                            )}
                            {a.id !== me?.id && (
                              <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-900">Akun</p>
                                <ResetPasswordForm adminId={a.id} />
                                <form action={async () => { await toggleAdmin(a.id); }}>
                                  <button className={`btn btn-sm ${a.active ? "btn-danger" : "btn-secondary"}`}>
                                    {a.active ? "Nonaktifkan akun" : "Aktifkan akun"}
                                  </button>
                                </form>
                              </div>
                            )}
                          </Drawer>
                          {a.id !== me?.id && (
                            a._count.scans === 0 ? (
                              <form action={async () => { await deleteAdmin(a.id); }}>
                                <ConfirmSubmit
                                  message={`Hapus akun ${a.name} (${a.email})? Tindakan ini tidak bisa dibatalkan.`}
                                  className="btn btn-danger btn-sm"
                                >
                                  Hapus
                                </ConfirmSubmit>
                              </form>
                            ) : (
                              <span className="self-center px-1 text-xs text-gray-400" title="Sudah pernah memindai peserta; riwayatnya disimpan. Nonaktifkan lewat Ubah.">
                                Punya riwayat scan
                              </span>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </DataGate>
  );
}
