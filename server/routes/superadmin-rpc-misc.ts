import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { requireAdmin } from "../auth";
import { invalidateCache } from "../cache";
import { parseUrl, readFormData, readJson, sendJson } from "../http";
import { audit } from "../../lib/audit";
import { db } from "../../lib/db";
import { digits, PHONE_RE, str, type FormState } from "../../lib/form";
import { fmtRupiah } from "../../lib/format";
import { hashPassword } from "../../lib/password";
import { DEFAULT_SITE, type Site } from "../../lib/site";
import { formatBankLine, splitBankLine } from "../../lib/site-defaults";
import { isImageUrl, isLinkUrl } from "../../lib/url";

const queryArgs = (req: IncomingMessage) => parseUrl(req).searchParams.getAll("a");
async function bodyArgs(req: IncomingMessage) {
  const q = queryArgs(req);
  if (q.length) return q;
  const b = await readJson<{ args?: unknown[] }>(req);
  return Array.isArray(b.args) ? b.args : [];
}

function readTeam(f: FormData) {
  const phone = str(f, "phone");
  if (phone && !PHONE_RE.test(phone)) return "No. HP hanya angka (boleh diawali +), 8–20 digit.";
  const duties = str(f, "duties").split(/\r?\n/).map((d) => d.trim()).filter(Boolean).slice(0, 20).join("\n");
  return { position: str(f, "position").slice(0, 80), phone: phone || null, duties };
}

async function readBanner(f: FormData) {
  const title = str(f, "title");
  const imageUrl = str(f, "imageUrl");
  const caption = str(f, "kind") !== "image";
  let linkUrl = str(f, "linkUrl");
  if (!title || !imageUrl) return "Judul dan gambar wajib diisi.";
  if (!isImageUrl(imageUrl)) return "Gambar tidak valid. Unggah ulang gambarnya.";
  if (caption) {
    const slug = str(f, "eventSlug");
    const event = slug ? await db.event.findUnique({ where: { slug }, select: { slug: true } }) : null;
    if (slug && !event) return "Event tidak ditemukan.";
    linkUrl = event ? `/event/${event.slug}` : "";
  } else if (linkUrl && !isLinkUrl(linkUrl)) {
    return "Tautan harus berupa alamat http(s) atau path internal seperti /event/nama-event.";
  }
  return { title, subtitle: caption ? str(f, "subtitle") : "", imageUrl, linkUrl: linkUrl || null, caption };
}

async function readTransaction(f: FormData) {
  const type = str(f, "type") === "out" ? "out" : "in";
  const amount = digits(f, "amount");
  const label = str(f, "label").slice(0, 120);
  const date = new Date(str(f, "date"));
  const eventId = str(f, "eventId") || null;
  if (!label) return "Keterangan wajib diisi.";
  if (amount <= 0 || amount > 100_000_000_000) return "Nominal tidak valid.";
  if (isNaN(+date)) return "Tanggal tidak valid.";
  if (eventId && !(await db.event.findUnique({ where: { id: eventId }, select: { id: true } }))) return "Event tidak ditemukan.";
  return { type, amount, label, note: str(f, "note").slice(0, 300), date, eventId };
}

