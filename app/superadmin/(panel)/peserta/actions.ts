"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { str } from "@/lib/form";
import { hashPassword } from "@/lib/password";

export async function createUser(_prev: unknown, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const name = str(f, "name");
  const email = str(f, "email").toLowerCase();
  const phone = str(f, "phone") || null;
  const organization = str(f, "organization") || null;
  const accountType = str(f, "accountType") || "credentials";
  const isGoogle = accountType === "google";
  const password = str(f, "password");

  if (!name || !email) throw new Error("Nama dan email wajib diisi.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Format email tidak valid.");

  if (!isGoogle && (!password || password.length < 6)) {
    throw new Error("Password minimal 6 karakter untuk akun non-Google.");
  }
  if (password && password.length < 6) {
    throw new Error("Password minimal 6 karakter jika diisi.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error(`Email ${email} sudah terdaftar.`);

  const passwordHash = password ? hashPassword(password) : null;
  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      organization,
      passwordHash,
      emailVerified: isGoogle,
    },
  });

  await audit(admin, "Tambah user", `${user.name} (${user.email}) - ${isGoogle ? "Akun Google" : "Manual"}`);
  revalidatePath("/superadmin/peserta");
}

export async function updateUser(userId: string, _prev: unknown, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const name = str(f, "name");
  const email = str(f, "email").toLowerCase();
  const phone = str(f, "phone") || null;
  const organization = str(f, "organization") || null;
  const accountType = str(f, "accountType");
  const password = str(f, "password");

  if (!name || !email) throw new Error("Nama dan email wajib diisi.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Format email tidak valid.");

  const duplicate = await db.user.findFirst({ where: { email, id: { not: userId } } });
  if (duplicate) throw new Error(`Email ${email} sudah digunakan akun lain.`);

  const data: {
    name: string;
    email: string;
    phone: string | null;
    organization: string | null;
    emailVerified?: boolean;
    passwordHash?: string | null;
    failedLogins?: number;
    lockedUntil?: null;
  } = { name, email, phone, organization };

  if (accountType) {
    data.emailVerified = accountType === "google";
  }

  if (password) {
    if (password.length < 6) throw new Error("Password minimal 6 karakter.");
    data.passwordHash = hashPassword(password);
    data.failedLogins = 0;
    data.lockedUntil = null;
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
  });

  await audit(admin, "Ubah data user", `${user.name} (${user.email})`);
  revalidatePath("/superadmin/peserta");
}
