import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import sharp from "sharp";
import { todayKeyJakarta } from "../../lib/checkin";
import { db, LIVE_KEY } from "../../lib/db";
import { MAX_IMAGE_BYTES, sniffImageType, toAvatarWebp, toSelfieWebp, toWebp } from "../../lib/media";
import { noticesFor } from "../../lib/notifications";
import { siteUrl } from "../../lib/seo";
import { getSite } from "../../lib/site";
import { getActiveAdmin, getSessionUser } from "../auth";
import { cached, invalidateCache } from "../cache";
import { matchPath, parseUrl, readFormData, sendBinary, sendJson, sendText } from "../http";

const MAX_FORM_UPLOADS_PER_HOUR = 30;
const formUploads = new Map<string, number[]>();

function allowFormUpload(userId: string) {
  const since = Date.now() - 3600e3;
  const recent = (formUploads.get(userId) ?? []).filter((t) => t > since);
  if (recent.length >= MAX_FORM_UPLOADS_PER_HOUR) return false;
  formUploads.set(userId, [...recent, Date.now()]);
  return true;
}

async function pngIcon(size: number, fontSize: number) {
  try {
    const logoPath = path.resolve(process.cwd(), "public", "logo.png");
    if (existsSync(logoPath)) {
      const pad = Math.round(size * 0.12);
      const innerW = size - pad * 2;
      const logoBuf = await sharp(logoPath)
        .resize(innerW, Math.round(innerW * 0.4), { fit: "inside" })
        .toBuffer();
      return sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([{ input: logoBuf, gravity: "center" }])
        .png()
        .toBuffer();
    }
  } catch (err) {
    console.error("[pngIcon] fallback to svg:", err);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#0f172a"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">BW</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function handleMeta(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";

  if (method === "GET" && pathname === "/api/health") {
    try {
      await db.$queryRaw`SELECT 1`;
      sendJson(res, {
        ok: true,
        db: "ok",
        runtime: process.env.VERCEL ? "vercel" : "node",
        timestamp: new Date().toISOString(),
        env: {
          databaseUrl: Boolean(process.env.DATABASE_URL),
          authSecret: Boolean(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
          googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        },
      });
    } catch (err) {
      console.error("[HEALTHCHECK]", err);
      sendJson(res, { ok: false, db: "error", timestamp: new Date().toISOString() }, 503);
    }
    return true;
  }

  if (method === "GET" && pathname === "/api/live") {
    const v = await cached("live", 2500, async () => {
      const row = await db.setting.findUnique({ where: { key: LIVE_KEY } }).catch(() => null);
      return row?.value ?? "0";
    });
    sendJson(res, { v }, 200, { "Cache-Control": "public, max-age=0, s-maxage=3" });
    return true;
  }

  if (method === "GET" && pathname === "/api/notifications") {
    const admin = await getActiveAdmin(req);
    if (!admin) {
      sendJson(res, { error: "Tidak diizinkan." }, 401);
      return true;
    }
    sendJson(res, await noticesFor(admin), 200, { "Cache-Control": "no-store" });
    return true;
  }

  const mediaParams = method === "GET" ? matchPath("/media/:id", pathname) : null;
  if (mediaParams) {
    const media = await db.media.findUnique({ where: { id: mediaParams.id } });
    if (!media) {
      sendText(res, "Tidak ditemukan", 404);
      return true;
    }
    if (media.ownerId) {
      const session = getSessionUser(req);
      const allowed = session?.id === media.ownerId || !!(await getActiveAdmin(req));
      if (!allowed) {
        sendText(res, "Tidak ditemukan", 404);
        return true;
      }
    }
    sendBinary(res, media.data, media.mime, {
      "Cache-Control": media.ownerId ? "private, no-store" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    return true;
  }

  if (method === "POST" && pathname === "/api/upload") {
    const admin = await getActiveAdmin(req);
    if (admin?.role !== "superadmin") {
      sendJson(res, { error: "Tidak diizinkan." }, 401);
      return true;
    }
    const file = (await readFormData(req)).get("file") as Blob | null;
    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return sendJson(res, { error: "File tidak ditemukan." }, 400), true;
    if (file.size > MAX_IMAGE_BYTES) return sendJson(res, { error: "Ukuran gambar maksimal 4 MB." }, 413), true;
    const original = new Uint8Array(await file.arrayBuffer());
    if (!sniffImageType(original)) return sendJson(res, { error: "Format harus JPEG, PNG, atau WebP." }, 415), true;
    try {
      const data = await toWebp(original);
      const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(data), size: data.length } });
      sendJson(res, { url: `/media/${media.id}` });
    } catch {
      sendJson(res, { error: "Gambar rusak atau terlalu besar untuk diproses." }, 422);
    }
    return true;
  }

  if (method === "POST" && pathname === "/api/upload/avatar") {
    const session = getSessionUser(req);
    const admin = session?.role === "user" ? null : await getActiveAdmin(req);
    if (session?.role !== "user" && !admin) return sendJson(res, { error: "Silakan masuk terlebih dahulu." }, 401), true;
    const file = (await readFormData(req)).get("file");
    if (!(file instanceof File)) return sendJson(res, { error: "File tidak ditemukan." }, 400), true;
    if (file.size > MAX_IMAGE_BYTES) return sendJson(res, { error: "Ukuran foto maksimal 4 MB." }, 413), true;
    const original = new Uint8Array(await file.arrayBuffer());
    if (!sniffImageType(original)) return sendJson(res, { error: "Format harus JPEG, PNG, atau WebP." }, 415), true;
    let webp: Buffer;
    try {
      webp = await toAvatarWebp(original);
    } catch {
      return sendJson(res, { error: "Foto rusak atau terlalu besar untuk diproses." }, 422), true;
    }
    const owner = admin
      ? await db.admin.findUnique({ where: { id: admin.id }, select: { image: true } })
      : await db.user.findUnique({ where: { id: session!.id }, select: { image: true } });
    if (!owner) return sendJson(res, { error: "Akun tidak ditemukan." }, 404), true;
    const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length } });
    const url = `/media/${media.id}`;
    if (admin) await db.admin.update({ where: { id: admin.id }, data: { image: url } });
    else await db.user.update({ where: { id: session!.id }, data: { image: url } });
    const oldId = owner.image?.match(/^\/media\/([a-z0-9]+)$/i)?.[1];
    if (oldId) await db.media.deleteMany({ where: { id: oldId } });
    invalidateCache();
    sendJson(res, { url });
    return true;
  }

  if (method === "POST" && pathname === "/api/upload/form") {
    const session = getSessionUser(req);
    if (session?.role !== "user") return sendJson(res, { error: "Silakan masuk terlebih dahulu." }, 401), true;
    if (!allowFormUpload(session.id)) return sendJson(res, { error: "Terlalu banyak unggahan. Coba lagi nanti." }, 429), true;
    const file = (await readFormData(req)).get("file");
    if (!(file instanceof File)) return sendJson(res, { error: "File tidak ditemukan." }, 400), true;
    if (file.size > MAX_IMAGE_BYTES) return sendJson(res, { error: "Ukuran foto maksimal 4 MB." }, 413), true;
    const original = new Uint8Array(await file.arrayBuffer());
    if (!sniffImageType(original)) return sendJson(res, { error: "Format harus JPEG, PNG, atau WebP." }, 415), true;
    try {
      const webp = await toWebp(original);
      const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length, ownerId: session.id } });
      sendJson(res, { url: `/media/${media.id}` });
    } catch {
      sendJson(res, { error: "Foto rusak atau terlalu besar untuk diproses." }, 422);
    }
    return true;
  }

  if (method === "POST" && pathname === "/api/attendance") {
    const admin = await getActiveAdmin(req);
    if (admin?.role !== "scanner") return sendJson(res, { error: "Hanya untuk panitia." }, 401), true;
    const form = await readFormData(req);
    const eventId = String(form.get("eventId") ?? "");
    const type = form.get("type") === "out" ? "out" : "in";
    const file = form.get("file");
    if (!(file instanceof File)) return sendJson(res, { error: "Foto selfie wajib diambil." }, 400), true;
    if (file.size > MAX_IMAGE_BYTES) return sendJson(res, { error: "Ukuran foto maksimal 4 MB." }, 413), true;
    const event = await db.event.findFirst({ where: { id: eventId, status: { in: ["open", "closed"] }, admins: { some: { id: admin.id } } } });
    if (!event) return sendJson(res, { error: "Event tidak ditemukan atau tidak ditugaskan kepada Anda." }, 404), true;
    const date = todayKeyJakarta();
    const key = { adminId_eventId_date: { adminId: admin.id, eventId, date } };
    const existing = await db.attendance.findUnique({ where: key });
    if (type === "in" && existing) return sendJson(res, { error: "Anda sudah absen datang hari ini." }, 409), true;
    if (type === "out" && !existing) return sendJson(res, { error: "Absen datang dulu sebelum absen selesai." }, 409), true;
    if (type === "out" && existing?.checkOut) return sendJson(res, { error: "Anda sudah absen selesai hari ini." }, 409), true;
    const original = new Uint8Array(await file.arrayBuffer());
    if (!sniffImageType(original)) return sendJson(res, { error: "Format foto harus JPEG, PNG, atau WebP." }, 415), true;
    let webp: Buffer;
    try {
      webp = await toSelfieWebp(original);
    } catch {
      return sendJson(res, { error: "Foto rusak atau terlalu besar untuk diproses." }, 422), true;
    }
    const media = await db.media.create({ data: { mime: "image/webp", data: new Uint8Array(webp), size: webp.length, ownerId: admin.id } });
    const photo = `/media/${media.id}`;
    try {
      if (type === "in") await db.attendance.create({ data: { adminId: admin.id, eventId, date, checkInPhoto: photo } });
      else await db.attendance.update({ where: key, data: { checkOut: new Date(), checkOutPhoto: photo } });
    } catch (e) {
      await db.media.delete({ where: { id: media.id } });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return sendJson(res, { error: "Anda sudah absen datang hari ini." }, 409), true;
      throw e;
    }
    invalidateCache();
    sendJson(res, { ok: true });
    return true;
  }

  if (method === "GET" && pathname === "/robots.txt") {
    const base = siteUrl() || parseUrl(req).origin;
    sendText(res, `User-Agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /tiket\nDisallow: /akun\nDisallow: /sertifikat\nDisallow: /api\n\nSitemap: ${base}/sitemap.xml\n`);
    return true;
  }

  if (method === "GET" && pathname === "/sitemap.xml") {
    const base = siteUrl() || parseUrl(req).origin;
    const [events, articles] = await Promise.all([
      db.event.findMany({ where: { status: { not: "draft" } }, select: { slug: true, createdAt: true } }),
      db.article.findMany({ where: { published: true }, select: { slug: true, publishedAt: true } }),
    ]);
    const urls = [
      ...["", "/event", "/tentang", "/galeri", "/blog", "/kontak"].map((p) => `<url><loc>${base}${p}</loc></url>`),
      ...events.map((e) => `<url><loc>${base}/event/${e.slug}</loc><lastmod>${e.createdAt.toISOString()}</lastmod></url>`),
      ...articles.map((a) => `<url><loc>${base}/blog/${a.slug}</loc>${a.publishedAt ? `<lastmod>${a.publishedAt.toISOString()}</lastmod>` : ""}</url>`),
    ].join("");
    sendText(res, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, 200, "application/xml; charset=utf-8");
    return true;
  }

  if (method === "GET" && pathname === "/manifest.webmanifest") {
    const site = await cached("site", 10_000, getSite);
    sendJson(res, {
      name: site.name,
      short_name: site.name.length > 12 ? site.name.slice(0, 12) : site.name,
      description: site.tagline,
      lang: "id",
      start_url: "/dashboard",
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#15803d",
      icons: [
        { src: "/icon/192", sizes: "192x192", type: "image/png" },
        { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    }, 200, { "Content-Type": "application/manifest+json; charset=utf-8" });
    return true;
  }

  if (method === "GET" && (pathname === "/icon/192" || pathname === "/icon/512" || pathname === "/apple-icon")) {
    const size = pathname === "/icon/512" ? 512 : pathname === "/apple-icon" ? 180 : 192;
    const buf = await cached(`icon:${size}`, 3600_000, () => pngIcon(size, Math.round(size * 0.36)));
    sendBinary(res, buf, "image/png", { "Cache-Control": "public, max-age=86400" });
    return true;
  }

  return false;
}

