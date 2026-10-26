import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../lib/auth.jsx";
import { Button, Input, Notice, Wordmark } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { tr } from "../lib/i18n.jsx";

export const ROLES = {
  talent: { title: "I'm talent", body: "Actor, model, voice, dancer, presenter. 18 or over.", icon: "user" },
  minor: { title: "I'm under 18", body: "You'll need a parent or guardian to confirm your account.", icon: "shield" },
  guardian: { title: "I'm a parent", body: "Set up and look after your child's profile.", icon: "shield" },
  director: { title: "I cast", body: "Casting directors, producers and agencies. We review every request.", icon: "film" },
};

function AuthFrame({ title, sub, children }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-[460px] flex-col justify-center px-4 py-8">
      <div className="mb-6">
        <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr(title)}</h1>
        {sub && <p className="mb-0 mt-2 font-body text-body text-text-secondary">{tr(sub)}</p>}
      </div>
      {children}
    </main>
  );
}

function GoogleButton({ role }) {
  const go = async () => {
    if (role) localStorage.setItem("on:role", role);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/welcome` },
    });
  };
  return (
    <button
      type="button"
      onClick={go}
      className="flex w-full items-center justify-center gap-3 rounded-sm border border-border-subtle bg-surface-card px-5 py-3 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-green-950"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {tr("Continue with Google")}
    </button>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="font-mono text-micro uppercase tracking-mono text-text-secondary">{tr("or")}</span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

export function Join() {
  const [params] = useSearchParams();
  const { user, profile } = useAuth();
  const [role, setRole] = useState(params.get("as") && ROLES[params.get("as")] ? params.get("as") : null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (profile) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/welcome" replace />;

  if (!role) {
    return (
      <AuthFrame title="Join ON" sub="Who are you joining as?">
        <div className="grid gap-3">
          {Object.entries(ROLES).map(([key, r]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-card p-4 text-start transition-colors duration-150 hover:border-green-950"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-mint-100 text-green-900">
                <Icon name={r.icon} />
              </span>
              <span className="flex-1">
                <span className="block font-body text-body font-semibold text-text-primary">{tr(r.title)}</span>
                <span className="block font-body text-small text-text-secondary">{tr(r.body)}</span>
              </span>
              <Icon name="arrow" size={18} className="text-text-secondary" />
            </button>
          ))}
        </div>
        <p className="mt-6 text-center font-body text-small text-text-secondary">
          {tr("Already on ON?")}{" "}
          <Link to="/login" className="font-semibold text-text-primary underline">
            {tr("Log in")}
          </Link>
        </p>
      </AuthFrame>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError(tr("Use at least 8 characters for your password."));
    setBusy(true);
    localStorage.setItem("on:role", role);
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/welcome`, data: { on_role: role } },
    });
    setBusy(false);
    if (err) return setError(tr(err.message));
    if (!data.session) setSent(true);
  };

  if (sent) {
    return (
      <AuthFrame title="Check your inbox" sub={tr("We sent a link to {email}. Open it on this device to finish setting up.", { email })}>
        <Notice>{tr("Nothing there after a few minutes? Look in spam, or try again with Google.")}</Notice>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title={ROLES[role].title} sub={role === "director" ? "Create your account, then tell us where you cast." : "Create your account. It takes a minute."}>
      {role === "minor" && (
        <div className="mb-5">
          <Notice tone="accent">
            {tr("Ask your parent or guardian to sit with you. You'll need their email, and they'll confirm your profile from their own account.")}
          </Notice>
        </div>
      )}
      <GoogleButton role={role} />
      <Divider />
      <form onSubmit={submit} className="grid gap-4">
        <Input label={tr("Email")} type="email" dir="ltr" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label={tr("Password")}
          type="password"
          dir="ltr"
          required
          autoComplete="new-password"
          hint={tr("At least 8 characters")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Notice>{error}</Notice>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? tr("Creating account") : tr("Create account")}
        </Button>
      </form>
      <div className="mt-5 flex justify-between font-body text-small text-text-secondary">
        <button type="button" onClick={() => setRole(null)} className="underline">
          {tr("Change type")}
        </button>
        <Link to="/login" className="underline">
          {tr("I have an account")}
        </Link>
      </div>
    </AuthFrame>
  );
}

export function Login() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (profile) return <Navigate to="/" replace />;
  if (user) return <Navigate to="/welcome" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError(err.message === "Invalid login credentials" ? tr("That email and password don't match.") : tr(err.message));
    navigate("/");
  };

  return (
    <AuthFrame title="Welcome back" sub="Log in to your ON account.">
      <GoogleButton />
      <Divider />
      <form onSubmit={submit} className="grid gap-4">
        <Input label={tr("Email")} type="email" dir="ltr" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={tr("Password")} type="password" dir="ltr" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Notice>{error}</Notice>}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy ? tr("Logging in") : tr("Log in")}
        </Button>
      </form>
      <div className="mt-5 flex justify-between font-body text-small text-text-secondary">
        <Link to="/forgot" className="underline">
          {tr("Forgot password?")}
        </Link>
        <Link to="/join" className="underline">
          {tr("New here? Join")}
        </Link>
      </div>
    </AuthFrame>
  );
}

export function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset` });
    if (err) return setError(tr(err.message));
    setSent(true);
  };

  return (
    <AuthFrame title="Reset your password" sub={sent ? tr("If {email} has an account, a reset link is on its way.", { email }) : "We'll email you a link to set a new one."}>
      {!sent && (
        <form onSubmit={submit} className="grid gap-4">
          <Input label={tr("Email")} type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <Notice>{error}</Notice>}
          <Button type="submit" size="lg" className="w-full">
            {tr("Send reset link")}
          </Button>
        </form>
      )}
      <p className="mt-5 font-body text-small text-text-secondary">
        <Link to="/login" className="underline">
          {tr("Back to log in")}
        </Link>
      </p>
    </AuthFrame>
  );
}

export function Reset() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link signs the user in; wait for that session.
    if (user) setReady(true);
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError(tr("Use at least 8 characters."));
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) return setError(tr(err.message));
    navigate("/");
  };

  return (
    <AuthFrame title="Choose a new password">
      {!ready ? (
        <Notice>{tr("Open this page from the link in your email.")}</Notice>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <Input label={tr("New password")} type="password" dir="ltr" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <Notice>{error}</Notice>}
          <Button type="submit" size="lg" className="w-full">
            {tr("Save password")}
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}

export { AuthFrame, Wordmark };
