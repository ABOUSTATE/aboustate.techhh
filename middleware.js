import { rewrite } from "@vercel/edge";

// Vercel's declarative `has: host` rewrite condition is a Pro-plan
// feature and silently no-ops on Hobby, so host routing happens here.
// Edge Middleware runs on every plan and isn't counted against the
// 12-serverless-function cap.
//
// on.aboustate.tech is a client-routed SPA (on-app.html): every page
// path (/, /explore, /@handle, ...) rewrites to it. Built assets, API
// routes and real files pass through untouched.
const STATIC_FILE = /\.(?:js|mjs|css|map|json|webmanifest|txt|xml|html|ico|png|jpe?g|gif|webp|avif|svg|woff2?|ttf|otf|mp4|webm|mp3|wav|pdf)$/i;

export default function middleware(request) {
  const host = request.headers.get("host") || "";
  const url = new URL(request.url);
  const path = url.pathname;

  if (host === "on.aboustate.tech") {
    // Usernames can contain dots (/yusuf.tarek), so only real file types
    // count as files.
    const isFile = STATIC_FILE.test(path);
    if (!isFile && !path.startsWith("/api/") && !path.startsWith("/assets/")) {
      return rewrite(new URL("/on-app.html", request.url));
    }
    return;
  }
  if (host === "portfolio.aboustate.tech" && path === "/") {
    return rewrite(new URL("/portfolio.html", request.url));
  }
}

export const config = {
  matcher: ["/", "/((?!api/|assets/).*)"],
};
