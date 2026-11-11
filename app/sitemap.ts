import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Peta situs untuk Google: halaman utama, pelatihan yang dipublikasikan, dan artikel.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [events, articles] = await Promise.all([
    db.event.findMany({ where: { status: { not: "draft" } }, select: { slug: true, createdAt: true, status: true } }),
    db.article.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } }),
  ]);
  const pages = ["", "/event", "/tentang", "/galeri", "/blog", "/kontak"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/event" ? 0.9 : 0.6,
  }));
  return [
    ...pages,
    ...events.map((e) => ({ url: `${base}/event/${e.slug}`, lastModified: e.createdAt, changeFrequency: "daily" as const, priority: e.status === "open" ? 0.9 : 0.5 })),
    ...articles.map((a) => ({ url: `${base}/blog/${a.slug}`, lastModified: a.publishedAt ?? undefined, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
