import type { Admin } from "@prisma/client";
import { db } from "./db";

// Detail satu anggota tim. Panitia hanya boleh melihat rekan yang memegang pelatihan yang sama (atau Superadmin);
// pelatihan, absensi, dan scan yang ditampilkan dibatasi ke pelatihan bersama itu. Superadmin melihat semuanya.
export async function getMemberDetail(memberId: string, viewer: Admin) {
  const member = await db.admin.findUnique({
    where: { id: memberId },
    select: { id: true, name: true, email: true, role: true, position: true, phone: true, image: true, duties: true, active: true, createdAt: true },
  });
  if (!member) return null;

  // Dua syarat "admins" harus digabung dengan AND; menyebarkannya ke satu objek membuat yang kedua menimpa yang pertama.
  const events = await db.event.findMany({
    where: {
      AND: [
        { admins: { some: { id: member.id } } },
        ...(viewer.role === "superadmin" ? [] : [{ admins: { some: { id: viewer.id } } }]),
      ],
    },
    select: { id: true, name: true, startDate: true, endDate: true, status: true },
    orderBy: { startDate: "desc" },
  });
  if (viewer.role !== "superadmin" && member.role !== "superadmin" && events.length === 0) return null;

  const eventIds = events.map((e) => e.id);
  const [attendance, scanCount] = await Promise.all([
    db.attendance.findMany({
      where: { adminId: member.id, eventId: { in: eventIds } },
      include: { event: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { checkIn: "desc" }],
      take: 60,
    }),
    db.scan.count({ where: { adminId: member.id, checkpoint: { eventId: { in: eventIds } } } }),
  ]);
  return { member, events, attendance, scanCount };
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>;
