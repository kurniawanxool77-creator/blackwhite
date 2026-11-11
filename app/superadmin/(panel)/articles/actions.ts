"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isImageUrl } from "@/lib/url";

// id null = artikel baru.
export async function saveArticle(id: string | null, _prev: string | null, f: FormData) {
  await requireAdmin("superadmin");
  const s = (key: string) => String(f.get(key) ?? "").trim();
  const title = s("title");
  const content = s("content");
  const coverUrl = s("coverUrl");
  const published = f.get("published") === "on";
  if (!title || !content) return "Judul dan isi wajib diisi.";
  if (coverUrl && !isImageUrl(coverUrl)) return "Gambar sampul tidak valid. Unggah ulang gambarnya.";

  const data = { title, content, excerpt: s("excerpt"), coverUrl: coverUrl || null, published };
  if (id) {
    const current = await db.article.findUniqueOrThrow({ where: { id } });
    await db.article.update({
      where: { id },
      data: { ...data, publishedAt: published ? (current.publishedAt ?? new Date()) : current.publishedAt },
    });
  } else {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    await db.article.create({
      data: { ...data, slug: `${base}-${randomBytes(2).toString("hex")}`, publishedAt: published ? new Date() : null },
    });
  }
  revalidatePath("/", "layout");
  redirect("/superadmin/articles");
}

export async function deleteArticle(id: string) {
  await requireAdmin("superadmin");
  await db.article.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/superadmin/articles");
}
