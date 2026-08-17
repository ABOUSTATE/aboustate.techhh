import { createClient } from "@supabase/supabase-js";

export default function handler(req, res) {
  res.status(200).json({ ok: true, hasClient: typeof createClient === "function" });
}
