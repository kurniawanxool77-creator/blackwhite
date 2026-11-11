"use server";

import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PHONE_RE, str, type FormState } from "@/lib/form";
import { hashPassword, verifyPassword } from "@/lib/password";

const MIN_PASSWORD = 8; // file "use server" hanya boleh mengekspor fungsi async

// Panitia dan superadmin mengganti password sendiri. Wajib password lama.
export async function changeOwnPassword(_prev: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  if (!verifyPassword(current, admin.passwordHash)) return { ok: false, message: "Password lama salah." };
  if (next.length < MIN_PASSWORD) return { ok: false, message: `Password baru minimal ${MIN_PASSWORD} karakter.` };
  if (next !== String(f.get("confirm") ?? "")) return { ok: false, message: "Konfirmasi password baru tidak sama." };
  if (next === current) return { ok: false, message: "Password baru harus berbeda dari yang lama." };

  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(next) } });
  await audit(admin, "Ganti password sendiri");
  return { ok: true, message: "Password berhasil diganti. Gunakan password baru saat login berikutnya." };
}

// Panitia/superadmin memperbarui No. HP sendiri (tampil di halaman Tim). Jabatan dan tugas diatur Superadmin.
export async function updateOwnContact(_prev: FormState, f: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const phone = str(f, "phone");
  if (phone && !PHONE_RE.test(phone)) return { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." };
  await db.admin.update({ where: { id: admin.id }, data: { phone: phone || null } });
  return { ok: true, message: "No. HP tersimpan." };
}
