import type { Category } from "@prisma/client";
import { Link } from "react-router-dom";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Drawer } from "@/components/admin/Drawer";
import { DrawerForm } from "@/components/admin/DrawerForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { fmtNum } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { deleteCategory, updateCategory } from "@/src/lib/actions/superadmin";
import { useApiData } from "@/src/lib/api-client";

export function SuperadminCategoriesPage() {
  const state = useApiData<{ categories: Category[]; counts: Record<string, number> }>("/api/superadmin/categories");

  return (
    <DataGate state={state}>
      {({ categories, counts }) => (
        <div className="space-y-4">
          <PageHeader title="Kategori event" description="Kategori dipilih saat membuat event dan dipakai untuk filter di halaman Event.">
            <Drawer label="+ Tambah kategori" title="Tambah kategori">
              <CategoryForm />
            </Drawer>
          </PageHeader>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th className="text-right">Event</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-500">Belum ada kategori.</td></tr>
                )}
                {categories.map((c) => {
                  const used = counts[c.name] ?? 0;
                  return (
                    <tr key={c.id} className="align-top">
                      <td>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                      </td>
                      <td className="text-right tabular-nums">
                        {used > 0 ? (
                          <Link to={`/superadmin/events?kategori=${encodeURIComponent(c.name)}`} className="text-brand hover:underline">
                            {fmtNum(used)}
                          </Link>
                        ) : "0"}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Drawer label="Ubah" title={`Ubah kategori ${c.name}`} variant="secondary">
                            <DrawerForm action={updateCategory.bind(null, c.id)}>
                              <div>
                                <label className="label" htmlFor={`c-n-${c.id}`}>Nama kategori</label>
                                <input id={`c-n-${c.id}`} name="name" defaultValue={c.name} className="input" maxLength={60} required />
                              </div>
                              <div>
                                <label className="label" htmlFor={`c-d-${c.id}`}>Keterangan</label>
                                <input id={`c-d-${c.id}`} name="description" defaultValue={c.description} className="input" maxLength={200} />
                              </div>
                              {used > 0 && <p className="text-xs text-gray-500">Ganti nama juga memperbarui {fmtNum(used)} event.</p>}
                            </DrawerForm>
                          </Drawer>
                          <form action={async () => { await deleteCategory(c.id); }}>
                            <ConfirmSubmit
                              message={used ? `Hapus kategori "${c.name}"? ${used} event akan menjadi "Tanpa kategori" (event tidak ikut terhapus).` : `Hapus kategori "${c.name}"?`}
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
      )}
    </DataGate>
  );
}

