import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../lib/auth.jsx";
import { Avatar, Badge, Button, Card, Empty, Input, Label, Notice, Spinner, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";
import { InstallCard } from "../components/InstallPrompt.jsx";
import { tr } from "../lib/i18n.jsx";

export function Family() {
  const [wards, setWards] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = () => supabase.rpc("on_guardian_wards").then(({ data }) => setWards(data || []));
  useEffect(() => {
    load();
  }, []);

  const decide = async (id, approve) => {
    setBusy(id);
    setError("");
    const { error: err } = await supabase.rpc("on_guardian_approve", { ward: id, approve });
    setBusy(null);
    if (err) return setError(tr(err.message));
    load();
  };

  if (!wards) return <Spinner />;
  return (
    <Page narrow>
      <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Family")}</h1>
      <p className="mb-6 mt-1 font-body text-body text-text-secondary">{tr("Profiles that list your email as their parent or guardian.")}</p>
      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}
      {wards.length === 0 ? (
        <Empty
          title="No profiles yet"
          body="When your child signs up as under 18 and enters your email, their profile appears here for you to confirm."
          action={<Button to="/join?as=minor" variant="secondary">{tr("Help them sign up")}</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {wards.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar profile={w} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 font-body text-body font-semibold text-text-primary">
                    {w.display_name} {w.verified && <Verified size={14} />}
                  </div>
                  <div className="font-mono text-micro text-text-secondary"><bdi dir="ltr">@{w.handle}</bdi></div>
                  <div className="mt-2">{w.guardian_approved_at ? <Badge tone="accent">{tr("Confirmed")}</Badge> : <Badge>{tr("Waiting for you")}</Badge>}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {w.guardian_approved_at ? (
                    <>
                      <Button size="sm" variant="secondary" to={`/edit/${w.id}`}>
                        <Icon name="edit" size={16} /> {tr("Edit")}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === w.id} onClick={() => decide(w.id, false)}>
                        {tr("Hide profile")}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" disabled={busy === w.id} onClick={() => decide(w.id, true)}>
                      <Icon name="check" size={16} /> {tr("Confirm profile")}
                    </Button>
                  )}
                </div>
              </div>
              {!w.guardian_approved_at && (
                <p className="mb-0 mt-3 font-body text-small text-text-secondary">
                  {tr("Confirming means you agree to this profile being visible to approved casting directors on ON, who will contact you, not your child. You can hide it again at any time.")}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}

export function Settings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [handle, setHandle] = useState(profile.handle);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({});

  const say = (k, text) => setMsg((m) => ({ ...m, [k]: tr(text) }));

  const saveHandle = async () => {
    const { data: ok } = await supabase.rpc("on_handle_available", { h: handle });
    if (!ok) return say("handle", "That handle is taken or not allowed.");
    const { error } = await supabase.from("on_profiles").update({ handle }).eq("id", profile.id);
    say("handle", error ? error.message : "Saved. Your old link no longer works.");
  };
  const saveEmail = async () => {
    const { error } = await supabase.auth.updateUser({ email });
    say("email", error ? error.message : "Check both inboxes to confirm the change.");
  };
  const savePassword = async () => {
    if (password.length < 8) return say("password", "Use at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password });
    setPassword("");
    say("password", error ? error.message : "Password updated.");
  };
  const deleteProfile = async () => {
    if (!confirm(tr("Delete your ON profile, photos and reels? Your login stays so you can come back."))) return;
    const { data: files } = await supabase.storage.from("on-media").list(profile.id, { limit: 100 });
    if (files?.length) await supabase.storage.from("on-media").remove(files.map((f) => `${profile.id}/${f.name}`));
    await supabase.from("on_profiles").delete().eq("id", profile.id);
    await signOut();
    navigate("/");
  };

  return (
    <Page narrow>
      <h1 className="mb-6 mt-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Settings")}</h1>
      <div className="grid gap-4">
        <Card className="grid gap-3 p-5">
          <Label>{tr("Account type")}</Label>
          <div className="flex items-center gap-2 font-body text-body text-text-primary">
            {tr({ talent: "Talent", director: "Casting director", guardian: "Parent or guardian" }[profile.role])}
            {profile.role === "director" && <Badge tone={profile.director_status === "approved" ? "accent" : "neutral"}>{tr(profile.director_status)}</Badge>}
            {profile.is_admin && <Badge tone="inverse">{tr("Admin")}</Badge>}
          </div>
        </Card>
        <Card className="grid gap-3 p-5">
          <Input label="Handle" dir="ltr" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))} hint={`on.aboustate.tech/${handle}`} />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" disabled={handle === profile.handle} onClick={saveHandle}>
              {tr("Change handle")}
            </Button>
            <span className="font-body text-micro text-text-secondary">{msg.handle}</span>
          </div>
        </Card>
        <Card className="grid gap-3 p-5">
          <Input label="Login email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" disabled={email === user.email} onClick={saveEmail}>
              {tr("Change email")}
            </Button>
            <span className="font-body text-micro text-text-secondary">{msg.email}</span>
          </div>
        </Card>
        <Card className="grid gap-3 p-5">
          <Input label="New password" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" disabled={!password} onClick={savePassword}>
              {tr("Update password")}
            </Button>
            <span className="font-body text-micro text-text-secondary">{msg.password}</span>
          </div>
        </Card>
        <InstallCard />
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <Button variant="secondary" onClick={async () => { await signOut(); navigate("/"); }}>
            <Icon name="logout" size={16} /> {tr("Sign out")}
          </Button>
          <Button variant="danger" onClick={deleteProfile}>
            <Icon name="trash" size={16} /> {tr("Delete my ON profile")}
          </Button>
        </Card>
      </div>
    </Page>
  );
}

export function Studio() {
  const { profile } = useAuth();
  return (
    <Page narrow>
      <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Studio")}</h1>
      <p className="mb-6 mt-1 font-body text-body text-text-secondary">{profile.company}</p>
      {profile.director_status === "approved" ? (
        <Card className="grid gap-4 p-5">
          <p className="m-0 font-body text-body text-text-primary">{tr("Castings, shortlists and self-tape requests are being built now and will land here first.")}</p>
          <div>
            <Button to="/explore">
              <Icon name="search" size={16} /> {tr("Search talent")}
            </Button>
          </div>
        </Card>
      ) : (
        <Notice tone="accent">{tr("Your account is under review. We'll open Studio as soon as you're approved.")}</Notice>
      )}
    </Page>
  );
}

export function Safety() {
  return (
    <Page narrow>
      <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Safety and minors")}</h1>
      <div className="mt-5 grid gap-4 font-body text-body leading-body text-text-primary">
        <p className="m-0">{tr("Anyone under 18 joins ON with a parent or guardian. The guardian creates their own account with the email the child gave us, and confirms the profile from there. Until they do, nobody else can see it.")}</p>
        <p className="m-0">{tr("Once confirmed, an under-18 profile is still hidden from the public and from search. Only casting directors we've reviewed and approved can open it, and they see the guardian's contact details, never the child's.")}</p>
        <p className="m-0">{tr("Guardians can edit or hide the profile at any time from their Family page.")}</p>
        <p className="m-0">{tr("Casting directors are checked by hand before they get access. If anyone asks you for money to be cast, or to meet somewhere that isn't a known studio or office, don't go, and tell us at studio@aboustate.tech.")}</p>
      </div>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page narrow>
      <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Privacy")}</h1>
      <div className="mt-5 grid gap-4 font-body text-body leading-body text-text-primary">
        <p className="m-0">{tr("Your public profile (name, photos, reels, look and skills) is visible to anyone with the link, unless you turn it off in Contact and privacy. Your date of birth is never shown to anyone. Your phone, WhatsApp and contact email are only visible to you and to approved casting directors.")}</p>
        <p className="m-0">{tr("We don't sell your data or show ads. Photos are stored with Supabase and served from their storage. You can delete your profile and everything you've uploaded from Settings.")}</p>
        <p className="m-0">{tr("Questions: studio@aboustate.tech")}</p>
      </div>
    </Page>
  );
}
