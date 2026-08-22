import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const body = req.body || {};
    const { name, email, phone, roleType, reelUrl, portfolioUrl, availability, notes, website } = body;

    // Honeypot: pretend success without touching the database or sending mail.
    if (website) {
      res.status(200).json({ success: true });
      return;
    }

    if (!name || !email) {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: "supabase_not_configured" });
      return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error: dbError } = await supabase
      .from("on_talent_signups")
      .insert({
        name,
        email,
        phone: phone || null,
        role_type: roleType || null,
        reel_url: reelUrl || null,
        portfolio_url: portfolioUrl || null,
        availability: availability || null,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("on_talent_signups insert failed:", dbError);
      res.status(500).json({ error: "database_insert_failed", detail: dbError.message });
      return;
    }

    try {
      await sendConfirmationEmail({ name, email });
    } catch (emailError) {
      console.error("ON talent confirmation email failed:", emailError);
    }

    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error("on/talent-signup crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}

async function sendConfirmationEmail({ name, email }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured — skipping ON talent confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name || "there");

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: email,
    subject: "You're in the ON network — casting.aboustate.tech",
    html: `
    <div style="background-color:#011f1a;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background-color:#02362f;border-radius:6px;overflow:hidden;border:1px solid #1b4943;">
        <div style="padding:32px;">
          <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#90b495;margin:0 0 12px;">
            Profile received
          </p>
          <h1 style="font-size:22px;font-weight:700;color:#f2efeb;margin:0 0 16px;letter-spacing:-0.5px;">
            Welcome to ON, ${safeName}.
          </h1>
          <p style="font-size:14px;line-height:1.55;color:#bacfbb;margin:0 0 16px;">
            Your profile is in the pipeline. Here's what happens next:
          </p>
          <ol style="font-size:14px;line-height:1.6;color:#bacfbb;padding-left:20px;margin:0 0 24px;">
            <li>Our team verifies your submission.</li>
            <li>You're added to the matching pool for active briefs.</li>
            <li>When a director's brief fits, we reach out directly.</li>
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
