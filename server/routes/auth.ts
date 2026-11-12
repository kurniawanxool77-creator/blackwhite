import type { IncomingMessage, ServerResponse } from "node:http";
import { db } from "../../lib/db";
import { PHONE_RE, str } from "../../lib/form";
import { hashPassword } from "../../lib/password";
import { adminProfile, userProfile } from "../../lib/profile";
import {
  authenticateAdmin,
  authenticateUser,
  clearSessionCookie,
  finishGoogleOAuth,
  getActiveAdmin,
  getSessionUser,
  startGoogleOAuth,
  writeSessionCookie,
} from "../auth";
import { invalidateCache } from "../cache";
import { parseUrl, readFormData, readJson, redirect, sendJson } from "../http";

export async function handleAuth(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
  const method = req.method || "GET";

  // Variabel yang sama dengan yang dipakai startGoogleOAuth/finishGoogleOAuth (server/auth.ts).
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  if (method === "GET" && pathname === "/api/auth/session") {
    const user = getSessionUser(req);
    if (!user) return sendJson(res, { user: null, profile: null, googleEnabled }), true;
    if (user.role === "user") {
      const profile = await userProfile(user.id);
      if (!profile) {
        clearSessionCookie(res, req);
        return sendJson(res, { user: null, profile: null, googleEnabled }), true;
      }
      return sendJson(res, { user, profile, googleEnabled }), true;
    }
    const admin = await getActiveAdmin(req);
    if (!admin) {
      clearSessionCookie(res, req);
      return sendJson(res, { user: null, profile: null, googleEnabled }), true;
    }
    const profile = await adminProfile(admin);
    return sendJson(res, { user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, profile, googleEnabled }), true;
  }

  if (method === "POST" && pathname === "/api/auth/login/user") {
    const body = await readJson<{ email?: string; password?: string }>(req);
    const user = await authenticateUser(body.email ?? "", body.password ?? "");
    if (!user) return sendJson(res, { ok: false, error: "Email atau password salah." }, 401), true;
    writeSessionCookie(res, req, user);
    sendJson(res, { ok: true, user });
    return true;
  }

  if (method === "POST" && pathname === "/api/auth/login/admin") {
    const body = await readJson<{ email?: string; password?: string; portal?: string }>(req);
    const user = await authenticateAdmin(body.email ?? "", body.password ?? "", body.portal ?? "scanner");
    if (!user) return sendJson(res, { ok: false, error: "Email atau password salah, akun nonaktif, atau bukan akses halaman ini." }, 401), true;
    writeSessionCookie(res, req, user);
    sendJson(res, { ok: true, user });
    return true;
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    clearSessionCookie(res, req);
    sendJson(res, { ok: true });
    return true;
  }

  if (method === "GET" && pathname === "/api/auth/google") {
    const cb = parseUrl(req).searchParams.get("callbackUrl") || "/dashboard";
    redirect(res, startGoogleOAuth(req, res, cb));
    return true;
  }

  if (method === "GET" && pathname === "/api/auth/callback/google") {
    const url = parseUrl(req);
    const code = url.searchParams.get("code") || "";
    const state = url.searchParams.get("state") || "";
    const target = await finishGoogleOAuth(req, res, code, state);
    redirect(res, target);
    return true;
  }

  if (method === "POST" && pathname === "/api/rpc/registerUser") {
    const f = await readFormData(req);
    const name = str(f, "name");
    const email = str(f, "email").toLowerCase();
    const phone = str(f, "phone");
    const password = String(f.get("password") ?? "");
    if (!name || name.length > 100) return sendJson(res, { result: { ok: false, message: "Nama wajib diisi (maks. 100 karakter)." } }), true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return sendJson(res, { result: { ok: false, message: "Format email tidak valid." } }), true;
    if (!PHONE_RE.test(phone)) return sendJson(res, { result: { ok: false, message: "No. HP hanya angka (boleh diawali +), 8–20 digit." } }), true;
    if (password.length < 8) return sendJson(res, { result: { ok: false, message: "Password minimal 8 karakter." } }), true;
    if (password !== String(f.get("confirm") ?? "")) return sendJson(res, { result: { ok: false, message: "Konfirmasi password tidak sama." } }), true;
    if (await db.user.findUnique({ where: { email } })) {
      return sendJson(res, { result: { ok: false, message: "Email ini sudah terdaftar. Silakan masuk, atau gunakan tombol Google bila akun dibuat dengan Google." } }), true;
    }
    await db.user.create({ data: { name, email, phone, passwordHash: hashPassword(password) } });
    invalidateCache();
    sendJson(res, { result: { ok: true, message: "Akun dibuat." } });
    return true;
  }

  return false;
}
