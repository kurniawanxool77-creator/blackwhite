import { Prisma } from "@prisma/client";
import { getActiveAdmin } from "@/lib/auth";
import { isRunning, todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { MAX_IMAGE_BYTES, sniffImageType, toSelfieWebp } from "@/lib/media";

const fail = (error: string, status = 400) => Response.json({ error }, { status });

// Absen datang (type=in) atau selesai acara (type=out) dengan foto selfie wajib.
// Hanya panitia, di pelatihan yang ditugaskan dan sedang berlangsung hari ini; masing-masing sekali per hari.
export async function POST(req: Request) {
  const admin = await getActiveAdmin();
  if (admin?.role !== "scanner") return fail("Hanya untuk panitia.", 401);

  const form = await req.formData();
  const eventId = String(form.get("eventId") ?? "");
  const type = form.get("type") === "out" ? "out" : "in";
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Foto selfie wajib diambil.");
  if (file.size > MAX_IMAGE_BYTES) return fail("Ukuran foto maksimal 4 MB.", 413);

  const event = await db.event.findFirst({ where: { id: eventId, status: { in: ["open", "closed"] }, admins: { some: { id: admin.id } } } });
  if (!event) return fail("Pelatihan tidak ditemukan atau tidak ditugaskan kepada Anda.", 404);
  if (!isRunning(event)) return fail("Absensi hanya bisa pada hari pelatihan berlangsung.");

  const date = todayKeyJakarta();
  const key = { adminId_eventId_date: { adminId: admin.id, eventId, date } };
  const existing = await db.attendance.findUnique({ where: key });
  if (type === "in" && existing) return fail("Anda sudah absen datang hari ini.", 409);
  if (type === "out" && !existing) return fail("Absen datang dulu sebelum absen selesai.", 409);
  if (type === "out" && existing?.checkOut) return fail("Anda sudah absen selesai hari ini.", 409);

  const original = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(original)) return fail("Format foto harus JPEG, PNG, atau WebP.", 415);
  let webp: Buffer;
  try {
    webp = await toSelfieWebp(original);
  } catch {
    return fail("Foto rusak atau terlalu besar untuk diproses.", 422);
  }
  const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length, ownerId: admin.id } });
  const photo = `/media/${media.id}`;

  try {
    if (type === "in") await db.attendance.create({ data: { adminId: admin.id, eventId, date, checkInPhoto: photo } });
    else await db.attendance.update({ where: key, data: { checkOut: new Date(), checkOutPhoto: photo } });
  } catch (e) {
    await db.media.delete({ where: { id: media.id } });
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("Anda sudah absen datang hari ini.", 409);
    throw e;
  }
  return Response.json({ ok: true });
}
