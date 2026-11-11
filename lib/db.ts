import { PrismaClient } from "@prisma/client";

// Baris Setting yang menandai "ada perubahan data". Dibaca oleh /api/live, lalu LiveSync me-refresh layar yang terbuka.
// Disimpan di database (bukan memori) agar tetap benar di Vercel/serverless yang punya banyak instance.
export const LIVE_KEY = "live";

const WRITES = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany"]);

const createClient = () => {
  const base = new PrismaClient();
  // Lewat client dasar (tanpa extension) supaya penulisan penanda tidak memicu dirinya sendiri.
  const bumpLive = () => {
    const value = String(Date.now());
    return base.setting.upsert({ where: { key: LIVE_KEY }, create: { key: LIVE_KEY, value }, update: { value } });
  };
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          const result = await query(args);
          // Gagal menandai tidak boleh menggagalkan penyimpanan data utamanya.
          if (WRITES.has(operation)) await bumpLive().catch(() => {});
          return result;
        },
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

// Simpan instance tunggal di dev HMR maupun warm container produksi agar pool koneksi tidak bocor.
globalForPrisma.prisma = db;
