"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { nextCodes, registrationClosed } from "@/lib/participant-code";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PHONE_RE, str } from "@/lib/form";
import { finalPrice } from "@/lib/format";
import { parseFields, readAnswers } from "@/lib/registration-form";
import { shuttleOptions } from "@/lib/shuttle";

export async function registerForEvent(eventId: string, _prev: string | null, formData: FormData) {
  const user = await requireUser();
  const phone = str(formData, "phone");
  if (!PHONE_RE.test(phone)) return "Nomor WhatsApp tidak valid.";

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (event?.status !== "open") return "Pendaftaran untuk event ini sudah ditutup.";
  if (registrationClosed(event)) return "Batas waktu pendaftaran sudah lewat.";
  if (event.quota) {
    const approved = await db.registration.count({ where: { eventId, status: "approved" } });
    if (approved >= event.quota) return "Kuota event sudah penuh.";
  }

  // Jawaban isian formulir yang disusun Superadmin untuk pelatihan ini.
  const existing = await db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId } }, select: { id: true } });
  const routes = await shuttleOptions(eventId, existing?.id);
  const read = readAnswers(parseFields(event.formFields), formData, routes);
  if (typeof read === "string") return read;
  // Kursi shuttle: rute yang sudah penuh tidak bisa dipilih (kursi milik pendaftaran ini sendiri tidak dihitung).
  if (read.shuttleId && routes.find((r) => r.id === read.shuttleId)?.seatsLeft === 0) return "Kursi shuttle di rute ini sudah penuh. Pilih rute lain.";
  // Pelatihan berbayar: wajib bukti transfer (foto) atau nomor referensi sebelum pendaftaran dikirim.
  const total = read.packagePrice ?? finalPrice(event);
  const paymentProof = str(formData, "paymentProof").slice(0, 300);
  const paymentProofUrl = str(formData, "paymentProofUrl");
  if (paymentProofUrl && !/^\/media\/[a-z0-9]+$/i.test(paymentProofUrl)) return "Bukti transfer tidak valid. Unggah ulang.";
  if (total > 0 && !paymentProofUrl && !paymentProof) return "Unggah bukti transfer atau isi nomor referensi transfer.";

  const mediaIds = [...read.answers.filter((a) => a.type === "file").map((a) => a.value), ...(paymentProofUrl ? [paymentProofUrl] : [])].map((v) => v.slice("/media/".length));
  // Hanya foto unggahan peserta ini; ID foto orang lain tidak bisa ditempel ke formulir.
  if (mediaIds.length && (await db.media.count({ where: { id: { in: mediaIds }, ownerId: user.id } })) !== new Set(mediaIds).size) {
    return "Foto tidak ditemukan. Unggah ulang fotonya.";
  }

  const details = JSON.stringify({ answers: read.answers, total, paymentProof, paymentProofUrl: total > 0 ? paymentProofUrl : "" });
  const organization = str(formData, "organization");

  await db.user.update({
    where: { id: user.id },
    data: { phone, ...(organization ? { organization } : {}) },
  });

  const reg = await db.registration.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: { details, shuttleId: read.shuttleId },
    create: { userId: user.id, eventId, details, shuttleId: read.shuttleId },
  });
  // Persetujuan otomatis (diatur Superadmin): langsung disetujui + nomor peserta, selama kuota masih ada.
  if (event.autoApprove && reg.status === "pending") {
    const approved = event.quota ? await db.registration.count({ where: { eventId, status: "approved" } }) : 0;
    if (!event.quota || approved < event.quota) {
      const [code] = await nextCodes(eventId, event.codePrefix, reg.code ? 0 : 1);
      await db.registration.update({
        where: { id: reg.id },
        data: { status: "approved", approvedAt: new Date(), qrToken: randomBytes(18).toString("base64url"), ...(code ? { code } : {}) },
      });
    }
  }

  redirect("/dashboard");
}
