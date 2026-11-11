import type { IncomingMessage, ServerResponse } from "node:http";
import { handleApiRequest } from "../server/app";
import { sendJson } from "../server/http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const handled = await handleApiRequest(req, res);
  if (!handled && !res.headersSent) {
    sendJson(res, { error: "Endpoint tidak ditemukan." }, 404);
  }
}

