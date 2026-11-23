import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".data": "application/octet-stream",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".symbols.json": "application/json"
};

export default function handler(req, res) {
  const allowedEmail = "hayeslacoste@gmail.com";
  const authSecret = process.env.AUTH_SECRET || process.env.SITE_PASSWORD;

  // 1. Check for valid login cookie
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:^|;\s*)portal_auth=([a-f0-9]+)/);
  const expectedToken = authSecret
    ? crypto.createHmac("sha256", authSecret).update(allowedEmail).digest("hex")
    : null;

  if (!match || !expectedToken || match[1] !== expectedToken) {
    return res.redirect(302, "/");
  }

  // 2. Resolve requested file safely inside _games/
  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";
  const cleanPath = decodeURIComponent(rawPath).replace(/\.\./g, "");
  const baseDir = path.join(process.cwd(), "_games");
  let filePath = path.join(baseDir, cleanPath);

  if (!filePath.startsWith(baseDir)) {
    return res.status(403).send("Forbidden");
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send("Not found");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  return res.send(fs.readFileSync(filePath));
}
