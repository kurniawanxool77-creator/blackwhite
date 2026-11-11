import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, sniffImageType, toWebp } from "@/lib/media";

// Batas unggahan per peserta per jam agar database tidak dibanjiri (per proses server; cukup untuk satu instance).
const MAX_PER_HOUR = 30;
const uploads = new Map<string, number[]>();

function allow(userId: string) {
  const since = Date.now() - 3600e3;
  const recent = (uploads.get(userId) ?? []).filter((t) => t > since);
  if (recent.length >= MAX_PER_HOUR) return false;
  uploads.set(userId, [...recent, Date.now()]);
  return true;
}

// Foto untuk isian formulir pendaftaran (mis. KTP, foto sepeda). Hanya peserta yang login.
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.user.role !== "user") return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (!allow(session.user.id)) return Response.json({ error: "Terlalu banyak unggahan. Coba lagi nanti." }, { status: 429 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Ukuran foto maksimal 4 MB." }, { status: 413 });
  const original = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(original)) return Response.json({ error: "Format harus JPEG, PNG, atau WebP." }, { status: 415 });

  let webp: Buffer;
  try {
    webp = await toWebp(original);
  } catch {
    return Response.json({ error: "Foto rusak atau terlalu besar untuk diproses." }, { status: 422 });
  }
  const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length, ownerId: session.user.id } });
  return Response.json({ url: `/media/${media.id}` });
}
