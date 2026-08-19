import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App.jsx";
import { printConsoleEasterEgg } from "./lib/consoleEasterEgg.js";
import { KonamiEasterEgg } from "./components/KonamiEasterEgg.jsx";
import NotFound from "./NotFound.jsx";

printConsoleEasterEgg();

// Code-split: marketing visitors should never download the admin
// dashboard (or its PDF-generation dependency), the account/auth
// bundle, or the (large) briefing form. Only the route actually being
// visited loads its JS.
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const AccountApp = lazy(() => import("./account/AccountApp.jsx"));
const BriefPage = lazy(() => import("./brief/BriefPage.jsx"));

const path = window.location.pathname;
const KNOWN_PREFIXES = ["/admin", "/account", "/brief"];
const isKnownRoute = path === "/" || KNOWN_PREFIXES.some((prefix) => path.startsWith(prefix));

function Root() {
  if (path.startsWith("/admin")) {
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    );
  }
  if (path.startsWith("/account")) {
    return (
      <Suspense fallback={null}>
        <AccountApp />
      </Suspense>
    );
  }
  if (path.startsWith("/brief")) {
    return (
      <Suspense fallback={null}>
        <BriefPage />
      </Suspense>
    );
  }
  if (!isKnownRoute) {
    return <NotFound />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
    <KonamiEasterEgg />
  </React.StrictMode>
);
