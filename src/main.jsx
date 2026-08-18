import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App.jsx";

// Code-split: marketing visitors should never download the admin
// dashboard (or its PDF-generation dependency), the account/auth
// bundle, or the (large) briefing form. Only the route actually being
// visited loads its JS.
const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
const AccountApp = lazy(() => import("./account/AccountApp.jsx"));
const BriefPage = lazy(() => import("./brief/BriefPage.jsx"));

const path = window.location.pathname;

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
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
