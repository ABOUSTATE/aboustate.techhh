// Service worker for the installed ON app (on.aboustate.tech only).
//
// - Pages: network first, so people always get the latest deploy; the last
//   good copy of the app shell is used when there's no connection.
// - Built assets (/assets/*, hashed names): cache first, they never change.
// - Fonts and profile photos: served from cache, refreshed in the background.
// - Supabase API and auth calls are never cached.

const VERSION = "on-v1";
const SHELL = `${VERSION}-shell`;
const STATIC = `${VERSION}-static`;
const MEDIA = `${VERSION}-media`;
const MEDIA_LIMIT = 150;

const OFFLINE_HTML = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ON</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f2efeb;color:#011f1a;font-family:"IBM Plex Sans Arabic","DM Sans",system-ui,sans-serif;text-align:center;padding:24px}h1{font-size:28px;margin:0 0 8px}p{color:#4c706a;margin:0 0 24px}button{font:inherit;font-weight:600;border:0;border-radius:4px;background:#90b495;color:#011f1a;padding:10px 20px}</style></head>
<body><div><h1>مفيش إنترنت دلوقتي</h1><p>أول ما النت يرجع، ON هيفتح تاني. No connection right now.</p><button onclick="location.reload()">جرّب تاني</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(["/", "/on-manifest.webmanifest", "/on-icons/icon-192.png"]))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function staleWhileRevalidate(event, cacheName, limit) {
  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(event.request);
    const network = fetch(event.request)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          cache.put(event.request, res.clone());
          if (limit) trim(cacheName, limit);
        }
        return res;
      })
      .catch(() => cached);
    if (cached) {
      event.waitUntil(network);
      return cached;
    }
    return network;
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // App pages (every route is the same SPA shell).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(SHELL).then((c) => c.put("/", res.clone()));
          return res;
        })
        .catch(async () => (await caches.match("/")) || new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }))
    );
    return;
  }

  // Our own hashed build files.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // Google Fonts.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(event, STATIC));
    return;
  }

  // Public profile photos (not videos: too big to keep on the phone).
  if (url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/public/") && /\.(jpe?g|png|webp)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, MEDIA, MEDIA_LIMIT));
  }
});
