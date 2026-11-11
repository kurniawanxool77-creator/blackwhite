import type { Article } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function SuperadminArticlesPage() {
  const state = useApiData<{ articles: Article[] }>("/api/superadmin/articles");

  return (
    <DataGate state={state}>
      {({ articles }) => (
        <div className="space-y-5">
          <PageHeader title="Blog & artikel" description="Tulis berita kegiatan, dokumentasi, dan panduan peserta.">
            <Link to="/superadmin/articles/new" className="btn btn-primary btn-sm">+ Tulis artikel</Link>
          </PageHeader>

          <section className="card overflow-hidden">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-500">Belum ada artikel.</td></tr>
                )}
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500">/blog/{a.slug}</p>
                    </td>
                    <td><StatusBadge status={a.published ? "open" : "draft"} label={a.published ? "Terbit" : "Draft"} /></td>
                    <td className="whitespace-nowrap text-xs text-gray-500">{fmtDate(a.updatedAt)}</td>
                    <td className="text-right">
                      <Link to={`/superadmin/articles/${a.id}`} className="btn btn-secondary btn-sm">Ubah</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </DataGate>
  );
}

export function SuperadminArticleNewPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/superadmin/articles" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
      <h1 className="mt-2 text-xl font-bold text-gray-900">Tulis artikel baru</h1>
      <ArticleForm />
    </div>
  );
}

export function SuperadminArticleEditPage() {
  const { id } = useParams();
  const state = useApiData<{ article: Article }>(id ? `/api/superadmin/articles/${encodeURIComponent(id)}` : null);

  return (
    <DataGate state={state} notFoundTitle="Artikel tidak ditemukan" backTo="/superadmin/articles">
      {({ article }) => (
        <div className="mx-auto max-w-3xl">
          <Link to="/superadmin/articles" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
          <h1 className="mt-2 text-xl font-bold text-gray-900">Ubah artikel</h1>
          <ArticleForm article={article} />
        </div>
      )}
    </DataGate>
  );
}

