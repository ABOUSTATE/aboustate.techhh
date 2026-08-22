import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const body = req.body || {};
    const { name, email, company, productionName, roleNeeded, briefDescription, timeline, website } = body;

    // Honeypot: pretend success without touching the database or sending mail.
    if (website) {
      res.status(200).json({ success: true });
      return;
    }

    if (!name || !email || !roleNeeded || !briefDescription) {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "supabase_not_configured" });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error: dbError } = await supabase
      .from("on_director_briefs")
      .insert({
        name,
        email,
        company: company || null,
        production_name: productionName || null,
        role_needed: roleNeeded,
        brief_description: briefDescription,
        timeline: timeline || null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("on_director_briefs insert failed:", dbError);
      res.status(500).json({ error: "database_insert_failed", detail: dbError.message });
      return;
    }

    try {
      await sendConfirmationEmail({ name, email, roleNeeded });
    } catch (emailError) {
      console.error("ON director confirmation email failed:", emailError);
    }

    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error("on/director-brief crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}

async function sendConfirmationEmail({ name, email, roleNeeded }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured — skipping ON director confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name || "there");
  const safeRole = escapeHtml(roleNeeded || "your role");

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "Brief received — ON casting network",
    html: `
    <div style="background-color:#011f1a;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background-color:#02362f;border-radius:6px;overflow:hidden;border:1px solid #1b4943;">
        <div style="padding:32px;">
          <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#90b495;margin:0 0 12px;">
            Brief received
          </p>
          <h1 style="font-size:22px;font-weight:700;color:#f2efeb;margin:0 0 16px;letter-spacing:-0.5px;">
            Thanks, ${safeName}.
          </h1>
          <p style="font-size:14px;line-height:1.55;color:#bacfbb;margin:0 0 16px;">
            Your brief for <strong style="color:#f2efeb;">${safeRole}</strong> is now routing through the
            match engine against verified talent.
          </p>
          <ol style="font-size:14px;line-height:1.6;color:#bacfbb;padding-left:20px;margin:0 0 24px;">
            <li>We review your brief within one business day.</li>
            <li>Matched talent submissions are shared with you directly.</li>
            <li>You confirm and move to booking — all online.</li>
          </ol>
          <div style="border-top:1px solid #1b4943;padding-top:20px;">
            <p style="font-size:12px;color:#65826b;margin:0;">
              ON — a product of aboustate.tech
            </p>
          </div>
        </div>
      </div>
    </div>
    `,
  });
}

function escapeHtml(value) {
  const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (match) => escapeMap[match]);
}
