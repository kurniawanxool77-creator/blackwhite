import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureUserQr } from "@/lib/qr";

// Gambar QR pribadi peserta (satu QR untuk semua pelatihan) untuk dicetak/dikirim superadmin,
// misalnya peserta yang ditambahkan manual. Hanya untuk pendaftaran yang sudah disetujui.
export async function GET(_req: Request, ctx: RouteContext<"/superadmin/qr/[id]">) {
  await requireAdmin("superadmin");
  const { id } = await ctx.params;
  const reg = await db.registration.findUnique({ where: { id } });
  if (reg?.status !== "approved") return new Response("QR belum terbit", { status: 404 });

  const png = await QRCode.toBuffer(await ensureUserQr(reg.userId), { width: 480, margin: 2 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
