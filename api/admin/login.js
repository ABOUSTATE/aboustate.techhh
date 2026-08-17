import crypto from "node:crypto";
import { setSessionCookie } from "../_lib/adminAuth.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!password || !expected) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }

  const a = Buffer.from(String(password));
  const b = Buffer.from(expected);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!matches) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }

  setSessionCookie(res);
  res.status(200).json({ ok: true });
}
