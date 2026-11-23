import crypto from "node:crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { email, password } = req.body || {};
  const allowedEmail = "hayeslacoste@gmail.com";
  const secretPassword = process.env.SITE_PASSWORD;
  const authSecret = process.env.AUTH_SECRET || secretPassword;

  if (
    secretPassword &&
    typeof email === "string" &&
    email.trim().toLowerCase() === allowedEmail &&
    password === secretPassword
  ) {
    const token = crypto
      .createHmac("sha256", authSecret)
      .update(allowedEmail)
      .digest("hex");

    res.setHeader(
      "Set-Cookie",
      `portal_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}
