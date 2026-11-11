import { db, LIVE_KEY } from "@/lib/db";

export const dynamic = "force-dynamic";

// Hanya penanda versi, tanpa data: aman untuk publik. s-maxage=3 membuat CDN Vercel menjawab sebagian besar
// pertanyaan LiveSync, sehingga database dibaca paling sering sekali per 3 detik, berapa pun jumlah tab yang terbuka.
export async function GET() {
  const row = await db.setting.findUnique({ where: { key: LIVE_KEY } }).catch(() => null);
  return Response.json({ v: row?.value ?? "0" }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=3" } });
}
