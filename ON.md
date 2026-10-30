# ON: project guide

ON is the online casting platform at **[on.aboustate.tech](https://on.aboustate.tech)**, built by aboustate.tech for the Egyptian market. Talent keep one profile (photos, past work, look, skills); approved casting directors search it, turn briefs into boards, request self-tapes, share shortlists with clients and post open calls. Egyptian Arabic first, English second. Free for talent.

This file is the map: how to run it, where things live, how to change them safely.

---

## 1. Run it locally

```bash
npm install
npm run dev:on        # ON at http://localhost:5180
```

`npm run dev` runs the main aboustate.tech site on port 5173 instead. Both need `.env.local` in the project root:

| Variable | What it is |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key, safe in the browser |

The local server talks to the **live database**. Anything you create while testing is real; use the test accounts (section 8) and clean up.

Server-only variables live in Vercel (Project → Settings → Environment Variables), never in the repo: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`.

## 2. How it's hosted

- **Vercel**, project `aboustate.techhh`, Hobby plan. Pushing to `main` deploys.
- One Vite build serves two sites. [middleware.js](middleware.js) sends every page on `on.aboustate.tech` to [on-app.html](on-app.html) (the ON app); everything else is the main site from [index.html](index.html). Only real file extensions count as files, because handles contain dots (`/yusuf.tarek`).
- Hobby allows **12 serverless functions**. Everything ON needs on the server is one function, [api/on.js](api/on.js): the daily keep-alive ping, and the admin actions (create a managed profile, hand it over, delete test profiles). Add new server actions there, not as new files.
- A daily cron in [vercel.json](vercel.json) calls `/api/on?ping=1` so the free Supabase project never pauses.
- ON is an installable app (PWA): [public/on-manifest.webmanifest](public/on-manifest.webmanifest), service worker [public/on-sw.js](public/on-sw.js), icons from [scripts/make-on-icons.py](scripts/make-on-icons.py).

## 3. Code map

Everything for ON is in [src/on](src/on):

| Path | What's there |
|---|---|
| [main.jsx](src/on/main.jsx) | Routes. `/handle` is a profile, `/handle/card` its comp card, `/shortlist/:token` a client link |
| [lib/auth.jsx](src/on/lib/auth.jsx) | Signed-in user and their ON profile |
| [lib/i18n.jsx](src/on/lib/i18n.jsx), [lib/ar.js](src/on/lib/ar.js) | Languages (section 6) |
| [lib/options.js](src/on/lib/options.js) | The fixed lists: skills, accents, cities, looks |
| [lib/media.js](src/on/lib/media.js) | Photo upload (resized in the browser) to the `on-media` bucket |
| [lib/embeds.js](src/on/lib/embeds.js) | Turns YouTube / Drive / Vimeo / Instagram links into players |
| [lib/brief.js](src/on/lib/brief.js) | Reads a brief PDF in the browser and pulls out roles and traits (rules, no AI) |
| [lib/match.js](src/on/lib/match.js) | Exact and close matching of talent to a role |
| [lib/castings.js](src/on/lib/castings.js) | Shared helpers for boards, requests, shortlists, open calls |
| [pages/](src/on/pages) | One file per area: Landing, Home, Auth, Onboarding, Profile, EditProfile, Explore, Boards, Castings, Shortlist, CompCard, Account, Admin |
| [components/](src/on/components) | Shell (nav), ui (buttons, dialogs...), TalentCard, WorkCard, TapePlayer, BoardDialogs, LangPicker, InstallPrompt |

## 4. Data (Supabase)

Project `yxenwgpakjcrfkyljohj`, EU (Ireland), free tier. The schema is built from the migrations listed in the Supabase dashboard (Database → Migrations); the ON ones start with `on_`.

| Table | Holds |
|---|---|
| `on_profiles` | Every account: role (`talent`, `guardian`, `director`), handle, name, director approval, admin flag, `published`, `managed`, `seed` |
| `on_talent` | Look, skills, credits, past-work links (`work`) |
| `on_talent_private` | Birth date, phone, WhatsApp, contact email. Birth date is never readable by anyone but the owner |
| `on_media` | Photos and clips in the `on-media` storage bucket |
| `on_boards` | Brief Boards: the brief's text and the roles, traits and picks (JSON) |
| `on_requests` | Self-tape requests and the talent's reply. The director's verdict is hidden from talent at column level |
| `on_shares`, `on_share_votes` | Client shortlist links (random token, expiry) and client votes |
| `on_calls`, `on_applications` | Open calls and applications |

**Security lives in the database**, not the screens: row-level security on every table, through helper functions `on_can_view_profile`, `on_can_edit_profile`, `on_is_admin`, `on_is_approved_director`. Signed-out visitors can only use `on_share_get` / `on_share_vote` (by token) and read open calls. If you add a table, add its policies in the same migration, and run Supabase's security advisor afterwards.

Who sees what, in short: public adult profiles are open to everyone; contact details only to approved directors; under-18s only after a parent confirms, and only to approved directors, who see the parent's contact. Test profiles (`seed`) are hidden from signed-out visitors.

## 5. Accounts and roles

- **Talent**: 18+ sign up themselves. Under-18s sign up with a parent's email; the parent joins as a **guardian** with that email and confirms.
- **Casting directors** sign up, then wait for approval in Admin. Approval opens contacts, under-18s, Brief Boards and open calls.
- **Admins** are profiles with `is_admin` (currently the studio accounts). Admin can approve directors, verify talent, create **managed profiles** (talent the studio runs, like Yusuf Tarek; enquiries go to studio@aboustate.tech) and hand them over to the talent by email.

## 6. Languages

- Strings are written in English in the code and wrapped: `tr("Save")`, `tr("{n} days", { n })`. The Arabic lives in [lib/ar.js](src/on/lib/ar.js) under the same English key, in everyday Egyptian Arabic.
- Stored values (skills, cities...) stay English in the database; `opt(value)` shows them in Arabic (`AR_OPT`).
- Arabic is the default; the first visit shows a language picker.
- Right-to-left: use logical classes (`ms-`, `me-`, `start-`, `end-`, `text-start`), wrap names and other mixed-language text in `<bdi>`, and keep numeric ranges in an LTR isolate (`⁦20–26⁩`) so they don't flip.
- A missing Arabic string falls back to English, so it never breaks, but it looks unfinished: add the Arabic with every new string.

## 7. Design rules

Follow [CLAUDE.md](CLAUDE.md): use the design system's tokens (Tailwind classes like `text-text-primary`, `bg-green-900`, `rounded-md`) from [tailwind.config.js](tailwind.config.js) and [globals.css](globals.css); no new hex colours, fonts or spacing values. Note the spacing scale is custom (`p-9` is 96px), so check before using large spacing classes. Arabic uses IBM Plex Sans Arabic, which isn't in the design system yet.

## 8. Test data

24 fictional talent (2 under 18), a parent, an approved and a pending director, all with placeholder photos and a "Test profile" badge. They're hidden from signed-out visitors.

- **Remove before launch, or any time:** Admin → **Delete all test profiles** (removes their photos and logins too).
- **Recreate:** `python docs/seed/make_seed.py` writes `docs/seed/seed.sql` (run it in the Supabase SQL editor), then `python docs/seed/upload_photos.py <admin-email> <password>` with `npm run dev:on` running.
- Test logins have random passwords. To test as one, set a temporary password in the Supabase dashboard (Authentication → Users), and scramble it again afterwards.

## 9. Partner documents (PDFs)

All in [docs/on-partner-pack](docs/on-partner-pack): the partner pack, the talent guide and the Brief Boards guide, each in English and Arabic.

| To change | Edit | Then |
|---|---|---|
| Partner pack | `pack.html`, `pack-ar.html` | `python print_docs.py` |
| Guides | `make_guides.py` | `python make_guides.py && python print_docs.py` |
| Screenshots | `shots_v2.py` (needs `npm run dev:on` and a temporary password on the test accounts) | `python shots_v2.py <password>` |

`print_docs.py` fails if any page's content runs off the A4 page or an image is missing. Profile screenshots use Yusuf Tarek's real profile (with his permission); the casting tools use the demo profiles and a made-up brand ("Nour Juice"). Old screenshots are kept in `archive/`.

## 10. Before and after launch

Still to do in dashboards (they can't be done from code):

1. **Supabase → Authentication → URL configuration:** add `https://on.aboustate.tech/**` to Redirect URLs. Until then, Google sign-in lands on aboustate.tech first and bounces back to ON.
2. **Supabase → Authentication → Emails:** connect custom SMTP (Resend) so sign-up and reset emails come from studio@aboustate.tech and aren't rate-limited.
3. **Supabase → Authentication → Passwords:** turn on leaked-password protection.
4. **Delete the test profiles** (section 8).
5. Payments (Paymob) need the company registration first.

Free-tier limits to watch: 500 MB database (tens of thousands of profiles), **1 GB file storage (about 800 talents with photos)** and 5 GB monthly bandwidth. Videos never count, because they're links. When photos get close to the limit, move them to Cloudflare R2 (10 GB free, no bandwidth fees).

Not built yet: notifications (talent only see requests and open calls when they open ON), messaging, payments.

Questions: studio@aboustate.tech
