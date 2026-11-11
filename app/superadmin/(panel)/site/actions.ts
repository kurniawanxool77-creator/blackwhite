"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { DEFAULT_SITE, type Site } from "@/lib/site";
import { isImageUrl } from "@/lib/url";

const image = (v: string) => (isImageUrl(v) ? v : "");

export async function saveSite(_prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const s = (key: string) => String(f.get(key) ?? "").trim();
  const site: Site = {
    name: s("name") || DEFAULT_SITE.name,
    tagline: s("tagline"),
    about: s("about"),
    heroImage: image(s("heroImage")),
    aboutImage: image(s("aboutImage")),
    loginImage: image(s("loginImage")),
    services: [0, 1, 2]
      .map((i) => ({ title: s(`service${i}Title`), body: s(`service${i}Body`), image: image(s(`service${i}Image`)) }))
      .filter((x) => x.title),
    steps: s("steps").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    contact: { email: s("email"), phone: s("phone"), address: s("address") },
    banks: s("banks").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 10),
  };
  const value = JSON.stringify(site);
  await db.setting.upsert({ where: { key: "site" }, update: { value }, create: { key: "site", value } });
  await audit(admin, "Ubah halaman depan");
  revalidatePath("/", "layout");
  return "Tersimpan. Halaman depan sudah diperbarui.";
}
