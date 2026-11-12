"use client";

import { useState, useTransition } from "react";
import Link from "@/src/shims/next-link";
import { createCategory } from "@/src/lib/actions/superadmin";

export function CategoryPicker({ categories, defaultValue = "" }: { categories: string[]; defaultValue?: string }) {
  const [items, setItems] = useState<string[]>(() =>
    [...new Set([...categories, ...(defaultValue ? [defaultValue] : [])])].filter(Boolean)
  );
  const [selected, setSelected] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submitNew = () => {
    const name = draft.trim().slice(0, 60);
    if (!name) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    const existing = items.find((c) => c.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelected(existing);
      setDraft("");
      setAdding(false);
      setError(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      const res = await createCategory(null, fd);
      if (res) {
        setError(res);
        return;
      }
      setItems((prev) => [...prev, name]);
      setSelected(name);
      setDraft("");
      setAdding(false);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label mb-0">Kategori</span>
        <Link href="/superadmin/kategori" className="text-xs font-medium text-brand hover:underline">
          Kelola semua kategori
        </Link>
      </div>
      <input type="hidden" name="category" value={selected} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Pilih kategori event">
        <button
          type="button"
          onClick={() => setSelected("")}
          aria-pressed={selected === ""}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
            selected === ""
              ? "border-brand bg-green-50 text-brand"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Tanpa kategori
        </button>
        {items.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelected(c)}
            aria-pressed={selected === c}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
              selected === c
                ? "border-brand bg-green-50 text-brand"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setError(null); }}
            className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-brand hover:text-brand"
          >
            + Tambah kategori
          </button>
        )}
      </div>
      {adding && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-2.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNew();
              }
            }}
            placeholder="Nama kategori baru, mis. Fun Bike / K3"
            className="input flex-1 min-w-44 bg-white py-1.5 text-sm"
            maxLength={60}
            autoFocus
          />
          <button type="button" onClick={submitNew} disabled={pending} className="btn btn-primary btn-sm">
            {pending ? "Menyimpan..." : "Simpan kategori"}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setDraft(""); setError(null); }}
            className="btn btn-secondary btn-sm"
          >
            Batal
          </button>
          {error && <p className="w-full text-xs text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
