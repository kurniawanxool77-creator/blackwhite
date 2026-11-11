import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function ArticlesPage() {
  await requireAdmin("superadmin");
  const articles = await db.article.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Artikel</h1>
        <Link href="/superadmin/articles/new" className="btn btn-primary btn-sm">Tulis artikel</Link>
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
                  <Link href={`/superadmin/articles/${a.id}`} className="font-medium text-brand hover:underline">{a.title}</Link>
                  {a.excerpt && <p className="line-clamp-1 text-xs text-gray-500">{a.excerpt}</p>}
                </td>
                <td>
                  <StatusBadge status={a.published ? "approved" : "draft"} label={a.published ? "Terbit" : "Draft"} />
                </td>
                <td className="whitespace-nowrap">{a.publishedAt ? fmtDate(a.publishedAt) : "-"}</td>
                <td className="whitespace-nowrap">{fmtDate(a.updatedAt)}</td>
                <td className="text-right whitespace-nowrap">
                  {a.published && (
                    <Link href={`/blog/${a.slug}`} target="_blank" className="btn btn-secondary btn-sm">Lihat</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
