import { Link } from "react-router-dom";
import { AdminCreateForm } from "@/components/admin/AdminCreateForm";
import { Drawer } from "@/components/admin/Drawer";
import { PageHeader } from "@/components/admin/PageHeader";
import { ResetPasswordForm } from "@/components/admin/ResetPasswordForm";
import { TeamProfileForm } from "@/components/admin/TeamProfileForm";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtNum } from "@/lib/format";
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
  const { user } = useAuth();
  const state = useApiData<{ admins: AdminRow[]; events: { id: string; name: string }[] }>("/api/superadmin/admins");

  return (
    <DataGate state={state}>
      {({ admins, events }) => (
        <div className="space-y-6">
          <PageHeader title="Tim & admin" description="Kelola akun panitia, jabatan, event yang ditugaskan, dan akses akun.">
            <Drawer label="+ Tambah tim / admin" title="Tambah panitia atau superadmin">
              <AdminCreateForm events={events} />
            </Drawer>
          </PageHeader>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Anggota</th>
                    <th>Peran & Tugas</th>
                    <th>Event ditugaskan</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => {
                    const assignedIds = new Set(a.events.map((e) => e.id));
                    const isSelf = a.id === user?.id;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar name={a.name} image={a.image} size={36} />
                            <div>
                              <Link to={`/superadmin/tim/${a.id}`} className="font-semibold text-gray-900 hover:text-brand">
                                {a.name}
                              </Link>
                              <p className="text-xs text-gray-500">{a.email}</p>
                              {a.phone && <p className="text-xs text-gray-500">{a.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="font-medium text-gray-800">{a.position || ROLE_LABEL[a.role] || a.role}</p>
                          <p className="text-xs text-gray-500">{ROLE_LABEL[a.role] ?? a.role} · {fmtNum(a._count.scans)} scan</p>
                        </td>
                        <td>
                          {a.role === "superadmin" ? (
                            <span className="text-xs text-gray-500">Semua event</span>
                          ) : (
                            <details className="group">
                              <summary className="cursor-pointer text-xs font-medium text-brand">
                                {a.events.length ? `${a.events.length} event` : "Belum ditugaskan"} · atur
                              </summary>
                              <form action={async (f) => { await setAdminEvents(a.id, f); }} className="mt-2 space-y-1.5 rounded border border-gray-200 bg-white p-2.5 shadow-sm">
                                {events.map((ev) => (
                                  <label key={ev.id} className="flex items-center gap-1.5 text-xs text-gray-700">
                                    <input type="checkbox" name="events" value={ev.id} defaultChecked={assignedIds.has(ev.id)} className="accent-brand" />
                                    {ev.name}
                                  </label>
                                ))}
                                <button className="btn btn-primary btn-sm mt-2 w-full text-xs">Simpan</button>
                              </form>
                            </details>
                          )}
                        </td>
                        <td>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${a.active ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
                            {a.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <Drawer label="Ubah" title={`Profil ${a.name}`} variant="secondary">
                              <TeamProfileForm admin={a} />
                              <div className="mt-6 border-t border-gray-200 pt-4">
                                <p className="text-xs font-semibold text-gray-700">Reset password</p>
                                <ResetPasswordForm adminId={a.id} />
                              </div>
                            </Drawer>
                            {!isSelf && (
                              <button type="button" onClick={() => toggleAdmin(a.id)} className="btn btn-secondary btn-sm">
                                {a.active ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            )}
                            {!isSelf && (a._count.scans === 0 ? (
                              <form action={async () => { await deleteAdmin(a.id); }}>
                                <ConfirmSubmit message={`Hapus akun panitia "${a.name}"?`} className="btn btn-danger btn-sm">Hapus</ConfirmSubmit>
                              </form>
                            ) : (
                              <span className="self-center px-1 text-xs text-gray-400" title="Sudah pernah memindai peserta; riwayatnya disimpan. Nonaktifkan lewat Ubah.">
                                Punya riwayat scan
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DataGate>
  );
}

