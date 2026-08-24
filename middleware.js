import { rewrite } from "@vercel/edge";

// Vercel's declarative `has: host` rewrite condition (used for routing
// on.aboustate.tech's root to on.html) is a Pro-plan feature and
// silently no-ops on Hobby - it fell through to the SPA catch-all
// instead. Edge Middleware runs on every plan and isn't counted
// against the 12-serverless-function cap, so it does the host check
// here instead.
export default function middleware(request) {
  const host = request.headers.get("host") || "";
  const url = new URL(request.url);

  if (host === "on.aboustate.tech" && url.pathname === "/") {
    return rewrite(new URL("/on.html", request.url));
  }
}

export const config = {
  matcher: "/",
};
