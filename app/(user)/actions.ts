"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PHONE_RE, str, type FormState } from "@/lib/form";
import { hashPassword, verifyPassword } from "@/lib/password";

// Peserta memperbarui nama, no. HP, dan instansi. Email adalah identitas login sehingga tidak bisa diubah di sini.
export async function updateProfile(_prev: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(f, "name");
  const phone = str(f, "phone");
  const organization = str(f, "organization");
  if (!name) return { ok: false, message: "Nama wajib diisi." };
  if (name.length > 100 || organization.length > 150) return { ok: false, message: "Nama atau instansi terlalu panjang." };
  if (phone && !PHONE_RE.test(phone)) return { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." };

  await db.user.update({ where: { id: user.id }, data: { name, phone: phone || null, organization: organization || null } });
  revalidatePath("/akun");
  return { ok: true, message: "Profil tersimpan." };
}

// Hanya pendaftaran yang masih menunggu yang bisa dibatalkan sendiri. Yang sudah disetujui: hubungi panitia.
export async function cancelRegistration(registrationId: string) {
  const user = await requireUser();
  await db.registration.deleteMany({ where: { id: registrationId, userId: user.id, status: "pending" } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Peserta mengganti password, atau membuat password pertama bila selama ini hanya memakai Google.
export async function changeUserPassword(_prev: FormState, f: FormData): Promise<FormState> {
  const session = await requireUser();
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) return { ok: false, message: "Akun tidak ditemukan." };
  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  if (user.passwordHash) {
    if (!verifyPassword(current, user.passwordHash)) return { ok: false, message: "Password lama salah." };
    if (next === current) return { ok: false, message: "Password baru harus berbeda dari yang lama." };
  } else if (!user.emailVerified) {
    // Tanpa password dan tanpa bukti kepemilikan email (Google): jangan izinkan membuat password.
    return { ok: false, message: "Masuk dengan Google sekali untuk memverifikasi email sebelum membuat password." };
  }
  if (next.length < 8) return { ok: false, message: "Password baru minimal 8 karakter." };
  if (next !== String(f.get("confirm") ?? "")) return { ok: false, message: "Konfirmasi password baru tidak sama." };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(next), failedLogins: 0, lockedUntil: null } });
  return {
    ok: true,
    message: user.passwordHash ? "Password berhasil diganti." : "Password dibuat. Sekarang Anda juga bisa masuk dengan email dan password.",
  };
}
