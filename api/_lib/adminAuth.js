import crypto from "node:crypto";

const COOKIE_NAME = "admin_session";

function sessionValue() {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "")
    .update(process.env.ADMIN_PASSWORD || "")
    .digest("hex");
}

export function setSessionCookie(res) {
  const value = sessionValue();
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export function isAuthenticated(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const provided = cookies[COOKIE_NAME];
  if (!provided) return false;

  const expected = sessionValue();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
