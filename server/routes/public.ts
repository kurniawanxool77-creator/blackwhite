import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { db } from "../../lib/db";
import { findReadyEvents, seatsLeftOf } from "../../lib/event-search";
import { str } from "../../lib/form";
import { finalPrice } from "../../lib/format";
import { PHONE_RE } from "../../lib/form";
import { nextCodes, registrationClosed } from "../../lib/participant-code";
import { parseFields, readAnswers, readDetails } from "../../lib/registration-form";
import { shuttleOptions } from "../../lib/shuttle";
import { getSite, parseBanks } from "../../lib/site";
import { getSessionUser, requireUser } from "../auth";
import { cached, invalidateCache } from "../cache";
import { matchPath, parseUrl, readFormData, sendJson } from "../http";

const cachedSite = () => cached("site", 10_000, getSite);

export async function handlePublic(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/public/site") {
    sendJson(res, await cachedSite());
    return true;
  }

  if (method === "GET" && pathname === "/api/public/home") {
    const [site, banners, articles, ready] = await Promise.all([
      cachedSite(),
      db.banner.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
      db.article.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
      findReadyEvents({}),
    ]);
    sendJson(res, { site, banners, articles, ...ready });
    return true;
  }

  if (method === "GET" && pathname === "/api/public/events") {
    const sp = parseUrl(req).searchParams;
    const rawMode = sp.get("mode")?.trim() || undefined;
    const rawHarga = sp.get("harga")?.trim() || undefined;
    const filters = {
      q: sp.get("q")?.trim() || undefined,
      kategori: sp.get("kategori")?.trim() || undefined,
      lokasi: sp.get("lokasi")?.trim() || undefined,
      mode: rawMode && ["offline", "online", "hybrid"].includes(rawMode) ? rawMode : undefined,
      harga: rawHarga && ["gratis", "berbayar"].includes(rawHarga) ? rawHarga : undefined,
      urut: sp.get("urut")?.trim() === "harga" ? "harga" : "tanggal",
    };
    const ready = await findReadyEvents(filters);
    sendJson(res, { ...ready, filters });
    return true;
  }

  const eventParams = method === "GET" ? matchPath("/api/public/events/:slug", pathname) : null;
  if (eventParams) {
    const event = await db.event.findUnique({
      where: { slug: eventParams.slug },
      include: {
        checkpoints: { orderBy: { order: "asc" } },
        _count: { select: { registrations: { where: { status: "approved" } }, lessons: true, questions: true } },
      },
    });
    if (!event || event.status === "draft") return sendJson(res, { error: "Event tidak ditemukan." }, 404), true;
    const session = getSessionUser(req);
    const isUser = session?.role === "user";
    const [user, existing, site, seatsLeft] = await Promise.all([
      isUser ? db.user.findUnique({ where: { id: session.id }, select: { id: true, name: true, email: true, phone: true, organization: true } }) : null,
      isUser ? db.registration.findUnique({ where: { userId_eventId: { userId: session.id, eventId: event.id } } }) : null,
      cachedSite(),
      seatsLeftOf(event),
    ]);
    const shuttles = await shuttleOptions(event.id, existing?.id);
    sendJson(res, {
      event,
      user,
      existing,
      seatsLeft,
      closed: registrationClosed(event),
      shuttles,
      banks: parseBanks(site.banks),
      siteName: site.name,
      fields: parseFields(event.formFields),
      savedDetails: existing ? readDetails(existing.details) : null,
    });
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/registerForEvent") {
    const user = requireUser(req, res);
    if (!user) return true;
    const formData = await readFormData(req);
    const qArgs = parseUrl(req).searchParams.getAll("a");
    const argsRaw = formData.get("__args");
    const [eventId] = qArgs.length ? qArgs : argsRaw ? (JSON.parse(String(argsRaw)) as [string]) : [str(formData, "eventId")];
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== "open") return sendJson(res, { result: "Pendaftaran untuk event ini sudah ditutup." }), true;
    if (registrationClosed(event)) return sendJson(res, { result: "Batas waktu pendaftaran sudah lewat." }), true;
    if (event.quota) {
      const approved = await db.registration.count({ where: { eventId, status: "approved" } });
      if (approved >= event.quota) return sendJson(res, { result: "Kuota event sudah penuh." }), true;
    }
    const existing = await db.registration.findUnique({ where: { userId_eventId: { userId: user.id, eventId } }, select: { id: true, status: true } });
    if (existing?.status === "approved") {
      return sendJson(res, { result: "Anda sudah terdaftar dan disetujui di event ini." }), true;
    }
    const formFields = parseFields(event.formFields);
    const rawPhone = str(formData, "phone");
    if (formFields.length === 0 && !PHONE_RE.test(rawPhone)) {
      return sendJson(res, { result: "Nomor WhatsApp tidak valid." }), true;
    }
    const routes = await shuttleOptions(eventId, existing?.id);
    const read = readAnswers(formFields, formData, routes);
    if (typeof read === "string") return sendJson(res, { result: read }), true;
    if (read.shuttleId && routes.find((r) => r.id === read.shuttleId)?.seatsLeft === 0) {
      return sendJson(res, { result: "Kursi shuttle di rute ini sudah penuh. Pilih rute lain." }), true;
    }
    const total = finalPrice(event) + (read.packagePrice ?? 0);
    const paymentProof = str(formData, "paymentProof").slice(0, 300);
    const paymentProofUrl = str(formData, "paymentProofUrl");
    if (paymentProofUrl && !/^\/media\/[a-z0-9]+$/i.test(paymentProofUrl)) return sendJson(res, { result: "Bukti transfer tidak valid. Unggah ulang." }), true;
    if (total > 0 && !paymentProofUrl && !paymentProof) return sendJson(res, { result: "Unggah bukti transfer atau isi nomor referensi transfer." }), true;
    const mediaIds = [...read.answers.filter((a) => a.type === "file").map((a) => a.value), ...(paymentProofUrl ? [paymentProofUrl] : [])].map((v) => v.slice("/media/".length));
    if (mediaIds.length && (await db.media.count({ where: { id: { in: mediaIds }, ownerId: user.id } })) !== new Set(mediaIds).size) {
      return sendJson(res, { result: "Foto tidak ditemukan. Unggah ulang fotonya." }), true;
    }
    const details = JSON.stringify({ answers: read.answers, total, paymentProof, paymentProofUrl: total > 0 ? paymentProofUrl : "" });
    const dynamicTel = read.answers.find((a) => a.type === "tel")?.value;
    const phone = rawPhone || dynamicTel;
    const organization = str(formData, "organization");
    if (phone || organization) {
      await db.user.update({
        where: { id: user.id },
        data: {
          ...(phone ? { phone } : {}),
          ...(organization ? { organization } : {}),
        },
      });
    }
    const reg = await db.registration.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      update: { details, shuttleId: read.shuttleId, status: "pending", rejectReason: null, approvedAt: null, qrToken: null },
      create: { userId: user.id, eventId, details, shuttleId: read.shuttleId },
    });
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
    invalidateCache();
    sendJson(res, { result: null, redirect: `/tiket/${reg.id}` });
    return true;
  }

  if (method === "GET" && pathname === "/api/public/blog") {
    const articles = await db.article.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
    sendJson(res, { articles });
    return true;
  }

  const blogParams = method === "GET" ? matchPath("/api/public/blog/:slug", pathname) : null;
  if (blogParams) {
    const article = await db.article.findUnique({ where: { slug: blogParams.slug } });
    if (!article?.published) return sendJson(res, { error: "Artikel tidak ditemukan." }, 404), true;
    const others = await db.article.findMany({ where: { published: true, id: { not: article.id } }, orderBy: { publishedAt: "desc" }, take: 3 });
    sendJson(res, { article, others });
    return true;
  }

  if (method === "GET" && pathname === "/api/public/gallery") {
    const [site, events] = await Promise.all([
      cachedSite(),
      db.event.findMany({ select: { id: true, name: true, slug: true, category: true, coverUrl: true, gallery: true }, orderBy: { startDate: "desc" } }),
    ]);
    const photos: { url: string; eventName: string; category: string; slug: string }[] = [];
    const cats = new Set<string>();
    for (const e of events) {
      if (e.category) cats.add(e.category);
      if (e.coverUrl) photos.push({ url: e.coverUrl, eventName: e.name, category: e.category, slug: e.slug });
      try {
        const extra = JSON.parse(e.gallery || "[]") as unknown[];
        for (const u of extra) if (typeof u === "string" && u) photos.push({ url: u, eventName: e.name, category: e.category, slug: e.slug });
      } catch {
        // Abaikan JSON galeri rusak
      }
    }
    sendJson(res, { site, photos, categories: [...cats] });
    return true;
  }

  const certParams = method === "GET" ? matchPath("/api/public/certificate/:no", pathname) : null;
  if (certParams) {
    const [reg, site] = await Promise.all([
      db.registration.findUnique({ where: { certificateNo: certParams.no }, include: { user: { select: { name: true } }, event: true } }),
      cachedSite(),
    ]);
    if (!reg?.certifiedAt) return sendJson(res, { error: "Sertifikat tidak ditemukan." }, 404), true;
    sendJson(res, { reg, site });
    return true;
  }

  return false;
}
