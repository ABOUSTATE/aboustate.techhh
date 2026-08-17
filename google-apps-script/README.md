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

## Sending from studio@aboustate.tech (free)

`Code.gs` sends via `GmailApp` with `from: "studio@aboustate.tech"`. That only
works if the Gmail account running the script has `studio@aboustate.tech`
verified as a **"Send mail as"** alias — otherwise Gmail silently falls back
to sending from the account's own address. Two things need to be true first:

1. **`studio@aboustate.tech` must be able to receive mail**, since Gmail's
   verification step emails a confirmation link to it. If you don't have paid
   email hosting for the domain yet, a free forwarding service works:
   - [ImprovMX](https://improvmx.com) (free) — add it, then add the MX
     records it gives you in your `.tech domains` DNS panel (same place you
     added the Vercel records). It forwards `studio@aboustate.tech` to
     whatever personal Gmail address you tell it to.
2. **Add the alias in Gmail**: in the Gmail account you want running this
   script, go to **Settings → See all settings → Accounts and Import → Send
   mail as → Add another email address**. Enter `studio@aboustate.tech`,
   skip "treat as an alias" prompts as needed, and verify using the
   confirmation link forwarded to your inbox via ImprovMX.
3. Once verified, redeploy `Code.gs` (or it'll just start working on the next
   submission) — Gmail will let `GmailApp.sendEmail` send as that alias.

Free tier limits: Gmail personal accounts cap outbound mail via
`GmailApp`/`MailApp` at **100/day**; a Google Workspace account on the domain
raises that to 1500/day. 100/day is plenty for a booking form's confirmation
emails.

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