export async function handleSuperadminMiscRpc(req: IncomingMessage, res: ServerResponse, action: string): Promise<boolean> {
  if (![
    "createAdmin", "setAdminEvents", "deleteAdmin", "toggleAdmin", "resetAdminPassword", "updateTeamProfile",
    "createCategory", "updateCategory", "deleteCategory",
    "createUser", "updateUser",
    "saveArticle", "deleteArticle",
    "createBanner", "updateBanner", "toggleBanner", "moveBanner", "deleteBanner",
    "createTransaction", "updateTransaction", "deleteTransaction",
    "deleteAttendance",
    "saveSite",
  ].includes(action)) return false;

  const admin = await requireAdmin(req, res, "superadmin");
  if (!admin) return true;

  if (action === "createAdmin") {
    const f = await readFormData(req);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    const role = f.get("role") === "superadmin" ? "superadmin" : "scanner";
    const eventIds = f.getAll("events").map(String);
    if (!name || !email) return sendJson(res, { result: "Nama dan email wajib diisi." }), true;
    if (password.length < 8) return sendJson(res, { result: "Password minimal 8 karakter." }), true;
    if (await db.admin.findUnique({ where: { email } })) return sendJson(res, { result: "Email sudah terdaftar sebagai admin." }), true;
    const team = readTeam(f);
    if (typeof team === "string") return sendJson(res, { result: team }), true;
    await db.admin.create({ data: { name, email, role, passwordHash: hashPassword(password), ...team, events: { connect: eventIds.map((id) => ({ id })) } } });
    await audit(admin, "Tambah admin", `${email} (${role})`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "setAdminEvents") {
    const [adminId] = queryArgs(req);
    const f = await readFormData(req);
    const eventIds = f.getAll("events").map(String);
    await db.admin.update({ where: { id: adminId }, data: { events: { set: eventIds.map((id) => ({ id })) } } });
    await audit(admin, "Ubah penugasan panitia", `${adminId} → ${eventIds.length} event`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteAdmin") {
    const [adminId] = await bodyArgs(req);
    if (admin.id !== adminId) {
      const target = await db.admin.findUnique({ where: { id: String(adminId) }, include: { _count: { select: { scans: true } } } });
      if (target && target._count.scans === 0) {
        await db.admin.delete({ where: { id: target.id } });
        await audit(admin, "Hapus anggota tim", `${target.name} (${target.email})`);
      }
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "toggleAdmin") {
    const [adminId] = await bodyArgs(req);
    if (admin.id !== adminId) {
      const target = await db.admin.findUniqueOrThrow({ where: { id: String(adminId) } });
      await db.admin.update({ where: { id: target.id }, data: { active: !target.active, failedLogins: 0, lockedUntil: null } });
      await audit(admin, target.active ? "Nonaktifkan admin" : "Aktifkan admin", target.email);
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "resetAdminPassword") {
    const [adminId] = queryArgs(req);
    const f = await readFormData(req);
    if (admin.id === adminId) return sendJson(res, { result: { ok: false, message: "Ganti password Anda sendiri di menu Akun." } satisfies FormState }), true;
    const password = String(f.get("password") ?? "");
    if (password.length < 8) return sendJson(res, { result: { ok: false, message: "Minimal 8 karakter." } satisfies FormState }), true;
    const target = await db.admin.update({ where: { id: adminId }, data: { passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null } });
    await audit(admin, "Reset password admin", target.email);
    return sendJson(res, { result: { ok: true, message: "Password diganti. Beri tahu yang bersangkutan." } satisfies FormState }), true;
  }

  if (action === "updateTeamProfile") {
    const [adminId] = queryArgs(req);
    const f = await readFormData(req);
    const name = str(f, "name");
    if (!name) return sendJson(res, { result: { ok: false, message: "Nama wajib diisi." } satisfies FormState }), true;
    const team = readTeam(f);
    if (typeof team === "string") return sendJson(res, { result: { ok: false, message: team } satisfies FormState }), true;
    const target = await db.admin.update({ where: { id: adminId }, data: { name, ...team } });
    await audit(admin, "Ubah data tim", target.email);
    return sendJson(res, { result: { ok: true, message: "Tersimpan." } satisfies FormState }), true;
  }

  if (action === "createCategory") {
    const f = await readFormData(req);
    const name = str(f, "name").slice(0, 60);
    if (!name) return sendJson(res, { result: "Nama kategori wajib diisi." }), true;
    if (await db.category.findUnique({ where: { name } })) return sendJson(res, { result: "Kategori sudah ada." }), true;
    await db.category.create({ data: { name, description: str(f, "description").slice(0, 200) } });
    await audit(admin, "Tambah kategori", name);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateCategory") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const name = str(f, "name").slice(0, 60);
    const cat = await db.category.findUnique({ where: { id } });
    if (!cat) return sendJson(res, { result: "Kategori tidak ditemukan." }), true;
    if (!name) return sendJson(res, { result: "Nama kategori wajib diisi." }), true;
    if (name !== cat.name && (await db.category.findUnique({ where: { name } }))) return sendJson(res, { result: "Nama kategori sudah dipakai." }), true;
    await db.$transaction([
      db.category.update({ where: { id }, data: { name, description: str(f, "description").slice(0, 200) } }),
      db.event.updateMany({ where: { category: cat.name }, data: { category: name } }),
    ]);
    await audit(admin, "Ubah kategori", cat.name === name ? name : `${cat.name} → ${name}`);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteCategory") {
    const [id] = await bodyArgs(req);
    const cat = await db.category.findUnique({ where: { id: String(id) } });
    if (cat) {
      const [moved] = await db.$transaction([db.event.updateMany({ where: { category: cat.name }, data: { category: "" } }), db.category.delete({ where: { id: cat.id } })]);
      await audit(admin, "Hapus kategori", `${cat.name} · ${moved.count} event jadi tanpa kategori`);
      invalidateCache("public:");
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "createUser") {
    const f = await readFormData(req);
    const name = str(f, "name");
    const email = str(f, "email").toLowerCase();
    const phone = str(f, "phone") || null;
    const organization = str(f, "organization") || null;
    const isGoogle = (str(f, "accountType") || "credentials") === "google";
    const password = str(f, "password");
    if (!name || !email) return sendJson(res, { throwError: true, error: "Nama dan email wajib diisi." }, 400), true;
    if (!/^\S+@\S+\.\S+$/.test(email)) return sendJson(res, { throwError: true, error: "Format email tidak valid." }, 400), true;
    if (!isGoogle && (!password || password.length < 6)) return sendJson(res, { throwError: true, error: "Password minimal 6 karakter untuk akun non-Google." }, 400), true;
    if (password && password.length < 6) return sendJson(res, { throwError: true, error: "Password minimal 6 karakter jika diisi." }, 400), true;
    if (await db.user.findUnique({ where: { email } })) return sendJson(res, { throwError: true, error: `Email ${email} sudah terdaftar.` }, 400), true;
    const user = await db.user.create({ data: { name, email, phone, organization, passwordHash: password ? hashPassword(password) : null, emailVerified: isGoogle } });
    await audit(admin, "Tambah user", `${user.name} (${user.email}) - ${isGoogle ? "Akun Google" : "Manual"}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateUser") {
    const [userId] = queryArgs(req);
    const f = await readFormData(req);
    const name = str(f, "name");
    const email = str(f, "email").toLowerCase();
    const phone = str(f, "phone") || null;
    const organization = str(f, "organization") || null;
    const accountType = str(f, "accountType");
    const password = str(f, "password");
    if (!name || !email) return sendJson(res, { throwError: true, error: "Nama dan email wajib diisi." }, 400), true;
    if (!/^\S+@\S+\.\S+$/.test(email)) return sendJson(res, { throwError: true, error: "Format email tidak valid." }, 400), true;
    if (await db.user.findFirst({ where: { email, id: { not: userId } } })) return sendJson(res, { throwError: true, error: `Email ${email} sudah digunakan akun lain.` }, 400), true;
    const data: Record<string, unknown> = { name, email, phone, organization };
    if (accountType) data.emailVerified = accountType === "google";
    if (password) {
      if (password.length < 6) return sendJson(res, { throwError: true, error: "Password minimal 6 karakter." }, 400), true;
      data.passwordHash = hashPassword(password);
      data.failedLogins = 0;
      data.lockedUntil = null;
    }
    const user = await db.user.update({ where: { id: userId }, data });
    await audit(admin, "Ubah data user", `${user.name} (${user.email})`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "saveArticle") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const title = s("title");
    const content = s("content");
    const coverUrl = s("coverUrl");
    const published = f.get("published") === "on";
    if (!title || !content) return sendJson(res, { result: "Judul dan isi wajib diisi." }), true;
    if (coverUrl && !isImageUrl(coverUrl)) return sendJson(res, { result: "Gambar sampul tidak valid. Unggah ulang gambarnya." }), true;
    const data = { title, content, excerpt: s("excerpt"), coverUrl: coverUrl || null, published };
    if (id && id !== "null") {
      const current = await db.article.findUniqueOrThrow({ where: { id } });
      await db.article.update({ where: { id }, data: { ...data, publishedAt: published ? (current.publishedAt ?? new Date()) : current.publishedAt } });
    } else {
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
      await db.article.create({ data: { ...data, slug: `${base}-${randomBytes(2).toString("hex")}`, publishedAt: published ? new Date() : null } });
    }
    invalidateCache("public:");
    return sendJson(res, { result: null, redirect: "/superadmin/articles" }), true;
  }

  if (action === "deleteArticle") {
    const [id] = await bodyArgs(req);
    await db.article.delete({ where: { id: String(id) } });
    invalidateCache("public:");
    return sendJson(res, { result: null, redirect: "/superadmin/articles" }), true;
  }

  if (action === "createBanner") {
    const f = await readFormData(req);
    const data = await readBanner(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const last = await db.banner.findFirst({ orderBy: { order: "desc" } });
    await db.banner.create({ data: { ...data, order: (last?.order ?? 0) + 1 } });
    await audit(admin, "Tambah banner", data.title);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateBanner") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const data = await readBanner(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    await db.banner.update({ where: { id }, data });
    await audit(admin, "Ubah banner", data.title);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "toggleBanner") {
    const [id] = await bodyArgs(req);
    const banner = await db.banner.findUniqueOrThrow({ where: { id: String(id) } });
    await db.banner.update({ where: { id: banner.id }, data: { active: !banner.active } });
    await audit(admin, banner.active ? "Sembunyikan banner" : "Tampilkan banner", banner.title);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "moveBanner") {
    const [id, direction] = await bodyArgs(req);
    const banner = await db.banner.findUniqueOrThrow({ where: { id: String(id) } });
    const neighbor = await db.banner.findFirst({
      where: { order: direction === "up" ? { lt: banner.order } : { gt: banner.order } },
      orderBy: { order: direction === "up" ? "desc" : "asc" },
    });
    if (neighbor) {
      await db.$transaction([
        db.banner.update({ where: { id: banner.id }, data: { order: neighbor.order } }),
        db.banner.update({ where: { id: neighbor.id }, data: { order: banner.order } }),
      ]);
      invalidateCache("public:");
    }
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteBanner") {
    const [id] = await bodyArgs(req);
    const banner = await db.banner.delete({ where: { id: String(id) } });
    await audit(admin, "Hapus banner", banner.title);
    invalidateCache("public:");
    return sendJson(res, { result: null }), true;
  }

  if (action === "createTransaction") {
    const f = await readFormData(req);
    const data = await readTransaction(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    await db.transaction.create({ data: { ...data, adminName: admin.name } });
    await audit(admin, data.type === "in" ? "Catat pemasukan" : "Catat pengeluaran", `${data.label} · ${fmtRupiah(data.amount)}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "updateTransaction") {
    const [id] = queryArgs(req);
    const f = await readFormData(req);
    const data = await readTransaction(f);
    if (typeof data === "string") return sendJson(res, { result: data }), true;
    const before = await db.transaction.findUnique({ where: { id } });
    if (!before) return sendJson(res, { result: "Transaksi tidak ditemukan." }), true;
    await db.transaction.update({ where: { id }, data });
    await audit(admin, "Ubah transaksi", `${before.label} ${fmtRupiah(before.amount)} → ${data.label} ${fmtRupiah(data.amount)}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteTransaction") {
    const [id] = await bodyArgs(req);
    const t = await db.transaction.delete({ where: { id: String(id) } });
    await audit(admin, "Hapus transaksi", `${t.label} · ${fmtRupiah(t.amount)}`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "deleteAttendance") {
    const [id] = await bodyArgs(req);
    const attendanceId = String(id ?? "").trim();
    if (!attendanceId) return sendJson(res, { error: "ID absensi tidak valid.", throwError: true }, 400), true;
    const att = await db.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        admin: { select: { name: true } },
        event: { select: { name: true } },
      },
    });
    if (!att) return sendJson(res, { error: "Data absensi tidak ditemukan.", throwError: true }, 404), true;
    await db.attendance.delete({ where: { id: attendanceId } });
    await audit(admin, "Hapus absensi tim", `${att.admin?.name ?? "Panitia"} · ${att.event?.name ?? "Event"} (${att.date})`);
    return sendJson(res, { result: null }), true;
  }

  if (action === "saveSite") {
    const f = await readFormData(req);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const image = (v: string) => (isImageUrl(v) ? v : "");
    const bankRows = s("banks").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 10).map(splitBankLine);
    if (bankRows.some((b) => !b.bank || !b.number)) {
      return sendJson(res, { error: "Setiap rekening pembayaran wajib memiliki nama bank dan nomor rekening.", throwError: true }, 400), true;
    }
    const site: Site = {
      name: s("name") || DEFAULT_SITE.name,
      tagline: s("tagline"),
      about: s("about"),
      heroImage: image(s("heroImage")),
      aboutImage: image(s("aboutImage")),
      loginImage: image(s("loginImage")),
      logoImage: image(s("logoImage")) || "/logo.png",
      services: [0, 1, 2].map((i) => ({ title: s(`service${i}Title`), body: s(`service${i}Body`), image: image(s(`service${i}Image`)) })).filter((x) => x.title),
      steps: s("steps").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      contact: { email: s("email"), phone: s("phone"), address: s("address") },
      banks: bankRows.map(formatBankLine).filter(Boolean),
    };
    const value = JSON.stringify(site);
    await db.setting.upsert({ where: { key: "site" }, update: { value }, create: { key: "site", value } });
    await audit(admin, "Ubah halaman depan");
    invalidateCache();
    return sendJson(res, { result: "Tersimpan. Halaman depan sudah diperbarui." }), true;
  }

  return false;
}

