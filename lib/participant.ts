import { db } from "./db";

// Satu pendaftaran lengkap dengan checkpoint dan riwayat scan. adminId diisi = hanya event yang ditugaskan ke panitia itu.
export function getParticipant(eventId: string, registrationId: string, adminId?: string) {
  return db.registration.findFirst({
    where: { id: registrationId, eventId, ...(adminId ? { event: { admins: { some: { id: adminId } } } } : {}) },
    include: {
      user: true,
      event: { include: { checkpoints: { orderBy: { order: "asc" } } } }, // seluruh rundown; disaring per peserta di ParticipantRundown
      scans: { include: { admin: { select: { name: true } } } },
    },
  });
}

export type Participant = NonNullable<Awaited<ReturnType<typeof getParticipant>>>;
