import type { IncomingMessage, ServerResponse } from "node:http";
import { parseUrl, sendJson } from "./http";
import { handleAdmin } from "./routes/admin";
import { handleAdminRpc } from "./routes/admin-rpc";
import { handleAuth } from "./routes/auth";
import { handleMeta } from "./routes/meta";
import { handlePublic } from "./routes/public";
import { handleSuperadminPages } from "./routes/superadmin-pages";
import { handleSuperadminEventRpc } from "./routes/superadmin-rpc-events";
import { handleSuperadminLearningRpc } from "./routes/superadmin-rpc-learning";
import { handleSuperadminMiscRpc } from "./routes/superadmin-rpc-misc";
import { handleUser } from "./routes/user";

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const { pathname } = parseUrl(req);
  const method = req.method || "GET";
  try {
    if (await handleMeta(req, res, pathname)) return true;
    if (await handleAuth(req, res, pathname)) return true;
    if (await handlePublic(req, res, pathname)) return true;
    if (await handleUser(req, res, pathname)) return true;
    if (await handleAdmin(req, res, pathname)) return true;
    if (await handleAdminRpc(req, res, pathname)) return true;
    if (await handleSuperadminPages(req, res, pathname)) return true;
    if (method === "POST" && pathname.startsWith("/api/rpc/")) {
      const action = pathname.slice("/api/rpc/".length);
      if (await handleSuperadminEventRpc(req, res, action)) return true;
      if (await handleSuperadminLearningRpc(req, res, action)) return true;
      if (await handleSuperadminMiscRpc(req, res, action)) return true;
      sendJson(res, { error: `Aksi RPC tidak dikenal: ${action}` }, 404);
      return true;
    }
    if (pathname.startsWith("/api/")) {
      sendJson(res, { error: "Endpoint API tidak ditemukan." }, 404);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[API ERROR]", method, pathname, err);
    if (!res.headersSent) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan server.";
      sendJson(res, { error: msg, throwError: true }, 500);
    }
    return true;
  }
}

