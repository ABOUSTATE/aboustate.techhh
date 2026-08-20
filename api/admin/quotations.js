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
      const { serviceRequestId } = req.query;
      let query = supabase.from("quotations").select("*").order("created_at", { ascending: false });
      if (serviceRequestId) query = query.eq("service_request_id", serviceRequestId);

      const { data, error } = await query;
      if (error) {
        res.status(502).json({ error: "database_read_failed" });
        return;
      }
      res.status(200).json({ quotations: data });
      return;
    }

    if (req.method === "POST") {
      const {
        serviceRequestId,
        clientName,
        clientEmail,
        lineItems,
        subtotal,
        discount,
        taxRate,
        total,
        currency,
        validUntil,
        notes,
      } = req.body || {};

      if (!clientName || !clientEmail || !Array.isArray(lineItems)) {
        res.status(400).json({ error: "invalid_payload" });
        return;
      }

      const quoteNumber = await generateQuoteNumber(supabase);

      const { data, error } = await supabase
        .from("quotations")
        .insert({
          service_request_id: serviceRequestId || null,
          quote_number: quoteNumber,
          client_name: clientName,
          client_email: clientEmail,
          line_items: lineItems,
          subtotal: subtotal || 0,
          discount: discount || 0,
          tax_rate: taxRate || 0,
          total: total || 0,
          currency: currency || "USD",
          valid_until: validUntil || null,
          notes: notes || "",
        })
        .select("*")
        .single();

      if (error) {
        res.status(502).json({ error: "database_insert_failed", detail: error.message });
        return;
      }

      res.status(200).json({ quotation: data });
      return;
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body || {};
      if (!id || !status) {
        res.status(400).json({ error: "missing_id_or_status" });
        return;
      }

      const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
      if (error) {
        res.status(502).json({ error: "database_update_failed" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("admin/quotations crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}

async function generateQuoteNumber(supabase) {
  const year = new Date().getFullYear();
  // Based on the highest existing sequence number, not a row count - a
  // count breaks as soon as any quote is deleted, since a gap makes the
  // count regenerate a number that's already taken.
  const { data } = await supabase
    .from("quotations")
    .select("quote_number")
    .gte("created_at", `${year}-01-01`)
    .lt("created_at", `${year + 1}-01-01`)
    .order("quote_number", { ascending: false })
    .limit(1);

  const lastSequence = data?.[0]?.quote_number ? parseInt(data[0].quote_number.split("-").pop(), 10) : 0;
  const sequence = String(lastSequence + 1).padStart(4, "0");
  return `Q-${year}-${sequence}`;
}
