import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isAuthenticated } from "./_lib/adminAuth.js";

const UID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L
const MEDIA_BUCKET = "on-talent-media";
const CONTENT_TYPE_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

// Everything for the ON casting platform lives behind this single
// serverless function (public POST for submissions/uploads, admin-only
// GET/PATCH to review them) so the deployment stays within Vercel's
// per-project function count limit on the Hobby plan.
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      await handlePost(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "PATCH") {
      if (!isAuthenticated(req)) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      if (req.method === "GET") {
        await handleList(req, res);
      } else {
        await handleUpdateStatus(req, res);
      }
      return;
    }

    res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("api/on crashed:", error);
    res.status(500).json({ error: "unexpected_error", detail: String(error && error.message) });
  }
}

async function handlePost(req, res) {
  const body = req.body || {};

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "supabase_not_configured" });
    return;
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (body.action === "reserve-uid") {
    await handleReserveUid(supabase, res);
    return;
  }

  if (body.action === "upload-url") {
    await handleUploadUrl(supabase, body, res);
    return;
  }

  if (body.action === "lookup") {
    await handleLookup(supabase, body, res);
    return;
  }

  await handleSubmit(supabase, body, res);
}

// ----------------------------------------------------------------
// Reserve a UID before any media uploads happen — uploads need a UID
// to build their storage path, but a UID was previously only minted
// at final submit, after uploads would already need one. This just
// finds a free code; it doesn't write a row, so an abandoned wizard
// never leaves an orphan profile behind.
// ----------------------------------------------------------------
async function handleReserveUid(supabase, res) {
  let uid = generateUid();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from("on_talent_signups").select("id").eq("uid", uid).maybeSingle();
    if (!existing) break;
    uid = generateUid();
  }
  res.status(200).json({ uid });
}

// ----------------------------------------------------------------
// Signed upload URLs — the browser uploads photos/video straight to
// Supabase Storage with these, never through this function. Vercel's
// serverless functions cap request bodies well below video file
// sizes, so proxying uploads through here isn't an option.
// ----------------------------------------------------------------
async function handleUploadUrl(supabase, body, res) {
  const { uid, slot, contentType } = body;
  const validSlots = ["headshot", "fullbody", "video"];

  if (!uid || !validSlots.includes(slot) || !CONTENT_TYPE_EXT[contentType]) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const ext = CONTENT_TYPE_EXT[contentType];
  const path = `${uid}/${slot}.${ext}`;

  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, {
    upsert: true,
  });

  if (error) {
    console.error("createSignedUploadUrl failed:", error);
    res.status(502).json({ error: "signed_url_failed", detail: error.message });
    return;
  }

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
  res.status(200).json({ signedUrl: data.signedUrl, token: data.token, path, publicUrl });
}

// ----------------------------------------------------------------
// Lookup an existing talent profile by UID — the same "possession of
// the code is proof of identity" model already used for brief access
// codes. No separate login system.
// ----------------------------------------------------------------
async function handleLookup(supabase, body, res) {
  const { uid } = body;
  if (!uid) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const { data, error } = await supabase
    .from("on_talent_signups")
    .select("*")
    .eq("uid", String(uid).trim().toUpperCase())
    .maybeSingle();

  if (error || !data) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({ profile: data });
}

