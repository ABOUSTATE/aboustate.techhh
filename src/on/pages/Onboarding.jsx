import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../lib/auth.jsx";
import { ageFrom } from "../lib/options.js";
import { Button, Input, Notice, Spinner } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { AuthFrame, ROLES } from "./Auth.jsx";
import { tr } from "../lib/i18n.jsx";

function suggestHandle(name, email) {
  const base = (name || email.split("@")[0] || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : `${base}talent`.slice(0, 20);
}

export function Onboarding() {
  const { user, profile, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const initialRole = user?.user_metadata?.on_role || localStorage.getItem("on:role") || "";
  const [role, setRole] = useState(ROLES[initialRole] ? initialRole : "");
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [handleOk, setHandleOk] = useState(null);
  const [birth, setBirth] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [company, setCompany] = useState("");
  const [legacy, setLegacy] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const age = ageFrom(birth);
  const isMinor = (role === "talent" || role === "minor") && age !== null && age < 18;

  useEffect(() => {
    if (!handleTouched && user) setHandle(suggestHandle(name, user.email));
  }, [name, user, handleTouched]);

  useEffect(() => {
    if (!/^[a-z0-9_.]{3,24}$/.test(handle)) return setHandleOk(handle ? false : null);
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("on_handle_available", { h: handle });
      setHandleOk(!!data);
    }, 300);
    return () => clearTimeout(t);
  }, [handle]);

  const roleForDb = role === "minor" ? "talent" : role;
  const canSubmit = useMemo(() => {
    if (!role || !name.trim() || !handleOk) return false;
    if (roleForDb === "talent" && !birth) return false;
    if (isMinor && !gEmail) return false;
    if (role === "director" && !company.trim()) return false;
    return true;
  }, [role, roleForDb, name, handleOk, birth, isMinor, gEmail, company]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/join" replace />;
  if (profile) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.rpc("on_onboard", {
      p_role: roleForDb,
      p_handle: handle,
      p_display_name: name,
      p_birth_date: roleForDb === "talent" ? birth : null,
      p_guardian_email: isMinor ? gEmail : null,
      p_guardian_name: isMinor ? gName : null,
      p_guardian_phone: isMinor ? gPhone : null,
      p_company: role === "director" ? company : null,
    });
    if (err) {
      setBusy(false);
      return setError(tr(err.message));
    }
    if (legacy.trim()) await supabase.rpc("on_claim_legacy", { p_uid: legacy.trim() });
    localStorage.removeItem("on:role");
    await refresh();
    navigate(roleForDb === "talent" ? "/me/edit?welcome=1" : "/", { replace: true });
  };

  if (!role) {
    return (
      <AuthFrame title="One more step" sub="How will you use ON?">
        <div className="grid gap-3">
          {Object.entries(ROLES).map(([key, r]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRole(key)}
              className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-card p-4 text-start hover:border-green-950"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-mint-100 text-green-900">
                <Icon name={r.icon} />
              </span>
              <span>
                <span className="block font-body text-body font-semibold text-text-primary">{tr(r.title)}</span>
                <span className="block font-body text-small text-text-secondary">{tr(r.body)}</span>
              </span>
            </button>
          ))}
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Set up your profile" sub={ROLES[role].title}>
      <form onSubmit={submit} className="grid gap-4">
        <Input
          label={tr(role === "talent" || role === "minor" ? "Name you work under" : "Your name")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={tr("Handle")}
          required
          dir="ltr"
          value={handle}
          onChange={(e) => {
            setHandleTouched(true);
            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
          }}
          hint={`on.aboustate.tech/@${handle || "you"}`}
          error={handleOk === false ? tr("Taken or not allowed. Use 3 to 24 letters, numbers, dots or underscores.") : ""}
        />

        {roleForDb === "talent" && (
          <Input
            label={tr("Date of birth")}
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            hint={tr("Private. Directors see your playing age, not your birthday.")}
          />
        )}

        {isMinor && (
          <div className="grid gap-4 rounded-lg border border-mint-500 bg-mint-100 p-4">
            <div className="flex items-start gap-3">
              <Icon name="shield" className="mt-[2px] text-green-900" />
              <p className="m-0 font-body text-small text-green-950">
                {tr("You're under 18, so a parent or guardian needs to confirm this profile. Until they do, nobody else can see it. After that, only approved casting directors can.")}
              </p>
            </div>
            <Input label={tr("Parent or guardian's email")} type="email" dir="ltr" required value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={tr("Their name")} value={gName} onChange={(e) => setGName(e.target.value)} />
              <Input label={tr("Their phone")} type="tel" dir="ltr" value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
            </div>
          </div>
        )}

        {role === "director" && (
          <>
            <Input
              label={tr("Where do you cast?")}
              required
              placeholder={tr("Production house, agency or freelance")}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Notice>{tr("We check every director account by hand. You can browse public profiles while you wait; contacts and under-18 profiles open once you're approved.")}</Notice>
          </>
        )}

        {role === "guardian" && (
          <Notice>{tr("Sign up with the same email your child entered. Their profile will show up on your Family page to confirm.")}</Notice>
        )}

        {roleForDb === "talent" && (
          <details className="rounded-md border border-border-subtle bg-surface-card px-4 py-3">
            <summary className="cursor-pointer font-body text-small font-medium text-text-primary">{tr("Signed up on the old ON form?")}</summary>
            <div className="mt-3">
              <Input label={tr("Your ON ID")} placeholder={tr("e.g. 76YEZ934")} dir="ltr" value={legacy} onChange={(e) => setLegacy(e.target.value.toUpperCase())} hint={tr("We'll bring your details across if the email matches.")} />
            </div>
          </details>
        )}

        {error && <Notice>{error}</Notice>}
        <Button type="submit" size="lg" disabled={!canSubmit || busy} className="w-full">
          {busy ? tr("Setting up") : tr("Continue")}
        </Button>
        <button type="button" onClick={() => setRole("")} className="font-body text-small text-text-secondary underline">
          {tr("Change account type")}
        </button>
      </form>
    </AuthFrame>
  );
}
