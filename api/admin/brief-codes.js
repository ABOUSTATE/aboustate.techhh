import { createClient } from "@supabase/supabase-js";
import { isAuthenticated } from "../_lib/adminAuth.js";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — avoids read-back confusion

function generateCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

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
      const { data: codes, error } = await supabase
        .from("brief_access_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(502).json({ error: "database_read_failed" });
        return;
      }

      const { data: briefCounts } = await supabase.from("briefs").select("access_code_id");
      const counts = {};
      (briefCounts || []).forEach((b) => {
        if (b.access_code_id) counts[b.access_code_id] = (counts[b.access_code_id] || 0) + 1;
      });

      res.status(200).json({
        codes: codes.map((c) => ({ ...c, briefCount: counts[c.id] || 0 })),
      });
      return;
    }

    if (req.method === "POST") {
      const { clientName, clientEmail, userId, serviceRequestId, expiresAt } = req.body || {};

      let code = generateCode();
      // Extremely unlikely collision given the alphabet/length, but guard anyway.
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from("brief_access_codes")
          .select("id")
          .eq("code", code)
          .maybeSingle();
        if (!existing) break;
        code = generateCode();
      }

      const { data, error } = await supabase
        .from("brief_access_codes")
        .insert({
          code,
          client_name: clientName || null,
          client_email: clientEmail || null,
          user_id: userId || null,
          service_request_id: serviceRequestId || null,
          expires_at: expiresAt || null,
        })
        .select("*")
        .single();

      if (error) {
        res.status(502).json({ error: "database_insert_failed", detail: error.message });
        return;
      }

      res.status(200).json({ accessCode: data });
      return;
    }

    if (req.method === "PATCH") {
      const { id, revoked } = req.body || {};
      if (!id) {
        res.status(400).json({ error: "missing_id" });
        return;
      }

      const { error } = await supabase
        .from("brief_access_codes")
        .update({ revoked: Boolean(revoked) })
        .eq("id", id);

      if (error) {
        res.status(502).json({ error: "database_update_failed" });
        return;
      }

      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/brief-codes crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}
