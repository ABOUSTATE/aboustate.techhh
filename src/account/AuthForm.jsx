import { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export function AuthForm() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error | check-email
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await action;

    if (authError) {
      setError(authError.message);
      setStatus("error");
      return;
    }

    if (mode === "signup") {
      setStatus("check-email");
      return;
    }

    setStatus("idle");
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
  }

  if (status === "check-email") {
    return (
      <div className="mx-auto max-w-[400px] rounded-md border border-border-subtle bg-surface-card p-8 text-center">
        <h2 className="font-display text-h3 font-bold text-text-primary">Check your inbox</h2>
        <p className="mt-3 font-body text-small text-text-secondary">
          We've sent a confirmation link to {email}. Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[400px] rounded-md border border-border-subtle bg-surface-card p-8">
      <div className="mb-6 flex rounded-sm border border-border-subtle bg-surface-page p-1">
        {[
          { key: "signin", label: "Sign in" },
          { key: "signup", label: "Create account" },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setMode(option.key);
              setError("");
            }}
            className={[
              "flex-1 rounded-sm px-3 py-2 font-body text-small font-semibold transition-colors duration-150",
              mode === option.key
                ? "bg-accent text-green-950"
                : "text-text-secondary hover:text-text-accent",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-sm border border-border-subtle bg-surface-page px-4 py-2.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M15.68 8.18c0-.58-.05-1.13-.15-1.66H8v3.14h4.3a3.68 3.68 0 0 1-1.6 2.42v2h2.58c1.5-1.39 2.4-3.44 2.4-5.9Z"
          />
          <path
            fill="#34A853"
            d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2c-.72.48-1.63.77-2.71.77-2.08 0-3.85-1.41-4.48-3.3H.85v2.07A8 8 0 0 0 8 16Z"
          />
          <path
            fill="#FBBC05"
            d="M3.52 9.53a4.8 4.8 0 0 1 0-3.06V4.4H.85a8 8 0 0 0 0 7.2l2.67-2.07Z"
          />
          <path
            fill="#EA4335"
            d="M8 3.18c1.17 0 2.23.4 3.06 1.19l2.3-2.3A7.96 7.96 0 0 0 8 0 8 8 0 0 0 .85 4.4l2.67 2.07C4.15 4.59 5.92 3.18 8 3.18Z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="font-mono text-micro uppercase tracking-mono text-text-secondary">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="auth-email" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
        />

        <label htmlFor="auth-password" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
        />

        {error && (
          <p className="mb-4 font-body text-small text-mint-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
