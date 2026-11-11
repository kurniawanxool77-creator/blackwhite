import { randomBytes } from "node:crypto";
import { db } from "./db";

// QR pribadi peserta: satu kode untuk semua pelatihan. Dibuat saat pertama dibutuhkan.
export async function ensureUserQr(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { qrToken: true } });
  if (user.qrToken) return user.qrToken;
  const qrToken = randomBytes(18).toString("base64url");
  await db.user.update({ where: { id: userId }, data: { qrToken } });
  return qrToken;
}

// Hanya item rundown yang perlu scan yang dihitung sebagai checkpoint.
export const scanPoints = <T extends { scan: boolean }>(checkpoints: T[]) => checkpoints.filter((c) => c.scan);
