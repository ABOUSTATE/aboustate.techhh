import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body || {};
  const {
    type,
    name,
    email,
    phone,
    projectDescription,
    timeline,
    isStudentProject,
    services,
    otherServiceDescription,
    submittedAt,
    website, // honeypot — never persisted
  } = body;

  // Honeypot: pretend success without touching the database or sending mail.
  if (website) {
    res.status(200).json({ success: true });
    return;
  }

  if (!name || !email || (type !== "appointment" && type !== "quotation")) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const { data, error: dbError } = await supabase
    .from("service_requests")
    .insert({
      type,
      name,
      email,
      phone: phone || null,
      project_description: projectDescription || null,
      timeline: timeline || null,
      is_student_project: Boolean(isStudentProject),
      services: Array.isArray(services) ? services : [],
      other_service_description: otherServiceDescription || null,
      submitted_at: submittedAt || new Date().toISOString(),
    })
    .select("id")
    .single();

  if (dbError) {
    res.status(500).json({ error: "database_insert_failed" });
    return;
  }

  // Never fail the request over a broken email — the lead is already saved.
  try {
    await sendConfirmationEmail(body);
  } catch (emailError) {
    console.error("sendConfirmationEmail failed:", emailError);
  }

  res.status(200).json({ success: true, id: data.id });
}

async function sendConfirmationEmail(data) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured yet — skipping confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const isQuotation = data.type === "quotation";
  const subject = isQuotation
    ? "We've received your quote request — aboustate.tech"
    : "We've received your appointment request — aboustate.tech";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL, // e.g. "aboustate.tech <studio@aboustate.tech>"
    to: data.email,
    subject,
    html: buildConfirmationEmailHtml(data, isQuotation),
  });
}

function buildConfirmationEmailHtml(data, isQuotation) {
  const name = escapeHtml(data.name || "there");
  const services = isQuotation && Array.isArray(data.services) ? data.services : [];
  const servicesHtml = services.length
    ? '<p style="font-size:13px;font-weight:600;color:#011f1a;margin:16px 0 8px;">Services requested:</p>' +
      '<ul style="font-size:14px;line-height:1.6;color:#4c706a;padding-left:20px;margin:0 0 8px;">' +
      services.map((s) => `<li>${escapeHtml(s)}</li>`).join("") +
      "</ul>"
    : "";

  return `
  <div style="background-color:#f2efeb;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background-color:#faf8f5;border-radius:6px;overflow:hidden;border:1px solid #c3bcb3;">
      <div style="background-color:#02362f;padding:32px;">
        <div style="color:#faf8f5;font-size:18px;font-weight:700;letter-spacing:-0.5px;">
          aboustate<span style="color:#90b495;">.</span>tech
        </div>
      </div>
      <div style="padding:32px;">
        <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#65826b;margin:0 0 12px;">
          ${isQuotation ? "Quote request received" : "Appointment request received"}
        </p>
        <h1 style="font-size:22px;font-weight:700;color:#011f1a;margin:0 0 16px;letter-spacing:-0.5px;">
          Thanks, ${name}.
        </h1>
        <p style="font-size:14px;line-height:1.55;color:#4c706a;margin:0 0 16px;">
          We've received your ${isQuotation ? "quote request" : "appointment request"} and
          it's now with our team.
        </p>
        ${servicesHtml}
        <p style="font-size:13px;font-weight:600;color:#011f1a;margin:16px 0 8px;">What happens next:</p>
        <ol style="font-size:14px;line-height:1.6;color:#4c706a;padding-left:20px;margin:0 0 24px;">
          <li>We review your brief within one business day.</li>
          <li>A member of our team reaches out to schedule a scoping call.</li>
          <li>We send a tailored proposal and timeline before any work begins.</li>
        </ol>
        <div style="border-top:1px solid #dfdad4;padding-top:20px;">
          <p style="font-size:12px;color:#898780;margin:0;">
            aboustate.tech — technical creative house
          </p>
        </div>
      </div>
    </div>
  </div>
  `;
}

function escapeHtml(value) {
  const escapeMap = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (match) => escapeMap[match]);
}
