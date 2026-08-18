import { useEffect, useState } from "react";
import { AdminHeader } from "./AdminHeader.jsx";
import { Dashboard } from "./Dashboard.jsx";
import { UsersPanel } from "./UsersPanel.jsx";
import { BriefsPanel } from "./BriefsPanel.jsx";

export default function AdminApp() {
  const [authState, setAuthState] = useState("checking"); // checking | out | in
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState("leads");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => (res.ok ? setAuthState("in") : setAuthState("out")))
      .catch(() => setAuthState("out"));
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error("invalid");
      setAuthState("in");
    } catch {
      setLoginError("Incorrect password.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthState("out");
    setPassword("");
  }

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-inverse">
        <span className="font-mono text-micro uppercase tracking-mono text-text-on-inverse-muted">
          Loading…
        </span>
      </div>
    );
  }

  if (authState === "out") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-inverse px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[360px] rounded-md border border-border-on-inverse bg-green-950 p-8"
        >
          <div className="mb-1 font-mono text-micro uppercase tracking-mono text-accent">
            aboustate.tech
          </div>
          <h1 className="mb-6 font-display text-h2 font-bold text-text-on-inverse">
            Admin
          </h1>

          <label
            htmlFor="admin-password"
            className="mb-1.5 block font-body text-small font-semibold text-text-on-inverse"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-border-on-inverse bg-surface-inverse px-3 py-2.5 font-body text-body text-text-on-inverse outline-none focus:border-accent"
          />

          {loginError && (
            <p className="mt-3 font-body text-small text-mint-300">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="mt-6 w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingIn ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <AdminHeader activeTab={tab} onTabChange={setTab} onLogout={handleLogout} />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        {tab === "leads" && <Dashboard />}
        {tab === "users" && <UsersPanel />}
        {tab === "briefs" && <BriefsPanel />}
      </main>
    </div>
  );
}
