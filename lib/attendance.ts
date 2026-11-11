import { attendanceStatus, dayStart, isDateKey, type AttendanceStatus } from "./schedule";
import { todayKeyJakarta } from "./checkin";
import { db } from "./db";

export { attendanceStatus, dayStart, isDateKey, type AttendanceStatus };

// Pelatihan yang berlangsung pada tanggal itu. adminId diisi = hanya yang ditugaskan ke orang itu.
export function eventsOnDate(date: string, adminId?: string) {
  const d = dayStart(date);
  return db.event.findMany({
    where: {
      status: { in: ["open", "closed"] },
      startDate: { lte: d },
      endDate: { gte: d },
      ...(adminId ? { admins: { some: { id: adminId } } } : {}),
    },
    orderBy: { startDate: "asc" },
  });
}

// Absensi hari ini milik seorang anggota tim, per pelatihan yang berlangsung.
export async function myAttendanceToday(adminId: string) {
  const date = todayKeyJakarta();
  const events = await eventsOnDate(date, adminId);
  const rows = await db.attendance.findMany({ where: { adminId, date } });
  return { date, items: events.map((event) => ({ event, row: rows.find((r) => r.eventId === event.id) ?? null })) };
}

// attendanceStatus re-exported from ./schedule

// Sedang bertugas: sudah absen datang hari ini di pelatihan itu dan belum absen selesai. Syarat membuka fitur event.
export async function isOnDuty(adminId: string, eventId: string) {
  return (await db.attendance.count({ where: { adminId, eventId, date: todayKeyJakarta(), checkOut: null } })) > 0;
}

// Menghasilkan daftar tanggal (YYYY-MM-DD) lengkap dari mulai sampai selesai
export function getEventDateKeys(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const sk = new Date(startDate).toISOString().slice(0, 10);
  const ek = new Date(endDate).toISOString().slice(0, 10);
  let d = new Date(`${sk}T00:00:00.000Z`);
  const stop = new Date(`${ek}T00:00:00.000Z`);
  while (d <= stop) {
    dates.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 86_400_000);
  }
  return dates.length > 0 ? dates : [sk];
}

export type AttendanceRowData = {
  id: string;
  adminId: string;
  eventId: string;
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
};

export type DayReport = {
  dateKey: string;
  dayNumber: number;
  label: string; // mis. "Jumat, 6 Nov 2026"
  shortLabel: string; // mis. "Hari 1 (6 Nov)"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  presentCount: number;
  totalTeamCount: number;
};

export type MemberAttendanceRow = {
  admin: {
    id: string;
    name: string;
    position: string;
    image: string | null;
    email: string;
  };
  attendanceByDate: Record<string, AttendanceRowData | null>;
  presentDays: number;
  totalWorkMs: number;
  formattedWork: string;
};

export type EventAttendanceReport = {
  event: {
    id: string;
    name: string;
    slug: string;
    category: string;
    mode: string;
    location: string;
    status: string;
    startDate: Date;
    endDate: Date;
    type: string;
  };
  days: DayReport[];
  members: MemberAttendanceRow[];
  summary: {
    totalDays: number;
    totalTeam: number;
    totalMandays: number;
    totalPresent: number;
    attendanceRate: number;
    totalWorkMs: number;
    formattedTotalWork: string;
  };
};

// Rekapitulasi absensi tim per event dari mulai sampai selesai
export async function getEventAttendanceReport(eventId: string): Promise<EventAttendanceReport | null> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      admins: {
        where: { active: true },
        select: { id: true, name: true, position: true, image: true, email: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!event) return null;

  const dateKeys = getEventDateKeys(event.startDate, event.endDate);
  const rows = await db.attendance.findMany({
    where: {
      eventId: event.id,
      date: { in: dateKeys },
    },
    include: {
      admin: { select: { id: true, name: true, position: true, image: true, email: true } },
    },
  });

  const today = todayKeyJakarta();

  // Gabungkan admin yang ditugaskan ke event + admin yang memiliki log absensi
  const adminMap = new Map<string, { id: string; name: string; position: string; image: string | null; email: string }>();
  for (const a of event.admins) adminMap.set(a.id, a);
  for (const r of rows) {
    if (r.admin && !adminMap.has(r.admin.id)) {
      adminMap.set(r.admin.id, r.admin);
    }
  }
  const admins = Array.from(adminMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const days: DayReport[] = dateKeys.map((dateKey, idx) => {
    const d = dayStart(dateKey);
    const dayRows = rows.filter((r) => r.date === dateKey);
    return {
      dateKey,
      dayNumber: idx + 1,
      label: d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      shortLabel: `Hari ${idx + 1} (${d.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" })})`,
      isToday: dateKey === today,
      isPast: dateKey < today,
      isFuture: dateKey > today,
      presentCount: dayRows.length,
      totalTeamCount: admins.length,
    };
  });

  let totalOverallWorkMs = 0;
  let totalOverallPresent = 0;

  const members: MemberAttendanceRow[] = admins.map((admin) => {
    const attendanceByDate: Record<string, AttendanceRowData | null> = {};
    let presentDays = 0;
    let memberWorkMs = 0;

    for (const dk of dateKeys) {
      const match = rows.find((r) => r.adminId === admin.id && r.date === dk) ?? null;
      attendanceByDate[dk] = match
        ? {
            id: match.id,
            adminId: match.adminId,
            eventId: match.eventId,
            date: match.date,
            checkIn: match.checkIn,
            checkOut: match.checkOut,
            checkInPhoto: match.checkInPhoto,
            checkOutPhoto: match.checkOutPhoto,
          }
        : null;

      if (match) {
        presentDays++;
        if (match.checkOut) {
          const dur = Math.max(0, +match.checkOut - +match.checkIn);
          memberWorkMs += dur;
        }
      }
    }

    totalOverallPresent += presentDays;
    totalOverallWorkMs += memberWorkMs;

    const m = Math.max(0, Math.round(memberWorkMs / 60_000));
    const formattedWork = m >= 60 ? `${Math.floor(m / 60)} j ${m % 60} m` : `${m} m`;

    return {
      admin,
      attendanceByDate,
      presentDays,
      totalWorkMs: memberWorkMs,
      formattedWork,
    };
  });

  const totalMandays = dateKeys.length * admins.length;
  const attendanceRate = totalMandays > 0 ? Math.round((totalOverallPresent / totalMandays) * 100) : 0;
  const totalM = Math.max(0, Math.round(totalOverallWorkMs / 60_000));
  const formattedTotalWork = totalM >= 60 ? `${Math.floor(totalM / 60)} j ${totalM % 60} m` : `${totalM} m`;

  return {
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      category: event.category,
      mode: event.mode,
      location: event.location,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
    },
    days,
    members,
    summary: {
      totalDays: dateKeys.length,
      totalTeam: admins.length,
      totalMandays,
      totalPresent: totalOverallPresent,
      attendanceRate,
      totalWorkMs: totalOverallWorkMs,
      formattedTotalWork,
    },
  };
}

