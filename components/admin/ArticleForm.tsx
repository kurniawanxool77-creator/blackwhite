"use client";

import type { Article } from "@prisma/client";
import { useActionState, useState } from "react";
import { deleteArticle, saveArticle } from "@/src/lib/actions/superadmin";
import { errorMessage } from "@/src/lib/rpc";
import { ImageUpload } from "./ImageUpload";

export function ArticleForm({ article }: { article?: Article }) {
  const [error, action, pending] = useActionState(saveArticle.bind(null, article?.id ?? null), null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const busy = pending || deleting;

  async function handleDelete() {
    if (!article || busy) return;
    if (!window.confirm(`Hapus artikel "${article.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteArticle(article.id);
    } catch (err) {
      setDeleteError(errorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <form action={action} className="card mt-6 space-y-4 p-5">
      <div>
        <label className="label" htmlFor="title">Judul</label>
        <input id="title" name="title" className="input" defaultValue={article?.title} required />
      </div>
      <div>
        <label className="label" htmlFor="excerpt">Ringkasan (tampil di daftar artikel)</label>
        <textarea id="excerpt" name="excerpt" rows={2} className="input" defaultValue={article?.excerpt} />
      </div>
      <ImageUpload name="coverUrl" label="Gambar sampul (opsional)" hint="Rasio 16:9, maks. 4 MB." defaultValue={article?.coverUrl} maxWidth={1200} />
      <div>
        <label className="label" htmlFor="content">Isi artikel (pisahkan paragraf dengan baris kosong)</label>
        <textarea id="content" name="content" rows={16} className="input" defaultValue={article?.content} required />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="published" defaultChecked={article?.published} className="accent-brand" />
          Terbitkan di halaman publik
        </label>
        <div className="flex gap-2">
          {article && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className="btn btn-danger"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          )}
          <button className="btn btn-primary" disabled={busy}>{pending ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </div>
      {(error || deleteError) && <p className="text-sm text-red-700">{error || deleteError}</p>}
    </form>
  );
}
