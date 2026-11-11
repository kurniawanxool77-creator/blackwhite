// Sekali jalan setelah kolom Media.ownerId ada: foto lama (selfie absensi, foto formulir, bukti transfer) menjadi privat.
// Aman diulang: node --no-warnings --env-file=.env prisma/backfill-media-owner.mjs
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const mediaId = (url) => (typeof url === "string" ? url.match(/^\/media\/([a-z0-9]+)$/i)?.[1] : undefined);

async function markPrivate(ownerId, urls) {
  const ids = urls.map(mediaId).filter(Boolean);
  if (!ids.length) return 0;
  const { count } = await db.media.updateMany({ where: { id: { in: ids }, ownerId: null }, data: { ownerId } });
  return count;
}

function readDetails(json) {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
}

let marked = 0;
for (const a of await db.attendance.findMany({ select: { adminId: true, checkInPhoto: true, checkOutPhoto: true } })) {
  marked += await markPrivate(a.adminId, [a.checkInPhoto, a.checkOutPhoto]);
}
for (const r of await db.registration.findMany({ select: { userId: true, details: true } })) {
  const d = readDetails(r.details);
  const files = Array.isArray(d.answers) ? d.answers.filter((a) => a?.type === "file").map((a) => a.value) : [];
  marked += await markPrivate(r.userId, [...files, d.paymentProofUrl]);
}
console.log(`${marked} foto ditandai privat.`);
await db.$disconnect();
