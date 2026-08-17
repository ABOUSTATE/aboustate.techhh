import { Resend } from "resend";

export default function handler(req, res) {
  res.status(200).json({ ok: true, hasClient: typeof Resend === "function" });
}
