import type { Article } from "@prisma/client";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { CalendarIcon } from "./icons";

// HP: baris daftar (foto kecil di pinggir + judul). Layar besar: kartu dengan foto di atas.
export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/blog/${article.slug}`} className="group card card-link flex gap-3 overflow-hidden p-3 sm:block sm:p-0">
      <div className="h-20 w-28 shrink-0 overflow-hidden rounded bg-gray-100 sm:aspect-video sm:h-auto sm:w-full sm:rounded-none">
        {article.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverUrl} alt={article.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400" aria-hidden>
            <CalendarIcon width={28} height={28} />
          </div>
        )}
      </div>
      <div className="min-w-0 sm:p-5">
        {article.publishedAt && <p className="text-xs text-gray-500">{fmtDate(article.publishedAt)}</p>}
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900 sm:mt-1 sm:text-base">{article.title}</p>
        {article.excerpt && <p className="mt-2 line-clamp-3 hidden text-sm text-gray-600 sm:block">{article.excerpt}</p>}
      </div>
    </Link>
  );
}
