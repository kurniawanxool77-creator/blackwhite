"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/form";
import { isImageUrl, isLinkUrl } from "@/lib/url";

const refresh = () => {
  revalidatePath("/superadmin/banners");
  revalidatePath("/");
};

// Data banner dari form (dipakai tambah dan ubah). Mengembalikan pesan error atau data.
async function readBanner(f: FormData) {
  const title = str(f, "title");
  const imageUrl = str(f, "imageUrl");
  const caption = str(f, "kind") !== "image"; // "image" = gambar saja, tanpa tulisan
  let linkUrl = str(f, "linkUrl");
  if (!title || !imageUrl) return "Judul dan gambar wajib diisi.";
  if (!isImageUrl(imageUrl)) return "Gambar tidak valid. Unggah ulang gambarnya.";
  if (caption) {
    // Iklan pelatihan: tautan diambil dari pelatihan yang dipilih.
    const slug = str(f, "eventSlug");
    const event = slug ? await db.event.findUnique({ where: { slug }, select: { slug: true } }) : null;
    if (slug && !event) return "Pelatihan tidak ditemukan.";
    linkUrl = event ? `/event/${event.slug}` : "";
  } else if (linkUrl && !isLinkUrl(linkUrl)) {
    return "Tautan harus berupa alamat http(s) atau path internal seperti /event/nama-event.";
  }
  return { title, subtitle: caption ? str(f, "subtitle") : "", imageUrl, linkUrl: linkUrl || null, caption };
}

export async function createBanner(_prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = await readBanner(f);
  if (typeof data === "string") return data;
  const last = await db.banner.findFirst({ orderBy: { order: "desc" } });
  await db.banner.create({ data: { ...data, order: (last?.order ?? 0) + 1 } });
  await audit(admin, "Tambah banner", data.title);
  refresh();
  return null;
}

export async function updateBanner(id: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = await readBanner(f);
  if (typeof data === "string") return data;
  await db.banner.update({ where: { id }, data });
  await audit(admin, "Ubah banner", data.title);
  refresh();
  return null;
}

export async function toggleBanner(id: string) {
  const admin = await requireAdmin("superadmin");
  const banner = await db.banner.findUniqueOrThrow({ where: { id } });
  await db.banner.update({ where: { id }, data: { active: !banner.active } });
  await audit(admin, banner.active ? "Sembunyikan banner" : "Tampilkan banner", banner.title);
  refresh();
}

export async function moveBanner(id: string, direction: "up" | "down") {
  await requireAdmin("superadmin");
  const banner = await db.banner.findUniqueOrThrow({ where: { id } });
  const neighbor = await db.banner.findFirst({
    where: { order: direction === "up" ? { lt: banner.order } : { gt: banner.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await db.$transaction([
    db.banner.update({ where: { id: banner.id }, data: { order: neighbor.order } }),
    db.banner.update({ where: { id: neighbor.id }, data: { order: banner.order } }),
  ]);
  refresh();
}

export async function deleteBanner(id: string) {
  const admin = await requireAdmin("superadmin");
  const banner = await db.banner.delete({ where: { id } });
  await audit(admin, "Hapus banner", banner.title);
  refresh();
}