async function handleSubmit(supabase, body, res) {
  const { type, website } = body;

  // Honeypot: pretend success without touching the database or sending mail.
  if (website) {
    res.status(200).json({ success: true });
    return;
  }

  if (type !== "talent" && type !== "director") {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  if (type === "talent") {
    await handleTalentSubmit(supabase, body, res);
    return;
  }

  await handleDirectorSubmit(supabase, body, res);
}

async function handleTalentSubmit(supabase, body, res) {
  const {
    uid,
    name,
    email,
    phone,
    roleType,
    ageRange,
    gender,
    nationality,
    city,
    heightCm,
    weightKg,
    languages,
    skills,
    experienceLevel,
    instagramHandle,
    headshotUrl,
    headshotPath,
    fullbodyUrl,
    fullbodyPath,
    videoUrl,
    videoPath,
    availability,
    notes,
  } = body;

  if (!name || !email) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const profileComplete = Boolean(headshotUrl && fullbodyUrl && videoUrl);

  const record = {
    name,
    email,
    phone: phone || null,
    role_type: roleType || null,
    age_range: ageRange || null,
    gender: gender || null,
    nationality: nationality || null,
    city: city || null,
    height_cm: heightCm ? Number(heightCm) : null,
    weight_kg: weightKg ? Number(weightKg) : null,
    languages: languages || null,
    skills: skills || null,
    experience_level: experienceLevel || null,
    instagram_handle: instagramHandle || null,
    headshot_url: headshotUrl || null,
    headshot_path: headshotPath || null,
    fullbody_url: fullbodyUrl || null,
    fullbody_path: fullbodyPath || null,
    video_url: videoUrl || null,
    video_path: videoPath || null,
    availability: availability || null,
    notes: notes || null,
    profile_complete: profileComplete,
    updated_at: new Date().toISOString(),
  };

  // The client always carries a UID by this point — either freshly
  // reserved via action="reserve-uid" (new profile) or the one it was
  // issued originally (editing). Which of those it is depends only on
  // whether a row with that UID already exists: if so, this is an
  // edit; if not, this is the first save for a pre-reserved UID.
  if (!uid) {
    res.status(400).json({ error: "missing_uid" });
    return;
  }
  const normalizedUid = String(uid).trim().toUpperCase();

  const { data: existing } = await supabase
    .from("on_talent_signups")
    .select("id")
    .eq("uid", normalizedUid)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase.from("on_talent_signups").update(record).eq("id", existing.id);
    if (updateError) {
      console.error("on_talent_signups update failed:", updateError);
      res.status(500).json({ error: "database_update_failed", detail: updateError.message });
      return;
    }
    res.status(200).json({ success: true, uid: normalizedUid });
    return;
  }

  const { data, error: dbError } = await supabase
    .from("on_talent_signups")
    .insert({ ...record, uid: normalizedUid })
    .select("id")
    .single();

  if (dbError) {
    console.error("on_talent_signups insert failed:", dbError);
    res.status(500).json({ error: "database_insert_failed", detail: dbError.message });
    return;
  }

  try {
    await sendTalentConfirmation({ name, email, uid: normalizedUid });
  } catch (emailError) {
    console.error("ON talent confirmation email failed:", emailError);
  }

  res.status(200).json({ success: true, id: data.id, uid: normalizedUid });
}

async function handleDirectorSubmit(supabase, body, res) {
  const { name, email, company, productionName, roleNeeded, briefDescription, timeline } = body;
  if (!name || !email || !roleNeeded || !briefDescription) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

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
    await sendDirectorConfirmation({ name, email, roleNeeded });
  } catch (emailError) {
    console.error("ON director confirmation email failed:", emailError);
  }

  res.status(200).json({ success: true, id: data.id });
}

async function handleList(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const [talentResult, directorResult] = await Promise.all([
    supabase.from("on_talent_signups").select("*").order("created_at", { ascending: false }),
    supabase.from("on_director_briefs").select("*").order("created_at", { ascending: false }),
  ]);

  if (talentResult.error || directorResult.error) {
    res.status(502).json({ error: "database_read_failed" });
    return;
  }

  res.status(200).json({ talent: talentResult.data, directors: directorResult.data });
}

async function handleUpdateStatus(req, res) {
  const { table, id, status } = req.body || {};
  if (!["on_talent_signups", "on_director_briefs"].includes(table) || !id || !status) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  if (error) {
    res.status(502).json({ error: "database_update_failed" });
    return;
  }
  res.status(200).json({ ok: true });
}

function generateUid(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += UID_ALPHABET[Math.floor(Math.random() * UID_ALPHABET.length)];
  }
  return code;
}

async function sendTalentConfirmation({ name, email, uid }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.warn("Resend not configured — skipping ON talent confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name || "there");
  const safeUid = escapeHtml(uid);

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
            Your profile ID is:
          </p>
          <p style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:2px;color:#90b495;background-color:#011f1a;border:1px solid #1b4943;border-radius:4px;padding:12px 16px;margin:0 0 16px;text-align:center;">
            ${safeUid}
          </p>
          <p style="font-size:13px;line-height:1.55;color:#bacfbb;margin:0 0 16px;">
            Save this ID — it's how you'll come back to edit your profile, add or replace photos and
            video, any time. There's no password to lose.
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

async function sendDirectorConfirmation({ name, email, roleNeeded }) {
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
