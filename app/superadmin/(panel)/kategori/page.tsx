import Link from "next/link";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { Drawer } from "@/components/admin/Drawer";
import { DrawerForm } from "@/components/admin/DrawerForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtNum } from "@/lib/format";
import { deleteCategory, updateCategory } from "./actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin("superadmin");
  const [categories, usage] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.event.groupBy({ by: ["category"], _count: true }),
  ]);
  const count = new Map(usage.map((u) => [u.category, u._count]));

  return (
    <div className="space-y-4">
      <PageHeader title="Kategori pelatihan" description="Kategori dipilih saat membuat event dan dipakai untuk filter di halaman Pelatihan.">
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
                const n = count.get(c.name) ?? 0;
                return (
                  <tr key={c.id} className="align-top">
                    <td>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      {c.description && <p className="text-xs text-gray-500">{c.description}</p>}
                    </td>
                    <td className="text-right tabular-nums">
                      {n > 0 ? <Link href={`/superadmin/events?kategori=${encodeURIComponent(c.name)}`} className="text-brand hover:underline">{fmtNum(n)}</Link> : "0"}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <Drawer label="Ubah" title={`Ubah kategori ${c.name}`} variant="secondary">
                          <DrawerForm action={updateCategory.bind(null, c.id)}>
                            <div>
                              <label className="label" htmlFor={`n-${c.id}`}>Nama kategori</label>
                              <input id={`n-${c.id}`} name="name" defaultValue={c.name} className="input" maxLength={60} required />
                            </div>
                            <div>
                              <label className="label" htmlFor={`d-${c.id}`}>Keterangan</label>
                              <input id={`d-${c.id}`} name="description" defaultValue={c.description} className="input" maxLength={200} />
                            </div>
                            {n > 0 && <p className="text-xs text-gray-500">Ganti nama juga memperbarui {fmtNum(n)} event.</p>}
                          </DrawerForm>
                        </Drawer>
                        <form action={deleteCategory.bind(null, c.id)}>
                          <ConfirmSubmit
                            message={n ? `Hapus kategori "${c.name}"? ${n} event akan menjadi "Tanpa kategori" (event tidak ikut terhapus).` : `Hapus kategori "${c.name}"?`}
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
