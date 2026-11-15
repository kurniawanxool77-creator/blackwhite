"use client";

import { useActionState } from "react";
import { showToast } from "@/components/ui/Toast";
import { createCategory } from "@/src/lib/actions/superadmin";
import { useDrawer } from "./Drawer";

export function CategoryForm() {
  const drawer = useDrawer();
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const result = await createCategory(prev, f);
    if (!result) {
      showToast.success("Kategori baru berhasil ditambahkan.");
      drawer?.close();
    } else {
      showToast.error(result);
    }
    return result;
  }, null);

  return (
    <form action={action} className="mt-4 space-y-3">
      <div>
        <label className="label" htmlFor="cat-name">Nama kategori</label>
        <input id="cat-name" name="name" className="input" placeholder="contoh: Event Olahraga" maxLength={60} required />
      </div>
      <div>
        <label className="label" htmlFor="cat-desc">Keterangan (opsional)</label>
        <input id="cat-desc" name="description" className="input" placeholder="contoh: Keselamatan dan kesehatan kerja" maxLength={200} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className="btn btn-primary w-full inline-flex items-center justify-center gap-1.5" disabled={pending}>
        {pending && (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {pending ? "Menyimpan..." : "Tambah kategori"}
      </button>
    </form>
  );
}
