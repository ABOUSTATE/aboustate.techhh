// Service worker for the Ana w Damere timer (/anawdameery/ only).
//
// The set may have no signal, so the page, logo and fonts are kept in a
// cache. The page is network first, so a new deploy shows up on the next
// load with a connection; everything else is served from cache.

const VERSION = "anawdameery-v1";
const SHELL = ["/anawdameery/", "/anawdameery/logo.png", "/anawdameery/manifest.webmanifest", "/anawdameery/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("anawdameery-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!isFont && !(url.origin === location.origin && url.pathname.startsWith("/anawdameery/"))) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/anawdameery/", copy));
          return res;
        })
        .catch(() => caches.match("/anawdameery/"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
