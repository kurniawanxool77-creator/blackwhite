import { getActiveAdmin, getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, sniffImageType, toAvatarWebp } from "@/lib/media";

// Foto profil milik sendiri: peserta, panitia, atau superadmin. Foto lama (unggahan) dihapus agar tidak menumpuk.
export async function POST(req: Request) {
  const session = await getSession();
  const admin = session?.user.role === "user" ? null : await getActiveAdmin();
  if (session?.user.role !== "user" && !admin) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "File tidak ditemukan." }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return Response.json({ error: "Ukuran foto maksimal 4 MB." }, { status: 413 });
  const original = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(original)) return Response.json({ error: "Format harus JPEG, PNG, atau WebP." }, { status: 415 });

  let webp: Buffer;
  try {
    webp = await toAvatarWebp(original);
  } catch {
    return Response.json({ error: "Foto rusak atau terlalu besar untuk diproses." }, { status: 422 });
  }

  const owner = admin
    ? await db.admin.findUnique({ where: { id: admin.id }, select: { image: true } })
    : await db.user.findUnique({ where: { id: session!.user.id }, select: { image: true } });
  if (!owner) return Response.json({ error: "Akun tidak ditemukan." }, { status: 404 });
  const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length } });
  const url = `/media/${media.id}`;
  if (admin) await db.admin.update({ where: { id: admin.id }, data: { image: url } });
  else await db.user.update({ where: { id: session!.user.id }, data: { image: url } });
  const oldId = owner.image?.match(/^\/media\/([a-z0-9]+)$/i)?.[1];
  if (oldId) await db.media.deleteMany({ where: { id: oldId } });
  return Response.json({ url });
}
