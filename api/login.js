export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { email, password } = req.body || {};
  const allowedEmail = "hayeslacoste@gmail.com";
  const secretPassword = process.env.SITE_PASSWORD;

  if (
    secretPassword &&
    typeof email === "string" &&
    email.trim().toLowerCase() === allowedEmail &&
    password === secretPassword
  ) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}
