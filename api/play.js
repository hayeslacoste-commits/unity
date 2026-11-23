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
  ".svg": "image/svg+xml"
};

export default function handler(req, res) {
  const allowedEmail = "hayeslacoste@gmail.com";
  const authSecret = process.env.AUTH_SECRET || process.env.SITE_PASSWORD;

  // 1. Extract portal_auth cookie safely without array brackets
  const cookieHeader = req.headers.cookie || "";
  const portalCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("portal_auth="));
  const userToken = portalCookie ? portalCookie.slice("portal_auth=".length) : "";

  const expectedToken = authSecret
    ? crypto.createHmac("sha256", authSecret).update(allowedEmail).digest("hex")
    : "";

  if (!userToken || !expectedToken || userToken !== expectedToken) {
    return res.redirect(302, "/");
  }

  // 2. Resolve requested file safely inside _games/
  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";
  const cleanPath = decodeURIComponent(rawPath).replace(/\.\./g, "").replace(/\/+$/, "");
  const baseDir = path.join(process.cwd(), "_games");
  let filePath = path.join(baseDir, cleanPath);

  if (!filePath.startsWith(baseDir)) {
    return res.status(403).send("Forbidden");
  }

  let isDirectoryIndex = false;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
    isDirectoryIndex = true;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send("Not found");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");

  if (isDirectoryIndex && ext === ".html") {
    let html = fs.readFileSync(filePath, "utf8");
    const baseTag = `<base href="${encodeURI(`/play/${cleanPath}/`)}">`;
    html = html.replace(/<head>/i, `<head>\n  ${baseTag}`);
    return res.send(html);
  }

  return res.send(fs.readFileSync(filePath));
}
