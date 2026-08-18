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

    const { code, data } = req.body || {};
    if (!code || !data || !data.contact_name || !data.contact_email) {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Always re-validate server-side — never trust that the client only
    // reached this point via the passcode gate.
    const { data: accessCode, error: codeError } = await supabase
      .from("brief_access_codes")
      .select("id, revoked, expires_at, user_id, service_request_id")
      .eq("code", String(code).trim().toUpperCase())
      .maybeSingle();

    if (codeError || !accessCode) {
      res.status(401).json({ error: "invalid_code" });
      return;
    }
    const expired = accessCode.expires_at && new Date(accessCode.expires_at) < new Date();
    if (accessCode.revoked || expired) {
      res.status(401).json({ error: "code_revoked_or_expired" });
      return;
    }

    const referenceNumber = await generateReferenceNumber(supabase);
    const services = Array.isArray(data.service) ? data.service : data.service ? [data.service] : [];

    const { error: insertError } = await supabase.from("briefs").insert({
      reference_number: referenceNumber,
      access_code_id: accessCode.id,
      user_id: accessCode.user_id,
      service_request_id: accessCode.service_request_id,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      company_name: data.company_name || null,
      services,
      data,
    });

    if (insertError) {
      console.error("brief insert failed:", insertError);
      res.status(502).json({ error: "database_insert_failed" });
      return;
    }

    res.status(200).json({ success: true, referenceNumber });
  } catch (error) {
    console.error("brief/submit crashed:", error);
    res.status(500).json({ error: "unexpected_error" });
  }
}

async function generateReferenceNumber(supabase) {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("briefs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`);

  const sequence = String((count || 0) + 1).padStart(4, "0");
  return `BRF-${year}-${sequence}`;
}
