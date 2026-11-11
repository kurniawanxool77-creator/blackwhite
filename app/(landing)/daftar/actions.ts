"use server";

import { db } from "@/lib/db";
import { PHONE_RE, str, type FormState } from "@/lib/form";
import { hashPassword } from "@/lib/password";

const MIN_PASSWORD = 8; // file "use server" hanya boleh mengekspor fungsi async

// Pendaftaran akun peserta dengan email + password. Setelah berhasil, form langsung memanggil login.
export async function registerUser(_prev: FormState, f: FormData): Promise<FormState> {
  const name = str(f, "name");
  const email = str(f, "email").toLowerCase();
  const phone = str(f, "phone");
  const password = String(f.get("password") ?? "");
  if (!name || name.length > 100) return { ok: false, message: "Nama wajib diisi (maks. 100 karakter)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: "Format email tidak valid." };
  if (!PHONE_RE.test(phone)) return { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." };
  if (password.length < MIN_PASSWORD) return { ok: false, message: `Password minimal ${MIN_PASSWORD} karakter.` };
  if (password !== String(f.get("confirm") ?? "")) return { ok: false, message: "Konfirmasi password tidak sama." };

  // Email yang sudah ada tidak boleh "diambil alih" dengan mendaftar ulang.
  if (await db.user.findUnique({ where: { email } })) {
    return { ok: false, message: "Email ini sudah terdaftar. Silakan masuk, atau gunakan tombol Google bila akun dibuat dengan Google." };
  }
  await db.user.create({ data: { name, email, phone, passwordHash: hashPassword(password) } });
  return { ok: true, message: "Akun dibuat." };
}
