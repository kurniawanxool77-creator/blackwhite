import { getActiveAdmin } from "@/lib/auth";
import { noticesFor } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Notifikasi lonceng di panel panitia/superadmin; diambil ulang berkala oleh NotificationBell.
export async function GET() {
  const admin = await getActiveAdmin();
  if (!admin) return Response.json({ error: "Tidak diizinkan." }, { status: 401 });
  return Response.json(await noticesFor(admin), { headers: { "Cache-Control": "no-store" } });
}
