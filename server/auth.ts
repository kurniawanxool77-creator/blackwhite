import crypto from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Admin } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/roles";
import { getOrigin, parseCookies, sendJson, setCookieHeader } from "./http";

export type SessionUser = { id: string; name: string; email: string; role: Role };

const COOKIE_NAME = "bw_session";
const OAUTH_STATE_COOKIE = "bw_oauth_state";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

const secret = () => process.env.NEXTAUTH_SECRET || "blackwhite-dev-secret-change-in-env";
const b64u = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const unb64u = (s: string) => Buffer.from(s, "base64url");

function sign(payload: object): string {
  const data = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify<T>(token: string | undefined): T | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", secret()).update(data).digest();
  let actual: Buffer;
  try {
    actual = unb64u(sig);
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const parsed = JSON.parse(unb64u(data).toString("utf8")) as T & { exp?: number };
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getSessionUser(req: IncomingMessage): SessionUser | null {
  const raw = parseCookies(req)[COOKIE_NAME];
  const parsed = verify<SessionUser & { exp: number }>(raw);
  return parsed ? { id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role } : null;
}

export function writeSessionCookie(res: ServerResponse, req: IncomingMessage, user: SessionUser) {
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
  setCookieHeader(res, COOKIE_NAME, sign({ ...user, exp: Date.now() + MAX_AGE_SEC * 1000 }), {
    maxAge: MAX_AGE_SEC,
    httpOnly: true,
    sameSite: "Lax",
    secure,
  });
}

export function clearSessionCookie(res: ServerResponse, req: IncomingMessage) {
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
  setCookieHeader(res, COOKIE_NAME, "", { maxAge: 0, httpOnly: true, sameSite: "Lax", secure });
}

export async function getActiveAdmin(req: IncomingMessage): Promise<Admin | null> {
  const user = getSessionUser(req);
  if (!user || (user.role !== "superadmin" && user.role !== "scanner")) return null;
  const admin = await db.admin.findUnique({ where: { id: user.id } });
  return admin?.active ? admin : null;
}

export function requireUser(req: IncomingMessage, res: ServerResponse): SessionUser | null {
  const user = getSessionUser(req);
  if (!user || user.role !== "user") {
    sendJson(res, { error: "Silakan masuk terlebih dahulu." }, 401);
    return null;
  }
  return user;
}

export async function requireAdmin(req: IncomingMessage, res: ServerResponse, role?: "superadmin" | "scanner"): Promise<Admin | null> {
  const admin = await getActiveAdmin(req);
  if (!admin) {
    sendJson(res, { error: "Tidak diizinkan." }, 401);
    return null;
  }
  if (role === "superadmin" && admin.role !== "superadmin") {
    sendJson(res, { error: "Akses ditolak." }, 403);
    return null;
  }
  return admin;
}

async function bootstrapSuperadmin(email: string, password: string) {
  const { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;
  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) return null;
  if (email !== SUPERADMIN_EMAIL.toLowerCase() || password !== SUPERADMIN_PASSWORD) return null;
  if ((await db.admin.count({ where: { role: "superadmin" } })) > 0) return null;
  return db.admin.create({
    data: { email, name: "Superadmin", role: "superadmin", passwordHash: hashPassword(password) },
  });
}

export async function authenticateUser(emailRaw: string, password: string): Promise<SessionUser | null> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) return null;
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, name: user.name, email: user.email, role: "user" };
}

export async function authenticateAdmin(emailRaw: string, password: string, portalRaw: string): Promise<SessionUser | null> {
  const email = emailRaw.trim().toLowerCase();
  const portal = portalRaw === "superadmin" ? "superadmin" : "scanner";
  if (!email || !password) return null;
  const admin =
    (await db.admin.findUnique({ where: { email } })) ??
    (portal === "superadmin" ? await bootstrapSuperadmin(email, password) : null);
  if (!admin?.active || !verifyPassword(password, admin.passwordHash) || admin.role !== portal) return null;
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role as "superadmin" | "scanner" };
}

export function startGoogleOAuth(req: IncomingMessage, res: ServerResponse, callbackUrl: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return `${callbackUrl || "/login"}?error=GoogleNotConfigured`;
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  const safeCb = callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
  const state = sign({ nonce, callbackUrl: safeCb, exp: Date.now() + 10 * 60_000 });
  const secure = req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
  setCookieHeader(res, OAUTH_STATE_COOKIE, nonce, { maxAge: 600, httpOnly: true, sameSite: "Lax", secure });
  const redirectUri = `${getOrigin(req)}/api/auth/callback/google`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function finishGoogleOAuth(req: IncomingMessage, res: ServerResponse, code: string, stateToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return "/login?error=GoogleNotConfigured";
  const state = verify<{ nonce: string; callbackUrl: string }>(stateToken);
  const cookieNonce = parseCookies(req)[OAUTH_STATE_COOKIE];
  if (!state || !cookieNonce || state.nonce !== cookieNonce) return "/login?error=OAuthState";

  const redirectUri = `${getOrigin(req)}/api/auth/callback/google`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!tokenRes.ok) return "/login?error=OAuthToken";
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return "/login?error=OAuthToken";

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return "/login?error=OAuthProfile";
  const profile = (await profileRes.json()) as { email?: string; name?: string; picture?: string };
  if (!profile.email) return "/login?error=OAuthEmail";

  const email = profile.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  const dbUser = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: { image: profile.picture ?? existing.image, emailVerified: true, ...(existing.emailVerified ? {} : { passwordHash: null }) },
      })
    : await db.user.create({ data: { email, name: profile.name ?? email, image: profile.picture ?? null, emailVerified: true } });

  writeSessionCookie(res, req, { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: "user" });
  return state.callbackUrl || "/dashboard";
}

