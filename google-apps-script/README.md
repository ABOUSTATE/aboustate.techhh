# Booking form backend (Google Apps Script)

Turns [Code.gs](Code.gs) into a webhook: appends every form submission as a row
in a Google Sheet, and sends the submitter a styled confirmation email.

## Setup

1. Create a new Google Sheet (this becomes the CRM).
2. In the Sheet, open **Extensions → Apps Script**.
3. Delete the default `Code.gs` boilerplate and paste in the contents of
   [Code.gs](Code.gs).
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the script when prompted, and copy the
   generated **Web app URL** (ends in `/exec`).
6. Paste that URL into `WEBHOOK_URL` in
   [../src/sections/BookingForm.jsx](../src/sections/BookingForm.jsx).

The script auto-creates a `Submissions` sheet with a header row on first run —
no manual sheet setup needed beyond step 1.

## Notes

- Apps Script web apps don't return CORS headers, so the frontend fetch uses
  `mode: "no-cors"` with a `text/plain` content type to avoid a failed
  preflight. That means the browser can't read the response back — the
  frontend treats "no network error" as success, since the response itself is
  opaque. If you need real success/failure feedback, proxy this through a
  small serverless function (Vercel/Cloudflare) that can read the Apps
  Script response server-side and return proper JSON + CORS headers to the
  browser.
- Re-deploy (**Deploy → Manage deployments → Edit → New version**) any time
  you change `Code.gs` — editing the script alone doesn't update the live
  `/exec` URL's behavior.
