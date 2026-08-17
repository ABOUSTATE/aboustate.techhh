// Must match a verified "Send mail as" alias in the Gmail account running
// this script (Gmail Settings → Accounts and Import → Send mail as).
const FROM_EMAIL = "studio@aboustate.tech";
const FROM_NAME = "aboustate.tech";

// Internal lead-notification email — lands as a normal push notification via
// the Gmail app on your phone. Doesn't need to be a verified alias since
// it's just sent from the script's own account to this inbox.
const NOTIFY_EMAIL = "mostafaaboustate@gmail.com";

const SHEET_NAME = "Submissions";
const HEADERS = [
  "Timestamp",
  "Type",
  "Name",
  "Email",
  "Phone",
  "Project Description",
  "Timeline",
  "Student Project",
  "Services",
  "Other Service Description",
];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  appendToSheet(data);

  // Never let a broken email (e.g. an unverified "Send mail as" alias) cost
  // us the lead that's already safely in the sheet.
  try {
    sendConfirmationEmail(data);
  } catch (error) {
    Logger.log("sendConfirmationEmail failed: " + error);
  }

  try {
    notifyPhone(data);
  } catch (error) {
    Logger.log("notifyPhone failed: " + error);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendToSheet(data) {
  const sheet = getOrCreateSheet();

  sheet.appendRow([
    new Date(data.submittedAt || Date.now()),
    data.type || "",
    data.name || "",
    data.email || "",
    data.phone || "",
    data.projectDescription || "",
    data.timeline || "",
    data.isStudentProject ? "Yes" : "No",
    Array.isArray(data.services) ? data.services.join(", ") : "",
    data.otherServiceDescription || "",
  ]);
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function notifyPhone(data) {
  const isQuotation = data.type === "quotation";
  const subject = isQuotation ? "New quote request" : "New appointment request";

  const lines = [
    data.name || "(no name)",
    data.email || "",
    data.phone || "",
  ];
  if (isQuotation && Array.isArray(data.services) && data.services.length) {
    lines.push("Services: " + data.services.join(", "));
  }
  if (data.projectDescription) {
    lines.push(data.projectDescription);
  }

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, lines.filter(Boolean).join("\n"));
}

function sendConfirmationEmail(data) {
  if (!data.email) return;

  const isQuotation = data.type === "quotation";
  const subject = isQuotation
    ? "We've received your quote request — aboustate.tech"
    : "We've received your appointment request — aboustate.tech";

  GmailApp.sendEmail(data.email, subject, "", {
    htmlBody: buildConfirmationEmailHtml(data, isQuotation),
    from: FROM_EMAIL,
    name: FROM_NAME,
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
