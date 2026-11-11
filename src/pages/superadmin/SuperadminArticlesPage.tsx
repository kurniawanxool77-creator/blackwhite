import type { Article } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDate } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function SuperadminArticlesPage() {
  const state = useApiData<{ articles: Article[] }>("/api/superadmin/articles");

  return (
    <DataGate state={state}>
      {({ articles }) => (
        <>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Artikel</h1>
            <Link to="/superadmin/articles/new" className="btn btn-primary btn-sm">Tulis artikel</Link>
          </div>
          <div className="card mt-4 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Terbit</th>
                  <th>Diubah</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500">Belum ada artikel.</td>
                  </tr>
                )}
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/superadmin/articles/${a.id}`} className="font-medium text-brand hover:underline">{a.title}</Link>
                      {a.excerpt && <p className="line-clamp-1 text-xs text-gray-500">{a.excerpt}</p>}
                    </td>
                    <td>
                      <StatusBadge status={a.published ? "approved" : "draft"} label={a.published ? "Terbit" : "Draft"} />
                    </td>
                    <td className="whitespace-nowrap">{a.publishedAt ? fmtDate(a.publishedAt) : "-"}</td>
                    <td className="whitespace-nowrap">{fmtDate(a.updatedAt)}</td>
                    <td className="text-right whitespace-nowrap">
                      {a.published && (
                        <Link to={`/blog/${a.slug}`} target="_blank" className="btn btn-secondary btn-sm">Lihat</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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

