import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "../auth";
import { invalidateCache } from "../cache";
import { bodyArgs, queryArgs, readFormData, sendJson } from "../http";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { ACTIVITIES, isActivity, isEventType, type ActivityKey } from "@/lib/event-types";
import { digits, str } from "@/lib/form";
import { CHECKPOINT_KIND, fmtRp } from "@/lib/format";
import { MAX_GALLERY } from "@/lib/gallery";
import { cleanPrefix } from "@/lib/participant-code";
import { cleanFields, parseFields } from "@/lib/registration-form";
import { choiceOptions } from "@/lib/rundown";
import { cleanTime, routeLabel, wibToDate } from "@/lib/schedule";
import { isImageUrl } from "@/lib/url";

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
    mode: type === "course" ? "online" : ["online", "hybrid"].includes(str(f, "mode")) ? str(f, "mode") : "offline",
    useQr: type === "course" ? false : f.get("useQr") === "on",
    autoApprove: str(f, "approval") === "auto",
    registrationEnd,
    codePrefix,
  };
}

function cpDetails(f: FormData) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(f, "date")) ? new Date(`${str(f, "date")}T00:00:00.000Z`) : null;
  return { date, startTime: cleanTime(str(f, "startTime")), endTime: cleanTime(str(f, "endTime")), place: str(f, "place").slice(0, 120), description: str(f, "description").slice(0, 600) };
}

function readRoute(f: FormData) {
  const origin = str(f, "origin").slice(0, 120);
  const destination = str(f, "destination").slice(0, 120);
  const departAt = wibToDate(str(f, "departDate"), str(f, "departTime"));
  if (!origin || !destination) return "Titik jemput dan tujuan wajib diisi.";
  if (!departAt) return "Tanggal dan jam berangkat wajib diisi.";
  const capacity = digits(f, "capacity");
  return { origin, destination, departAt, capacity: capacity > 0 ? Math.min(capacity, 10_000) : null, note: str(f, "note").slice(0, 300) };
}

