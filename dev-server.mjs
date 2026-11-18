// Tiny local server: serves /public and the two API routes. `npm run dev` -> http://localhost:3000
// Reads .env.local if present (no dotenv dependency).

import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { handleSubmit, handleList, handleWishes } = await import("./lib/rsvp.js");

const PUBLIC = path.resolve("public");
const PORT = Number(process.env.PORT || 3000);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
};

function readJson(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 10_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve(null);
      }
    });
  });
}

function send(res, { status, body }) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname === "/api/rsvp") return send(res, await handleSubmit(req.method, await readJson(req)));
    if (url.pathname === "/api/wishes") return send(res, await handleWishes(req.method));
    if (url.pathname === "/api/rsvps") return send(res, await handleList(req.method, req.headers["x-admin-passcode"]));

    // Static files, with clean URLs (/admin -> admin.html) and no path traversal.
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/") rel = "/index.html";
    if (!path.extname(rel)) rel += ".html";
    const file = path.join(PUBLIC, rel);
    if (!file.startsWith(PUBLIC + path.sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const buf = await readFile(file);
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  })
  .listen(PORT, () => console.log(`RSVP running at http://localhost:${PORT}  (admin: /admin)`));
