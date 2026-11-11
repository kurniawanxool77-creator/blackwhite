import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { handleApiRequest } from "./app";
import { parseUrl } from "./http";

try {
  process.loadEnvFile?.();
} catch {
  // environment variables provided directly
}

const DIST_DIR = path.resolve(process.cwd(), "dist");
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function serveFile(res: import("node:http").ServerResponse, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(res);
}

const port = Number(process.env.PORT || 5173);

createServer(async (req, res) => {
  if (await handleApiRequest(req, res)) return;
  const { pathname } = parseUrl(req);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const asset = path.join(DIST_DIR, safePath);
  if (pathname !== "/" && existsSync(asset) && statSync(asset).isFile()) {
    serveFile(res, asset);
    return;
  }
  const index = path.join(DIST_DIR, "index.html");
  if (existsSync(index)) {
    serveFile(res, index);
    return;
  }
  res.writeHead(404);
  res.end("dist/index.html not built");
}).listen(port, () => {
  console.log(`BlackWhite Vite server ready at http://localhost:${port}`);
});

