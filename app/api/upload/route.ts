import { getActiveAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, sniffImageType, toWebp } from "@/lib/media";

// Hanya Superadmin. Tipe file ditentukan dari isi file (bukan nama atau header dari pengunggah).
export async function POST(req: Request) {
  const admin = await getActiveAdmin();
  if (admin?.role !== "superadmin") return Response.json({ error: "Tidak diizinkan." }, { status: 401 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Ukuran gambar maksimal 4 MB." }, { status: 413 });

  const original = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(original)) return Response.json({ error: "Format harus JPEG, PNG, atau WebP." }, { status: 415 });

  let data: Buffer;
  try {
    data = await toWebp(original);
  } catch {
    return Response.json({ error: "Gambar rusak atau terlalu besar untuk diproses." }, { status: 422 });
  }

  const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(data), size: data.length } });
  return Response.json({ url: `/media/${media.id}` });
}
