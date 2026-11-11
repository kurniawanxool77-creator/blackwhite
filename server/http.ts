import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

export type RouteParams = Record<string, string>;

export function getOrigin(req: IncomingMessage): string {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(",")[0]?.trim() || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5173";
  return `${proto}://${Array.isArray(host) ? host[0] : host}`;
}

export function parseUrl(req: IncomingMessage): URL {
  const url = new URL(req.url || "/", getOrigin(req));
  const rewritten = url.searchParams.get("__path");
  if (rewritten) {
    url.pathname = rewritten.startsWith("/") ? rewritten : `/${rewritten}`;
    url.searchParams.delete("__path");
  }
  return url;
}

export function matchPath(pattern: string, pathname: string): RouteParams | null {
  const a = pattern.split("/").filter(Boolean);
  const b = pathname.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: RouteParams = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

export function setCookieHeader(
  res: ServerResponse,
  name: string,
  value: string,
  opts: { maxAge?: number; httpOnly?: boolean; sameSite?: "Lax" | "Strict" | "None"; path?: string; secure?: boolean } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path ?? "/"}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  if (opts.secure) parts.push("Secure");
  const prev = res.getHeader("Set-Cookie");
  const next = Array.isArray(prev) ? [...prev, parts.join("; ")] : prev ? [String(prev), parts.join("; ")] : [parts.join("; ")];
  res.setHeader("Set-Cookie", next);
}

export async function readBodyText(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export async function readJson<T = Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  const text = await readBodyText(req);
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function readFormData(req: IncomingMessage): Promise<FormData> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    headers.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  const webReq = new Request(parseUrl(req).href, {
    method: req.method || "POST",
    headers,
    body: Readable.toWeb(req) as unknown as BodyInit,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  return webReq.formData();
}

export function sendJson(res: ServerResponse, data: unknown, status = 200, headers: Record<string, string> = {}) {
  const payload = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(payload);
}

export function sendText(res: ServerResponse, body: string, status = 200, contentType = "text/plain; charset=utf-8", headers: Record<string, string> = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body);
}

export function sendBinary(res: ServerResponse, data: Uint8Array | Buffer, mime: string, headers: Record<string, string> = {}) {
  res.statusCode = 200;
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Length", String(data.length));
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(Buffer.isBuffer(data) ? data : Buffer.from(data));
}

export function redirect(res: ServerResponse, location: string, status = 302) {
  res.statusCode = status;
  res.setHeader("Location", location);
  res.end();
}

export const queryArgs = (req: IncomingMessage) => parseUrl(req).searchParams.getAll("a");

export async function bodyArgs(req: IncomingMessage): Promise<unknown[]> {
  const q = queryArgs(req);
  if (q.length) return q;
  const b = await readJson<{ args?: unknown[] }>(req);
  return Array.isArray(b.args) ? b.args : [];
}
