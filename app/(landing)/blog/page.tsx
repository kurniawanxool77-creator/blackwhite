import { ArticleCard } from "@/components/ui/ArticleCard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const articles = await db.article.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 md:py-10">
      <h1 className="text-lg font-bold tracking-tight text-gray-900 md:text-2xl">Blog & artikel</h1>
      <p className="mt-1 text-sm text-gray-600">Kabar, tips, dan panduan dari kami.</p>
      {articles.length === 0 ? (
        <p className="card mt-6 p-6 text-sm text-gray-600">Belum ada artikel.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-6 md:gap-5 lg:grid-cols-3">
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}
