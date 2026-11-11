import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { fmtDate } from "@/lib/format";
import { metaDescription } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await db.article.findUnique({ where: { slug } });
  if (!a?.published) return { title: "Artikel tidak ditemukan", robots: { index: false } };
  const description = metaDescription(a.excerpt || a.content, a.title);
  return {
    title: a.title,
    description,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: "article", title: a.title, description, publishedTime: a.publishedAt?.toISOString(), images: a.coverUrl ? [{ url: a.coverUrl }] : undefined },
  };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article?.published) notFound();
  const others = await db.article.findMany({
    where: { published: true, id: { not: article.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-4 md:py-10">
        <Link href="/blog" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
        <h1 className="mt-2 text-xl font-bold md:text-3xl tracking-tight text-gray-900">{article.title}</h1>
        {article.publishedAt && <p className="mt-2 text-sm text-gray-500">{fmtDate(article.publishedAt)}</p>}
        {article.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
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
            {others.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        </section>
      )}
    </>
  );
}
