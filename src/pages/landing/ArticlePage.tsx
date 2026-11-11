import type { Article } from "@prisma/client";
import { Link, useParams } from "react-router-dom";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { fmtDate } from "@/lib/format";
import { DataGate } from "@/src/components/RouteState";
import { useApiData } from "@/src/lib/api-client";

export function ArticlePage() {
  const { slug } = useParams();
  const state = useApiData<{ article: Article; others: Article[] }>(
    slug ? `/api/public/blog/${encodeURIComponent(slug)}` : null,
  );

  return (
    <DataGate state={state} notFoundTitle="Artikel tidak ditemukan" backTo="/blog">
      {({ article, others }) => (
        <>
          <article className="mx-auto max-w-3xl px-4 py-4 md:py-10">
            <Link to="/blog" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-gray-900 md:text-3xl">{article.title}</h1>
            {article.publishedAt && <p className="mt-2 text-sm text-gray-500">{fmtDate(article.publishedAt)}</p>}
            {article.coverUrl && (
              <img src={article.coverUrl} alt={article.title} className="mt-6 aspect-video w-full rounded-md border border-gray-200 object-cover" />
            )}
            <div className="mt-6 space-y-4 leading-relaxed text-gray-800">
              {article.content.split(/\n\s*\n/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </article>

          {others.length > 0 && (
            <section className="mx-auto max-w-6xl border-t border-gray-200 px-4 py-10">
              <h2 className="text-lg font-semibold text-gray-900">Artikel lainnya</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </DataGate>
  );
}

