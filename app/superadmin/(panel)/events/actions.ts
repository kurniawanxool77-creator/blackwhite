"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtRp } from "@/lib/format";
import { audit } from "@/lib/audit";
import { digits, str } from "@/lib/form";
import { MAX_GALLERY } from "@/lib/gallery";
import { cleanFields } from "@/lib/registration-form";
import { ACTIVITIES, isActivity, isEventType, type ActivityKey } from "@/lib/event-types";
import { cleanPrefix } from "@/lib/participant-code";
import { isImageUrl } from "@/lib/url";

const refresh = (eventId: string) => revalidatePath(`/superadmin/events/${eventId}`);

// Field yang sama untuk buat dan ubah event/pelatihan. Mengembalikan pesan error atau data.
function readEvent(f: FormData) {
  const name = str(f, "name");
  const location = str(f, "location");
  const startDate = new Date(str(f, "startDate"));
  const endDate = new Date(str(f, "endDate"));
  if (!name || !location || isNaN(+startDate) || isNaN(+endDate)) return "Nama, lokasi, dan tanggal wajib diisi.";
  if (endDate < startDate) return "Tanggal selesai tidak boleh sebelum tanggal mulai.";
  if (str(f, "coverUrl") && !isImageUrl(str(f, "coverUrl"))) return "Foto sampul tidak valid. Unggah ulang gambarnya.";
  const type = isEventType(str(f, "type")) ? str(f, "type") : "event";
  const registrationEnd = str(f, "registrationEnd") ? new Date(str(f, "registrationEnd")) : null;
  if (registrationEnd && isNaN(+registrationEnd)) return "Batas pendaftaran tidak valid.";
  if (registrationEnd && registrationEnd > endDate) return "Batas pendaftaran tidak boleh setelah event selesai.";
  const codePrefix = f.get("useCode") === "on" ? cleanPrefix(str(f, "codePrefix")) : "";
  if (f.get("useCode") === "on" && !codePrefix) return "Isi awalan nomor peserta, mis. RUN.";
  return {
    name,
    location,
    startDate,
    endDate,
    category: str(f, "category"),
    coverUrl: str(f, "coverUrl") || null,
    gallery: JSON.stringify(f.getAll("gallery").map(String).filter(isImageUrl).slice(0, MAX_GALLERY)),
    price: digits(f, "price"),
    discount: Math.min(100, digits(f, "discount")),
    quota: digits(f, "quota") || null,
    description: str(f, "description"),
    type,
    // Pelatihan video: selalu online, tanpa QR; kelulusan dari video + kuis.
    mode: type === "course" ? "online" : ["online", "hybrid"].includes(str(f, "mode")) ? str(f, "mode") : "offline",
    useQr: type === "course" ? false : f.get("useQr") === "on",
    // Pengaturan pendaftaran
    autoApprove: str(f, "approval") === "auto",
    registrationEnd,
    codePrefix,
  };
}

// Formulir pendaftaran per pelatihan (disusun di FormBuilder). Disimpan terpisah dari info event.
export async function saveFormFields(eventId: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  let raw: unknown = [];
  try {
    raw = JSON.parse(str(f, "formFields") || "[]");
  } catch {
    return "Data formulir tidak valid.";
  }
  const fields = cleanFields(raw);
  const event = await db.event.update({ where: { id: eventId }, data: { formFields: JSON.stringify(fields) } });
  await audit(admin, "Ubah formulir pendaftaran", `${event.name} · ${fields.length} isian`);
  refresh(eventId);
  revalidatePath(`/event/${event.slug}`);
  return "Tersimpan.";
}

export async function createEvent(_prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readEvent(f);
  if (typeof data === "string") return data;

  const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  const isCourse = data.type === "course";
  // Template kegiatan (lari, sepeda, seminar, ...): formulir dan rundown awal, bisa diubah setelah dibuat.
  const tpl = ACTIVITIES[isActivity(str(f, "activity")) ? (str(f, "activity") as ActivityKey) : "kosong"];
  const event = await db.event.create({
    data: {
      ...data,
      slug: `${base}-${randomBytes(3).toString("hex")}`,
      certificate: isCourse, // pelatihan video: sertifikat aktif sejak awal
      formFields: !isCourse && f.get("useForm") ? JSON.stringify(tpl.fields) : "[]",
      // Rundown template: tanggal dihitung dari tanggal mulai event (hari ke-0 = hari pertama, -1 = H-1).
      checkpoints:
        !isCourse && f.get("useRundown")
          ? {
              create: tpl.rundown.map(([name, kind, scan, dayOffset, startTime, endTime, place, description], i) => ({
                name, kind, scan, startTime, endTime, place, description, order: i + 1,
                date: new Date(+data.startDate + dayOffset * 864e5),
              })),
            }
          : undefined,
    },
  });
  await audit(admin, "Buat event", `${event.name} · ${fmtRp(event.price)} · diskon ${event.discount}%`);
  redirect(`/superadmin/events/${event.id}`);
}

export async function updateEvent(eventId: string, _prev: string | null, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const data = readEvent(f);
  if (typeof data === "string") return data;
  const event = await db.event.update({ where: { id: eventId }, data });
  await audit(admin, "Ubah event", `${event.name} · ${fmtRp(event.price)} · diskon ${event.discount}%`);
  refresh(eventId);
  revalidatePath(`/event/${event.slug}`);
  return "Tersimpan.";
}

// Panitia yang ditugaskan di event ini (hanya akun panitia/relawan, bukan superadmin).
export async function setEventAdmins(eventId: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const ids = f.getAll("admins").map(String);
  const valid = await db.admin.findMany({ where: { id: { in: ids }, role: "scanner" }, select: { id: true, name: true } });
  const event = await db.event.update({ where: { id: eventId }, data: { admins: { set: valid.map((a) => ({ id: a.id })) } } });
  await audit(admin, "Atur panitia event", `${event.name} · ${valid.map((a) => a.name).join(", ") || "tanpa panitia"}`);
  refresh(eventId);
}

export async function setEventStatus(eventId: string, f: FormData) {
  const admin = await requireAdmin("superadmin");
  const status = str(f, "status");
  if (!["draft", "open", "closed", "done"].includes(status)) return;
  const event = await db.event.update({ where: { id: eventId }, data: { status } });
  await audit(admin, "Ubah status event", `${event.name} → ${status}`);
  refresh(eventId);
}

// Hapus event beserta rundown, pendaftaran, riwayat scan, materi, dan sertifikatnya (konfirmasi di tombol).
// Transaksi keuangan event ini tetap tersimpan sebagai transaksi umum.
export async function deleteEvent(eventId: string) {
  const admin = await requireAdmin("superadmin");
  const event = await db.event.findUnique({ where: { id: eventId }, include: { _count: { select: { registrations: true } } } });
  if (!event) return;
  await db.event.delete({ where: { id: eventId } });
  await audit(admin, "Hapus event", `${event.name} · ${event._count.registrations} pendaftaran ikut terhapus`);
  revalidatePath("/superadmin/events");
  redirect("/superadmin/events");
}
