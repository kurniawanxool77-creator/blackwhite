import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function EditArticlePage({ params }: PageProps<"/superadmin/articles/[id]">) {
  await requireAdmin("superadmin");
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/superadmin/articles" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
      <h1 className="mt-1 text-xl font-semibold text-gray-900">Edit artikel</h1>
      <ArticleForm article={article} />
    </div>
  );
}
