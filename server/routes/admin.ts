import type { IncomingMessage, ServerResponse } from "node:http";
import { requireAdmin } from "../auth";
import { matchPath, parseUrl, sendJson } from "../http";
import { isOnDuty, myAttendanceToday } from "@/lib/attendance";
import { canUndoScan, greetingJakarta, todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { getEventDetail } from "@/lib/event-detail";
import { getParticipant } from "@/lib/participant";
import { answersIn, answersMatching, healthAlerts, readDetails } from "@/lib/registration-form";
import { scanEvent, scanEvents } from "@/lib/scan-flow";
import { shuttleManifest } from "@/lib/shuttle";
import { getMemberDetail } from "@/lib/team";

const MEMBER_SELECT = { id: true, name: true, email: true, role: true, position: true, phone: true, image: true, duties: true } as const;
export const SAFE_USER = { id: true, name: true, email: true, phone: true, organization: true, image: true } as const;
const EMERGENCY_CONTACTS = [
  { role: "Tim Medis & First Aid Lapangan", name: "dr. Hendra / Posko Medis", phone: "+62 811 2345 6789", type: "medis" },
  { role: "Layanan Ambulans Gawat Darurat", name: "Unit Ambulans Reaksi Cepat", phone: "119", type: "ambulance" },
  { role: "Rumah Sakit Rujukan Terdekat", name: "IGD RSUP Kariadi / Telogorejo", phone: "(024) 8413476", type: "hospital" },
  { role: "Koordinator Keamanan & Panitia", name: "Bambang (Ketua Lapangan)", phone: "+62 812 9988 7766", type: "security" },
  { role: "Kepolisian Wilayah", name: "Polsek Setempat", phone: "110", type: "police" },
];

function stripParticipantUser<T extends { user: Record<string, unknown> }>(reg: T) {
  const { id, name, email, phone, organization, image } = reg.user as Record<string, unknown>;
  return { ...reg, user: { id, name, email, phone, organization, image } };
}

export async function handleAdmin(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/admin/dashboard") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const [events, recentScans, totalScansByAdmin, attendanceToday] = await Promise.all([
      db.event.findMany({
        where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
        include: {
          checkpoints: { where: { scan: true }, orderBy: { order: "asc" }, include: { _count: { select: { scans: true } } } },
          registrations: { where: { status: "approved" }, include: { user: { select: SAFE_USER }, _count: { select: { scans: true } } } },
        },
        orderBy: { startDate: "asc" },
      }),
      db.scan.findMany({
        where: { adminId: admin.id },
        include: { registration: { include: { user: { select: SAFE_USER } } }, checkpoint: { select: { name: true, event: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.scan.count({ where: { adminId: admin.id } }),
      myAttendanceToday(admin.id),
    ]);
    sendJson(res, { greeting: greetingJakarta(), events, recentScans, totalScansByAdmin, attendanceToday });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/attendance") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const [attendanceToday, rows] = await Promise.all([
      myAttendanceToday(admin.id),
      db.attendance.findMany({
        where: { adminId: admin.id },
        include: { event: { select: { name: true } } },
        orderBy: [{ date: "desc" }, { checkIn: "desc" }],
        take: 60,
      }),
    ]);
    sendJson(res, { attendanceToday, rows });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/events") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const [events, duty] = await Promise.all([
      db.event.findMany({
        where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
        include: { _count: { select: { checkpoints: { where: { scan: true } }, registrations: { where: { status: "approved" } } } } },
        orderBy: { startDate: "asc" },
      }),
      db.attendance.findMany({ where: { adminId: admin.id, date: todayKeyJakarta(), checkOut: null }, select: { eventId: true } }),
    ]);
    sendJson(res, { events, onDutyEventIds: duty.map((a) => a.eventId) });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/account") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    const { passwordHash: _pw, ...safeAdmin } = admin;
    sendJson(res, { admin: safeAdmin });
    return true;
  }

  const adminScanCp = method === "GET" ? matchPath("/api/admin/events/:id/scan/:cpId", pathname) : null;
  if (adminScanCp) {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const event = await scanEvent(admin, adminScanCp.id);
    const idx = event?.checkpoints.findIndex((c) => c.id === adminScanCp.cpId) ?? -1;
    const checkpoint = idx >= 0 && event ? { ...event.checkpoints[idx], number: idx + 1 } : null;
    if (!event || !checkpoint || !checkpoint.scan) {
      return sendJson(res, { error: "Pos scan tidak ditemukan." }, 404), true;
    }
    const [onDuty, scannedCount, recent] = await Promise.all([
      admin.role === "superadmin" ? Promise.resolve(true) : isOnDuty(admin.id, event.id),
      db.scan.count({ where: { checkpointId: checkpoint.id } }),
      db.scan.findMany({
        where: { checkpointId: checkpoint.id },
        include: { registration: { include: { user: { select: SAFE_USER } } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);
    sendJson(res, { event, checkpoint, onDuty, scannedCount, recent });
    return true;
  }

  const adminScanPick = method === "GET" ? matchPath("/api/admin/events/:id/scan", pathname) : null;
  if (adminScanPick) {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const event = await scanEvent(admin, adminScanPick.id);
    if (!event) return sendJson(res, { error: "Event tidak ditemukan." }, 404), true;
    const onDuty = admin.role === "superadmin" ? true : await isOnDuty(admin.id, event.id);
    sendJson(res, { event, onDuty });
    return true;
  }

  const adminParticipant = method === "GET" ? matchPath("/api/admin/events/:id/participant/:regId", pathname) : null;
  if (adminParticipant) {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const viewerScope = admin.role === "superadmin" ? undefined : admin.id;
    const reg = await getParticipant(adminParticipant.id, adminParticipant.regId, viewerScope);
    if (!reg) return sendJson(res, { error: "Peserta tidak ditemukan." }, 404), true;
    const locked = admin.role === "superadmin" ? false : !(await isOnDuty(admin.id, adminParticipant.id));
    sendJson(res, { reg: stripParticipantUser(reg), locked });
    return true;
  }

  const adminEventDetail = method === "GET" ? matchPath("/api/admin/events/:id", pathname) : null;
  if (adminEventDetail) {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const sp = parseUrl(req).searchParams;
    const filter = sp.get("status") || "approved";
    const q = sp.get("q")?.trim().slice(0, 80) || undefined;
    const data = await getEventDetail(adminEventDetail.id, filter, admin.id, q);
    if (!data) return sendJson(res, { error: "Event tidak ditemukan." }, 404), true;
    const [routes, onDuty] = await Promise.all([shuttleManifest(data.event.id), isOnDuty(admin.id, data.event.id)]);
    sendJson(res, {
      event: data.event,
      registrations: data.registrations.map(stripParticipantUser),
      counts: data.counts,
      eligible: data.eligible,
      routes,
      onDuty,
    });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/scan") {
    const admin = await requireAdmin(req, res);
    if (!admin) return true;
    sendJson(res, { events: await scanEvents(admin), role: admin.role });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/materi") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const events = await db.event.findMany({
      where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
      orderBy: { startDate: "asc" },
      include: {
        lessons: { orderBy: { order: "asc" } },
        _count: { select: { questions: true, registrations: { where: { certificateNo: { not: null } } } } },
      },
    });
    sendJson(res, { events });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/peserta") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const registrations = await db.registration.findMany({
      where: { event: { admins: { some: { id: admin.id } } }, status: "approved" },
      include: {
        user: { select: SAFE_USER },
        event: { include: { checkpoints: { where: { scan: true }, orderBy: { order: "asc" } } } },
        scans: { include: { checkpoint: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    sendJson(res, { registrations });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/riwayat") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const mine = parseUrl(req).searchParams.get("oleh") === "saya";
    const scans = await db.scan.findMany({
      where: mine ? { adminId: admin.id } : { checkpoint: { event: { admins: { some: { id: admin.id } } } } },
      include: {
        admin: { select: { name: true } },
        registration: { include: { user: { select: SAFE_USER } } },
        checkpoint: { include: { event: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    sendJson(res, {
      scans: scans.map((s) => ({ ...s, canUndo: canUndoScan(admin, s) })),
    });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/rundown") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const events = await db.event.findMany({
      where: { admins: { some: { id: admin.id } }, status: { not: "draft" } },
      include: {
        checkpoints: { orderBy: { order: "asc" }, include: { _count: { select: { scans: true } } } },
        _count: { select: { registrations: { where: { status: "approved" } } } },
      },
      orderBy: { startDate: "asc" },
    });
    sendJson(res, { events });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/darurat") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const registrations = await db.registration.findMany({
      where: { event: { admins: { some: { id: admin.id } } }, status: "approved" },
      include: { user: { select: SAFE_USER }, event: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    const medicalAlerts = registrations
      .map((r) => {
        const details = readDetails(r.details);
        const health = healthAlerts(details).filter((x) => x.type !== "file").map((x) => x.value).join(" · ");
        const contact = answersIn(details, "darurat").map((x) => x.value).join(" · ");
        return {
          id: r.id,
          user: r.user,
          eventName: r.event.name,
          health,
          healthNotes: [health, contact && !health.includes(contact) && `Kontak darurat: ${contact}`].filter(Boolean).join(" · "),
          address: answersMatching(details, /alamat|domisili/i),
        };
      })
      .filter((item) => item.health && !/tidak ada riwayat/i.test(item.health));
    sendJson(res, { contacts: EMERGENCY_CONTACTS, medicalAlerts });
    return true;
  }

  if (method === "GET" && pathname === "/api/admin/tim") {
    const admin = await requireAdmin(req, res, "scanner");
    if (!admin) return true;
    const today = todayKeyJakarta();
    const [events, superadmins, attendance] = await Promise.all([
      db.event.findMany({
        where: { admins: { some: { id: admin.id } }, status: { not: "done" } },
        include: { admins: { where: { active: true }, select: MEMBER_SELECT, orderBy: { name: "asc" } } },
        orderBy: { startDate: "asc" },
      }),
      db.admin.findMany({ where: { role: "superadmin", active: true }, select: MEMBER_SELECT, orderBy: { name: "asc" } }),
      db.attendance.findMany({ where: { date: today, event: { admins: { some: { id: admin.id } } } } }),
    ]);
    sendJson(res, { events, superadmins, attendance });
    return true;
  }

  const memberParams = method === "GET" ? matchPath("/api/admin/tim/:id", pathname) : null;
  if (memberParams) {
    const viewer = await requireAdmin(req, res);
    if (!viewer) return true;
    const detail = await getMemberDetail(memberParams.id, viewer);
    if (!detail) return sendJson(res, { error: "Anggota tidak ditemukan." }, 404), true;
    sendJson(res, { detail });
    return true;
  }

  return false;
}
