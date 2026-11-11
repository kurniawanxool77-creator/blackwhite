"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { str } from "@/lib/form";

const refresh = () => {
  revalidatePath("/superadmin/kategori");
  revalidatePath("/superadmin/events");
  revalidatePath("/");
  revalidatePath("/event");
  revalidatePath("/dashboard");
};

export async function createCategory(_prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const name = str(f, "name").slice(0, 60);
  if (!name) return "Nama kategori wajib diisi.";
  if (await db.category.findUnique({ where: { name } })) return "Kategori sudah ada.";
  await db.category.create({ data: { name, description: str(f, "description").slice(0, 200) } });
  await audit(admin, "Tambah kategori", name);
  refresh();
  return null;
}

// Ganti nama juga memperbarui semua event yang memakai kategori itu.
export async function updateCategory(id: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const name = str(f, "name").slice(0, 60);
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return "Kategori tidak ditemukan.";
  if (!name) return "Nama kategori wajib diisi.";
  if (name !== cat.name && (await db.category.findUnique({ where: { name } }))) return "Nama kategori sudah dipakai.";
  await db.$transaction([
    db.category.update({ where: { id }, data: { name, description: str(f, "description").slice(0, 200) } }),
    db.event.updateMany({ where: { category: cat.name }, data: { category: name } }),
  ]);
  await audit(admin, "Ubah kategori", cat.name === name ? name : `${cat.name} → ${name}`);
  refresh();
  return null;
}

// Hapus kategori; event yang memakainya menjadi "Tanpa kategori" (tidak ikut terhapus).
export async function deleteCategory(id: string) {
  const admin = await requireAdmin("superadmin");
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return;
  const [moved] = await db.$transaction([
    db.event.updateMany({ where: { category: cat.name }, data: { category: "" } }),
    db.category.delete({ where: { id } }),
  ]);
  await audit(admin, "Hapus kategori", `${cat.name} · ${moved.count} event jadi tanpa kategori`);
  refresh();
}
