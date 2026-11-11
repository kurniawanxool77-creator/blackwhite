import type { IncomingMessage, ServerResponse } from "node:http";
import QRCode from "qrcode";
import { requireAdmin } from "../auth";
import { matchPath, parseUrl, sendBinary, sendJson, sendText } from "../http";
import { eventsOnDate, getEventAttendanceReport, isDateKey } from "@/lib/attendance";
import { startOfTodayJakarta, todayKeyJakarta } from "@/lib/checkin";
import { db } from "@/lib/db";
import { getCategories, getEventDetail } from "@/lib/event-detail";
import { financeSummary } from "@/lib/finance";
import { fmtDateTime, REG_STATUS } from "@/lib/format";
import { parseFields, readDetails } from "@/lib/registration-form";
import { appliesTo } from "@/lib/rundown";
import { shuttleManifest } from "@/lib/shuttle";
import { getSite } from "@/lib/site";
import { ensureUserQr } from "@/lib/qr";

const SAFE_USER = { id: true, name: true, email: true, phone: true, organization: true, image: true } as const;

const csvCell = (v: string) => {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

function stripUserPw<T extends { user: Record<string, unknown> }>(reg: T) {
  const { id, name, email, phone, organization, image } = reg.user;
  return { ...reg, user: { id, name, email, phone, organization, image } };
}

export async function handleSuperadminPages(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";
  if (method !== "GET") return false;

  const exportMatch = matchPath("/superadmin/events/:id/export", pathname);
  if (exportMatch) {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const event = await db.event.findUnique({
      where: { id: exportMatch.id },
      include: {
        checkpoints: { where: { scan: true }, orderBy: { order: "asc" } },
        registrations: { include: { user: { select: SAFE_USER }, scans: true }, orderBy: { createdAt: "asc" } },
      },
    });
    if (!event) return sendText(res, "Event tidak ditemukan", 404), true;
    const fields = parseFields(event.formFields);
    const header = ["No. peserta", "Nama", "Email", "No. HP", "Instansi", "Status", ...fields.map((f) => f.label), "Total biaya", "No. referensi", ...event.checkpoints.map((c) => c.name)];
    const rows = event.registrations.map((r) => {
      const at = new Map(r.scans.map((s) => [s.checkpointId, s.createdAt]));
      const d = readDetails(r.details);
      const answer = new Map(d.answers.map((a) => [a.id, a.value]));
      return [
        r.code ?? "",
        r.user.name,
        r.user.email,
        r.user.phone ?? "",
        r.user.organization ?? "",
        REG_STATUS[r.status],
        ...fields.map((f) => answer.get(f.id) ?? ""),
        d.total != null ? String(d.total) : "",
        d.paymentProof,
        ...event.checkpoints.map((c) => (!appliesTo(c, d) ? "-" : at.get(c.id) ? fmtDateTime(at.get(c.id)!) : "")),
      ];
    });
    const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    sendText(res, csv, 200, "text/csv; charset=utf-8", {
      "Content-Disposition": `attachment; filename="${event.slug}.csv"`,
    });
    return true;
  }

  const qrMatch = matchPath("/superadmin/qr/:id", pathname);
  if (qrMatch) {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const reg = await db.registration.findUnique({ where: { id: qrMatch.id } });
    if (reg?.status !== "approved") return sendText(res, "QR belum terbit", 404), true;
    const png = await QRCode.toBuffer(await ensureUserQr(reg.userId), { width: 480, margin: 2 });
    sendBinary(res, new Uint8Array(png), "image/png", { "Cache-Control": "no-store" });
    return true;
  }

  if (pathname === "/api/superadmin/dashboard") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const today = startOfTodayJakarta();
    const [openEvents, pending, approved, scansToday, upcoming, pendingByEvent, latestPending, finance, certificates] = await Promise.all([
      db.event.count({ where: { status: "open" } }),
      db.registration.count({ where: { status: "pending" } }),
      db.registration.count({ where: { status: "approved" } }),
      db.scan.count({ where: { createdAt: { gte: today } } }),
      db.event.findMany({
        where: { status: { in: ["open", "closed"] }, endDate: { gte: today } },
        orderBy: { startDate: "asc" },
        take: 6,
        include: { _count: { select: { registrations: { where: { status: "approved" } } } } },
      }),
      db.registration.groupBy({ by: ["eventId"], where: { status: "pending" }, _count: true }),
      db.registration.findMany({
        where: { status: "pending" },
        include: { user: { select: SAFE_USER }, event: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      financeSummary(),
      db.registration.count({ where: { certificateNo: { not: null } } }),
    ]);
    sendJson(res, {
      openEvents,
      pending,
      approved,
      scansToday,
      upcoming,
      pendingByEvent: pendingByEvent.map((p) => ({ eventId: p.eventId, count: p._count })),
      latestPending,
      finance,
      certificates,
    });
    return true;
  }

  if (pathname === "/api/superadmin/events") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const kategori = parseUrl(req).searchParams.get("kategori")?.trim() || undefined;
    const [events, counts, categories] = await Promise.all([
      db.event.findMany({
        where: kategori ? { category: kategori } : {},
        include: { _count: { select: { checkpoints: true } } },
        orderBy: { startDate: "desc" },
      }),
      db.registration.groupBy({ by: ["eventId", "status"], _count: true }),
      getCategories(),
    ]);
    sendJson(res, {
      events,
      counts: counts.map((c) => ({ eventId: c.eventId, status: c.status, count: c._count })),
      categories,
    });
    return true;
  }

  const eventLearning = matchPath("/api/superadmin/events/:id/learning", pathname);
  if (eventLearning) {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const event = await db.event.findUnique({
      where: { id: eventLearning.id },
      include: {
        lessons: { orderBy: { order: "asc" } },
        questions: { orderBy: { order: "asc" } },
        checkpoints: { where: { scan: true }, select: { audience: true } },
        registrations: {
          where: { status: "approved" },
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: SAFE_USER },
            attempts: { orderBy: { score: "desc" }, take: 1 },
            progress: { select: { lessonId: true } },
            _count: { select: { scans: true } },
          },
        },
      },
    });
    if (!event) return sendJson(res, { error: "Event tidak ditemukan." }, 404), true;
    sendJson(res, { event });
    return true;
  }

  const eventDetail = matchPath("/api/superadmin/events/:id", pathname);
  if (eventDetail) {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const q = parseUrl(req).searchParams.get("q")?.trim().slice(0, 80) || undefined;
    const [data, categories, team] = await Promise.all([
      getEventDetail(eventDetail.id, "all", undefined, q),
      getCategories(),
      db.admin.findMany({
        where: { role: "scanner", active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, position: true, events: { where: { id: eventDetail.id }, select: { id: true } } },
      }),
    ]);
    if (!data) return sendJson(res, { error: "Event tidak ditemukan." }, 404), true;
    const routes = await shuttleManifest(data.event.id);
    sendJson(res, {
      event: data.event,
      registrations: data.registrations.map(stripUserPw),
      counts: data.counts,
      eligible: data.eligible,
      categories,
      team,
      routes,
    });
    return true;
  }

  if (pathname === "/api/superadmin/categories") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const [categories, usage] = await Promise.all([
      db.category.findMany({ orderBy: { name: "asc" } }),
      db.event.groupBy({ by: ["category"], _count: true }),
    ]);
    const counts: Record<string, number> = {};
    for (const u of usage) counts[u.category] = u._count;
    sendJson(res, { categories, counts });
    return true;
  }

  if (pathname === "/api/superadmin/users") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, phone: true, organization: true,
        image: true, emailVerified: true, passwordHash: true, lockedUntil: true, createdAt: true,
      },
    });
    sendJson(res, {
      users: users.map(({ passwordHash, ...u }) => ({ ...u, hasPassword: Boolean(passwordHash) })),
    });
    return true;
  }

  if (pathname === "/api/superadmin/admins") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const [admins, events] = await Promise.all([
      db.admin.findMany({
        select: {
          id: true, name: true, email: true, role: true, position: true, phone: true, image: true,
          duties: true, active: true, lockedUntil: true, createdAt: true,
          events: { select: { id: true, name: true } },
          _count: { select: { scans: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.event.findMany({ where: { status: { not: "done" } }, select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
    ]);
    sendJson(res, { admins, events });
    return true;
  }

  if (pathname === "/api/superadmin/absensi") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const sp = parseUrl(req).searchParams;
    const mode = sp.get("mode") || "event";
    const allEvents = await db.event.findMany({
      orderBy: [{ startDate: "desc" }],
      select: { id: true, name: true, startDate: true, endDate: true, status: true, location: true, _count: { select: { admins: true } } },
    });
    const paramEventId = sp.get("eventId") || sp.get("event") || "";
    const todayKey = todayKeyJakarta();
    const running = allEvents.find((e) => {
      const s = e.startDate.toISOString().slice(0, 10);
      const end = e.endDate.toISOString().slice(0, 10);
      return ["open", "closed"].includes(e.status) && todayKey >= s && todayKey <= end;
    });
    const selectedEventId = paramEventId || running?.id || allEvents[0]?.id || "";
    const report = selectedEventId ? await getEventAttendanceReport(selectedEventId) : null;
    const rawDate = sp.get("tanggal");
    const date = isDateKey(rawDate) ? rawDate : todayKey;
    const dateEvents = mode === "date" ? await eventsOnDate(date) : [];
    const [dateMembers, dateRows] = mode === "date" ? await Promise.all([
      db.event.findMany({
        where: { id: { in: dateEvents.map((e) => e.id) } },
        select: { id: true, admins: { where: { active: true }, select: { id: true, name: true, position: true, image: true }, orderBy: { name: "asc" } } },
      }),
      db.attendance.findMany({ where: { date } }),
    ]) : [[], []];
    sendJson(res, { mode, allEvents, selectedEventId, report, date, dateEvents, dateMembers, dateRows });
    return true;
  }

  if (pathname === "/api/superadmin/keuangan") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const eventId = parseUrl(req).searchParams.get("event")?.trim() || undefined;
    const [summary, events] = await Promise.all([
      financeSummary(eventId),
      db.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
    ]);
    sendJson(res, { ...summary, events, eventId: eventId ?? "", today: todayKeyJakarta() });
    return true;
  }

  if (pathname === "/api/superadmin/site") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    sendJson(res, { site: await getSite() });
    return true;
  }

  if (pathname === "/api/superadmin/banners") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const [banners, events] = await Promise.all([
      db.banner.findMany({ orderBy: { order: "asc" } }),
      db.event.findMany({ where: { status: { in: ["open", "closed"] } }, orderBy: { startDate: "asc" }, select: { slug: true, name: true } }),
    ]);
    sendJson(res, { banners, events });
    return true;
  }

  if (pathname === "/api/superadmin/articles") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const articles = await db.article.findMany({ orderBy: { updatedAt: "desc" } });
    sendJson(res, { articles });
    return true;
  }

  const articleEdit = matchPath("/api/superadmin/articles/:id", pathname);
  if (articleEdit) {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const article = await db.article.findUnique({ where: { id: articleEdit.id } });
    if (!article) return sendJson(res, { error: "Artikel tidak ditemukan." }, 404), true;
    sendJson(res, { article });
    return true;
  }

  if (pathname === "/api/superadmin/audit") {
    const admin = await requireAdmin(req, res, "superadmin");
    if (!admin) return true;
    const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    sendJson(res, { logs });
    return true;
  }

  return false;
}

