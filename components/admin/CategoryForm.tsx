"use client";

import { useActionState } from "react";
import { createCategory } from "@/app/superadmin/(panel)/kategori/actions";
import { useDrawer } from "./Drawer";

export function CategoryForm() {
  const drawer = useDrawer();
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await createCategory(prev, f);
    if (!result) drawer?.close();
    return result;
  }, null);
  return (
    <form action={action} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="cat-name">Nama kategori</label>
        <input id="cat-name" name="name" className="input" placeholder="contoh: Pelatihan K3" maxLength={60} required />
      </div>
      <div>
        <label className="label" htmlFor="cat-desc">Keterangan (opsional)</label>
        <input id="cat-desc" name="description" className="input" placeholder="contoh: Keselamatan dan kesehatan kerja" maxLength={200} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Menyimpan..." : "Tambah kategori"}</button>
    </form>
  );
}
