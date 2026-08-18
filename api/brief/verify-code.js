import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "server_not_configured" });
      return;
    }

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      res.status(400).json({ valid: false });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("brief_access_codes")
      .select("id, client_name, revoked, expires_at")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      res.status(200).json({ valid: false });
      return;
    }

    const expired = data.expires_at && new Date(data.expires_at) < new Date();
    if (data.revoked || expired) {
      res.status(200).json({ valid: false });
      return;
    }

    res.status(200).json({ valid: true, clientName: data.client_name || null });
  } catch (error) {
    console.error("brief/verify-code crashed:", error);
    res.status(500).json({ valid: false });
  }
}
