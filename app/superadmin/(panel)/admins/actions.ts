"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { PHONE_RE, str, type FormState } from "@/lib/form";
import { hashPassword } from "@/lib/password";

// Data tim: jabatan, No. HP, dan tugas (satu per baris). Relawan diperlakukan sama dengan panitia.
function readTeam(f: FormData) {
  const phone = str(f, "phone");
  if (phone && !PHONE_RE.test(phone)) return "No. HP hanya angka (boleh diawali +), 8–20 digit.";
  const duties = str(f, "duties")
    .split(/\r?\n/)
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join("\n");
  return {
    position: str(f, "position").slice(0, 80),
    phone: phone || null,
    duties,
  };
}

export async function createAdmin(_prev: string | null, f: FormData) {
  const me = await requireAdmin("superadmin");
  const name = String(f.get("name") ?? "").trim();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const password = String(f.get("password") ?? "");
  const role = f.get("role") === "superadmin" ? "superadmin" : "scanner";
  const eventIds = f.getAll("events").map(String);
  if (!name || !email) return "Nama dan email wajib diisi.";
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (await db.admin.findUnique({ where: { email } })) return "Email sudah terdaftar sebagai admin.";

  const team = readTeam(f);
  if (typeof team === "string") return team;
  await db.admin.create({
    data: { name, email, role, passwordHash: hashPassword(password), ...team, events: { connect: eventIds.map((id) => ({ id })) } },
  });
  await audit(me, "Tambah admin", `${email} (${role})`);
  revalidatePath("/superadmin/admins");
  return null;
}

export async function setAdminEvents(adminId: string, f: FormData) {
  const me = await requireAdmin("superadmin");
  const eventIds = f.getAll("events").map(String);
  await db.admin.update({ where: { id: adminId }, data: { events: { set: eventIds.map((id) => ({ id })) } } });
  await audit(me, "Ubah penugasan panitia", `${adminId} → ${eventIds.length} event`);
  revalidatePath("/superadmin/admins");
}

// Anggota tim yang sudah pernah memindai tidak dihapus agar riwayat scan tetap utuh; nonaktifkan saja.
export async function deleteAdmin(adminId: string) {
  const me = await requireAdmin("superadmin");
  if (me.id === adminId) return;
  const target = await db.admin.findUnique({ where: { id: adminId }, include: { _count: { select: { scans: true } } } });
  if (!target || target._count.scans > 0) return;
  await db.admin.delete({ where: { id: adminId } });
  await audit(me, "Hapus anggota tim", `${target.name} (${target.email})`);
  revalidatePath("/superadmin/admins");
}

export async function toggleAdmin(adminId: string) {
  const me = await requireAdmin("superadmin");
  if (me.id === adminId) return; // jangan menonaktifkan diri sendiri
  const target = await db.admin.findUniqueOrThrow({ where: { id: adminId } });
  await db.admin.update({ where: { id: adminId }, data: { active: !target.active, failedLogins: 0, lockedUntil: null } });
  await audit(me, target.active ? "Nonaktifkan admin" : "Aktifkan admin", target.email);
  revalidatePath("/superadmin/admins");
}

// Superadmin mengatur password baru untuk admin lain (lupa password). Kunci akun ikut dibuka.
export async function resetAdminPassword(adminId: string, _prev: FormState, f: FormData): Promise<FormState> {
  const me = await requireAdmin("superadmin");
  if (me.id === adminId) return { ok: false, message: "Ganti password Anda sendiri di menu Akun." };
  const password = String(f.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: "Minimal 8 karakter." };
  const target = await db.admin.update({
    where: { id: adminId },
    data: { passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null },
  });
  await audit(me, "Reset password admin", target.email);
  return { ok: true, message: "Password diganti. Beri tahu yang bersangkutan." };
}

// Superadmin mengubah data tim seorang admin/panitia (nama, jabatan, No. HP, tugas).
export async function updateTeamProfile(adminId: string, _prev: FormState, f: FormData): Promise<FormState> {
  const me = await requireAdmin("superadmin");
  const name = str(f, "name");
  if (!name) return { ok: false, message: "Nama wajib diisi." };
  const team = readTeam(f);
  if (typeof team === "string") return { ok: false, message: team };
  const target = await db.admin.update({ where: { id: adminId }, data: { name, ...team } });
  await audit(me, "Ubah data tim", target.email);
  revalidatePath("/superadmin/admins");
  return { ok: true, message: "Tersimpan." };
}
