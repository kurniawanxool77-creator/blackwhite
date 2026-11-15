"use client";

import type { Article } from "@prisma/client";
import { useActionState } from "react";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { showToast } from "@/components/ui/Toast";
import { deleteArticle, saveArticle } from "@/src/lib/actions/superadmin";
import { ImageUpload } from "./ImageUpload";

export function ArticleForm({ article }: { article?: Article }) {
  const [error, action, pending] = useActionState(async (prev: string | null, f: FormData) => {
    const res = await saveArticle(article?.id ?? null, prev, f);
    if (!res) {
      showToast.success(article ? "Artikel berhasil diperbarui." : "Artikel baru berhasil disimpan.");
    } else {
      showToast.error(res);
    }
    return res;
  }, null);

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
            <ConfirmSubmit
              message={`Hapus artikel "${article.title}"? Tindakan ini tidak dapat dibatalkan.`}
              title={`Hapus Artikel "${article.title}"`}
              confirmText="Ya, Hapus Artikel"
              loadingText="Menghapus..."
              successMessage={`Artikel "${article.title}" berhasil dihapus.`}
              onConfirm={() => deleteArticle(article.id)}
              className="btn btn-danger"
              disabled={pending}
            >
              Hapus
            </ConfirmSubmit>
          )}
          <button className="btn btn-primary inline-flex items-center justify-center gap-1.5" disabled={pending}>
            {pending && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {pending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
