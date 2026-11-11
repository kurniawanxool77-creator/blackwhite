import { getActiveAdmin, getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function canView(ownerId: string) {
  const session = await getSession();
  return session?.user.id === ownerId || !!(await getActiveAdmin());
}

// Gambar publik (banner, sampul, avatar): ID acak dan isinya tidak pernah berubah, jadi aman di-cache selamanya.
// Gambar privat (ownerId terisi): hanya pemilik dan admin aktif, tanpa cache; selain itu 404 agar keberadaannya tidak terungkap.
export async function GET(_req: Request, ctx: RouteContext<"/media/[id]">) {
  const { id } = await ctx.params;
  const media = await db.media.findUnique({ where: { id } });
  if (!media || (media.ownerId && !(await canView(media.ownerId)))) return new Response("Tidak ditemukan", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(media.size),
      "Cache-Control": media.ownerId ? "private, no-store" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
