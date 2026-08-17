import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import AccountApp from "./account/AccountApp.jsx";

const path = window.location.pathname;

function Root() {
  if (path.startsWith("/admin")) return <AdminApp />;
  if (path.startsWith("/account")) return <AccountApp />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
