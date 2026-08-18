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
      const { data, error } = await supabase
        .from("briefs")
        .select("*, brief_access_codes(code, client_name)")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(502).json({ error: "database_read_failed" });
        return;
      }

      res.status(200).json({ briefs: data });
      return;
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body || {};
      if (!id || !status) {
        res.status(400).json({ error: "missing_id_or_status" });
        return;
      }

      const { error } = await supabase.from("briefs").update({ status }).eq("id", id);
      if (error) {
        res.status(502).json({ error: "database_update_failed" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/briefs crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}
