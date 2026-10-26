import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// on.aboustate.tech is its own SPA (on-app.html). In production the Edge
// middleware rewrites every page path on that host to it. Locally,
// `ON_DEV=1 npm run dev` does the same for page navigations.
const onDev = {
  name: "on-dev",
  configureServer(server) {
    if (!process.env.ON_DEV) return;
    server.middlewares.use((req, _res, next) => {
      const path = req.url.split("?")[0];
      if (req.headers["sec-fetch-dest"] === "document" || (path === "/" && (req.headers.accept || "").includes("text/html"))) {
        if (!path.endsWith(".html")) req.url = "/on-app.html";
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), onDev],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        on: resolve(__dirname, "on-app.html"),
      },
    },
  },
});
