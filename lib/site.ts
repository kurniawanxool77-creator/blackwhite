import { db } from "./db";
import { DEFAULT_SITE, parseBanks, type BankAccount, type Site } from "./site-defaults";

export { DEFAULT_SITE, parseBanks, type BankAccount, type Site };

export async function getSite(): Promise<Site> {
  try {
    const row = await db.setting.findUnique({ where: { key: "site" } });
    return row ? { ...DEFAULT_SITE, ...JSON.parse(row.value) } : DEFAULT_SITE;
  } catch (err) {
    // Saat build tanpa DB aktif atau DB baru belum di-push, pakai nilai bawaan agar prerender tidak gagal.
    console.error("[getSite] fallback ke DEFAULT_SITE:", err instanceof Error ? err.message : err);
    return DEFAULT_SITE;
  }
}
