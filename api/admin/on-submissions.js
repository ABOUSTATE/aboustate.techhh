import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  try {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "server_not_configured" });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === "GET") {
      const [talentResult, directorResult] = await Promise.all([
        supabase.from("on_talent_signups").select("*").order("created_at", { ascending: false }),
        supabase.from("on_director_briefs").select("*").order("created_at", { ascending: false }),
      ]);

      if (talentResult.error || directorResult.error) {
        res.status(502).json({ error: "database_read_failed" });
        return;
      }

      res.status(200).json({ talent: talentResult.data, directors: directorResult.data });
      return;
    }

    if (req.method === "PATCH") {
      const { table, id, status } = req.body || {};
      if (!["on_talent_signups", "on_director_briefs"].includes(table) || !id || !status) {
        res.status(400).json({ error: "invalid_payload" });
        return;
      }

      const { error } = await supabase.from(table).update({ status }).eq("id", id);
      if (error) {
        res.status(502).json({ error: "database_update_failed" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/on-submissions crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}
