import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  await requireAdmin("superadmin");
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/superadmin/articles" className="text-sm text-gray-500 hover:text-brand">← Semua artikel</Link>
      <h1 className="mt-1 text-xl font-semibold text-gray-900">Tulis artikel</h1>
      <ArticleForm />
    </div>
  );
}
