import type { IncomingMessage, ServerResponse } from "node:http";

export type RouteParams = Record<string, string>;

export function getOrigin(req: IncomingMessage): string {
  const envUrl = (process.env.APP_URL || process.env.SITE_URL || process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "";
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(",")[0].trim();
  const isLocalHost = !host || host.includes("localhost") || host.includes("127.0.0.1");

  if (envUrl) {
    try {
      const parsedEnv = new URL(envUrl);
      if (!host || host === parsedEnv.host || isLocalHost === (parsedEnv.hostname === "localhost" || parsedEnv.hostname === "127.0.0.1")) {
        return envUrl;
      }
    } catch {
      // ignore invalid env URL
    }
  }

  const protoHeader = req.headers["x-forwarded-proto"];
  let proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(",")[0]?.trim();

  if (process.env.VERCEL === "1" || (!isLocalHost && (!proto || proto === "http"))) {
    proto = "https";
  } else if (!proto) {
    proto = isLocalHost ? "http" : "https";
  }

  const resolvedHost = host || (process.env.VERCEL_URL ? process.env.VERCEL_URL : "localhost:5173");
  return `${proto}://${resolvedHost}`;
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

export async function readBodyBuffer(req: IncomingMessage): Promise<Buffer> {
  if (req.readableEnded) {
    const r = req as IncomingMessage & { body?: unknown; rawBody?: unknown };
    if (Buffer.isBuffer(r.rawBody)) return r.rawBody;
    if (Buffer.isBuffer(r.body)) return r.body;
    if (typeof r.body === "string") return Buffer.from(r.body, "utf8");
    if (r.body !== undefined) return Buffer.from(JSON.stringify(r.body), "utf8");
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export async function readBodyText(req: IncomingMessage): Promise<string> {
  return (await readBodyBuffer(req)).toString("utf8");
}

export async function readJson<T = Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  if (req.readableEnded) {
    const preParsed = (req as IncomingMessage & { body?: unknown }).body;
    if (preParsed && typeof preParsed === "object" && !Buffer.isBuffer(preParsed)) {
      return preParsed as T;
    }
  }
  const text = await readBodyText(req);
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function readFormData(req: IncomingMessage): Promise<FormData> {
  if (req.readableEnded) {
    const preParsed = (req as IncomingMessage & { body?: unknown }).body;
    if (preParsed && typeof preParsed === "object" && !Buffer.isBuffer(preParsed)) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(preParsed as Record<string, unknown>)) {
        if (Array.isArray(v)) v.forEach((x) => fd.append(k, String(x ?? "")));
        else if (v !== undefined && v !== null) fd.append(k, String(v));
      }
      return fd;
    }
  }
  const rawCt = req.headers["content-type"];
  const contentType = (Array.isArray(rawCt) ? rawCt[0] : rawCt) || "";
  if (!contentType) return new FormData();
  const body = await readBodyBuffer(req);
  return new Response(new Uint8Array(body), { headers: { "content-type": contentType } }).formData();
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