export async function handleSuperadminEventRpc(req: IncomingMessage, res: ServerResponse, action: string): Promise<boolean> {
  if (![
    "createEvent", "updateEvent", "saveFormFields", "setEventAdmins", "setEventStatus", "deleteEvent",
    "sortRundown", "addCheckpoint", "updateCheckpoint", "moveCheckpoint", "deleteCheckpoint", "setCheckpointAudience", "toggleCheckpointScan",
    "addShuttle", "updateShuttle", "deleteShuttle",
  ].includes(action)) return false;

  const admin = await requireAdmin(req, res, "superadmin");
  if (!admin) return true;

  if (action === "createEvent") {
    const f = await readFormData(req);
    const data = readEvent(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const base = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
    const isCourse = data.type === "course";
    const tpl = ACTIVITIES[isActivity(str(f, "activity")) ? (str(f, "activity") as ActivityKey) : "kosong"];
    const event = await db.event.create({
      data: {
        ...data,
        slug: `${base}-${randomBytes(3).toString("hex")}`,
        certificate: isCourse,
        formFields: !isCourse && f.get("useForm") ? JSON.stringify(tpl.fields) : "[]",
        checkpoints: !isCourse && f.get("useRundown")
          ? { create: tpl.rundown.map(([name, kind, scan, dayOffset, startTime, endTime, place, description], i) => ({ name, kind, scan, startTime, endTime, place, description, order: i + 1, date: new Date(+data.startDate + dayOffset * 864e5) })) }
          : undefined,
      },
    });
    await audit(admin, "Buat event", `${event.name} · ${fmtRp(event.price)} · diskon ${event.discount}%`);
    invalidateCache("public:");
    return sendJson(res, { result: null, redirect: `/superadmin/events/${event.id}` }), true;
  }

  if (action === "updateEvent") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const data = readEvent(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const event = await db.event.update({ where: { id: eventId }, data });
    await audit(admin, "Ubah event", `${event.name} · ${fmtRp(event.price)} · diskon ${event.discount}%`);
    invalidateCache("public:");
    return sendJson(res, { result: "Tersimpan." }), true;
  }

  if (action === "saveFormFields") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    let raw: unknown = [];
    try { raw = JSON.parse(str(f, "formFields") || "[]"); } catch { return sendJson(res, { result: "Data formulir tidak valid." }), true; }
    const fields = cleanFields(raw);
    const event = await db.event.update({ where: { id: eventId }, data: { formFields: JSON.stringify(fields) } });
    await audit(admin, "Ubah formulir pendaftaran", `${event.name} · ${fields.length} isian`);
    invalidateCache("public:");
    return sendJson(res, { result: "Tersimpan." }), true;
  }

  if (action === "setEventAdmins") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const ids = f.getAll("admins").map(String);
    const valid = await db.admin.findMany({ where: { id: { in: ids }, role: "scanner" }, select: { id: true, name: true } });
    const event = await db.event.update({ where: { id: eventId }, data: { admins: { set: valid.map((a) => ({ id: a.id })) } } });
    await audit(admin, "Atur panitia event", `${event.name} · ${valid.map((a) => a.name).join(", ") || "tanpa panitia"}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "setEventStatus") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const status = str(f, "status");
    if (["draft", "open", "closed", "done"].includes(status)) {
      const event = await db.event.update({ where: { id: eventId }, data: { status } });
      await audit(admin, "Ubah status event", `${event.name} → ${status}`);
      invalidateCache("public:");
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteEvent") {
    const [eventId] = await bodyArgs(req);
    const event = await db.event.findUnique({ where: { id: String(eventId) }, include: { _count: { select: { registrations: true } } } });
    if (event) {
      await db.event.delete({ where: { id: event.id } });
      await audit(admin, "Hapus event", `${event.name} · ${event._count.registrations} pendaftaran ikut terhapus`);
      invalidateCache("public:");
    }
    return sendJson(res, { result: null, redirect: "/superadmin/events" }), true;
  }

  if (action === "sortRundown") {
    const [eventId] = await bodyArgs(req);
    const items = await db.checkpoint.findMany({ where: { eventId: String(eventId) }, orderBy: { order: "asc" } });
    const key = (c: (typeof items)[number]) => (c.date ? `${c.date.toISOString().slice(0, 10)} ${c.startTime || "99.99"}` : "9999");
    const sorted = [...items].sort((a, b) => key(a).localeCompare(key(b)) || a.order - b.order);
    await db.$transaction(sorted.map((c, i) => db.checkpoint.update({ where: { id: c.id }, data: { order: i + 1 } })));
    return sendJson(res, { result: null }), true;
  }

  if (action === "addCheckpoint") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const name = str(f, "name").slice(0, 120);
    if (name) {
      const rawKind = str(f, "kind");
      const kind = Object.prototype.hasOwnProperty.call(CHECKPOINT_KIND, rawKind) ? rawKind : "attendance";
      const last = await db.checkpoint.findFirst({ where: { eventId }, orderBy: { order: "desc" } });
      await db.checkpoint.create({ data: { eventId, name, kind, scan: f.get("scan") === "on", order: (last?.order ?? 0) + 1, ...cpDetails(f) } });
      invalidateCache("public:");
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateCheckpoint") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const name = str(f, "name").slice(0, 120);
    if (!name) return sendJson(res, { result: "Nama item wajib diisi." }), true;
    const rawKind = str(f, "kind");
    const kind = Object.prototype.hasOwnProperty.call(CHECKPOINT_KIND, rawKind) ? rawKind : "attendance";
    await db.checkpoint.update({ where: { id }, data: { name, kind, ...cpDetails(f) } });
    await audit(admin, "Ubah item rundown", name);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "moveCheckpoint") {
    const [id, direction] = await bodyArgs(req);
    const cp = await db.checkpoint.findUniqueOrThrow({ where: { id: String(id) } });
    const neighbor = await db.checkpoint.findFirst({
      where: { eventId: cp.eventId, order: direction === "up" ? { lt: cp.order } : { gt: cp.order } },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });
    if (neighbor) {
      await db.$transaction([
        db.checkpoint.update({ where: { id: cp.id }, data: { order: neighbor.order } }),
        db.checkpoint.update({ where: { id: neighbor.id }, data: { order: cp.order } }),
      ]);
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteCheckpoint") {
    const [id] = await bodyArgs(req);
    const cp = await db.checkpoint.findUniqueOrThrow({ where: { id: String(id) }, include: { _count: { select: { scans: true } } } });
    if (cp._count.scans === 0) await db.checkpoint.delete({ where: { id: cp.id } });
    return sendJson(res, { result: null }), true;
  }

  if (action === "setCheckpointAudience") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const cp = await db.checkpoint.findUniqueOrThrow({ where: { id }, include: { event: { select: { formFields: true } } } });
    const allowed = new Set(choiceOptions(parseFields(cp.event.formFields)).map((o) => o.key));
    const audience = [...new Set(f.getAll("audience").map(String))].filter((k) => allowed.has(k));
    await db.checkpoint.update({ where: { id }, data: { audience: JSON.stringify(audience) } });
    await audit(admin, "Atur peserta rundown", `${cp.name} → ${audience.length ? audience.join(", ") : "semua peserta"}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "toggleCheckpointScan") {
    const [id] = await bodyArgs(req);
    const cp = await db.checkpoint.findUniqueOrThrow({ where: { id: String(id) }, include: { _count: { select: { scans: true } } } });
    if (!(cp.scan && cp._count.scans > 0)) await db.checkpoint.update({ where: { id: cp.id }, data: { scan: !cp.scan } });
    return sendJson(res, { result: null }), true;
  }

  if (action === "addShuttle") {
    const [eventId] = queryArgs(req);
    const f = await readFormData(req);
    const data = readRoute(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const route = await db.shuttleRoute.create({ data: { eventId, ...data } });
    await audit(admin, "Tambah rute shuttle", routeLabel(route));
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateShuttle") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const data = readRoute(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const taken = await db.registration.count({ where: { shuttleId: id, status: { not: "rejected" } } });
    if (data.capacity != null && data.capacity < taken) return sendJson(res, { result: `Kapasitas minimal ${taken} (sudah ada ${taken} penumpang).` }), true;
    const route = await db.shuttleRoute.update({ where: { id }, data });
    await audit(admin, "Ubah rute shuttle", routeLabel(route));
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteShuttle") {
    const [id] = await bodyArgs(req);
    const route = await db.shuttleRoute.delete({ where: { id: String(id) } });
    await audit(admin, "Hapus rute shuttle", routeLabel(route));
    return sendJson(res, { result: null }), true;
  }

  return false;
}

