import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { profileStrength } from "../lib/options.js";
import { Avatar, Button, Card, Label, Notice, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { CARD_SELECT, TalentGrid } from "../components/TalentCard.jsx";
import { Page } from "../components/Shell.jsx";
import { tr } from "../lib/i18n.jsx";

function greeting() {
  const h = new Date().getHours();
  return tr(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
}

export function Home() {
  const { profile } = useAuth();
  const [faces, setFaces] = useState([]);
  const [mine, setMine] = useState(null);

  useEffect(() => {
    supabase
      .from("on_profiles")
      .select(CARD_SELECT)
      .eq("role", "talent")
      .eq("published", true)
      .neq("id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setFaces(data || []));
    if (profile.role === "talent") {
      Promise.all([
        supabase.from("on_talent").select("*").eq("profile_id", profile.id).maybeSingle(),
        supabase.from("on_media").select("id, kind").eq("profile_id", profile.id),
      ]).then(([{ data: t }, { data: m }]) => setMine({ t, media: m || [] }));
    }
  }, [profile.id, profile.role]);

  const first = profile.display_name.split(" ")[0];

  return (
    <Page>
      <div className="mb-6">
        <div className="font-mono text-micro uppercase tracking-mono text-text-secondary">{greeting()}</div>
        <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">{first}.</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {profile.role === "talent" && mine && <TalentHome profile={profile} {...mine} />}
        {profile.role === "director" && <DirectorHome profile={profile} />}
        {profile.role === "guardian" && <GuardianHome />}
        {profile.role !== "director" && <CastingsCard profile={profile} />}
      </div>

      {faces.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <Label>{tr("New on ON")}</Label>
              <h2 className="m-0 mt-1 font-display text-h2 font-bold tracking-tight text-text-primary">{tr("Fresh faces")}</h2>
            </div>
            <Button variant="secondary" size="sm" to="/explore">
              {tr("Explore")}
            </Button>
          </div>
          <TalentGrid items={faces} />
        </section>
      )}
    </Page>
  );
}

function TalentHome({ profile, t, media }) {
  const { score, missing } = profileStrength(profile, t, media);
  const url = `on.aboustate.tech/${profile.handle}`;
  const [copied, setCopied] = useState(false);
  return (
    <>
      <Card className="p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>{tr("Profile strength")}</Label>
            <div className="mt-1 font-display text-display-l font-bold leading-tight text-text-primary">{score}%</div>
          </div>
          <Button to="/me/edit">{tr(score < 100 ? "Keep building" : "Edit profile")}</Button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-beige-300">
          <div className="h-full rounded-pill bg-accent transition-all duration-700" style={{ width: `${score}%` }} />
        </div>
        {missing.length > 0 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {missing.slice(0, 4).map((m) => (
              <Link
                key={m.label}
                to={/photo|reel/i.test(m.label) ? "/me/edit?tab=media" : /height|age/i.test(m.label) ? "/me/edit?tab=look" : /pick|languages/i.test(m.label) ? "/me/edit?tab=skills" : /credit/i.test(m.label) ? "/me/edit?tab=credits" : "/me/edit"}
                className="flex items-center justify-between gap-3 rounded-md border border-border-subtle px-4 py-3 font-body text-small text-text-primary transition-colors duration-150 hover:border-green-950"
              >
                {tr(m.label)}
                <span className="font-mono text-micro text-text-accent" dir="ltr">+{m.weight}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mb-0 mt-4 font-body text-small text-text-secondary">{tr("Your profile is complete. Keep your photos and availability current.")}</p>
        )}
        {profile.is_minor && !profile.guardian_approved_at && (
          <div className="mt-4">
            <Notice tone="accent">{tr("Your guardian still needs to confirm your profile. Until then, only you can see it.")}</Notice>
          </div>
        )}
      </Card>

      <div className="flex flex-col justify-between gap-4 rounded-lg bg-green-900 p-5 text-beige-100">
        <div className="flex items-center gap-3">
          <Avatar profile={profile} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-body text-body font-semibold">
              <span className="truncate"><bdi>{profile.display_name}</bdi></span>
              {profile.verified && <Verified size={16} />}
            </div>
            <div className="truncate font-mono text-micro text-mint-300" dir="ltr">{url}</div>
          </div>
        </div>
        <p className="m-0 font-body text-small text-mint-300">{tr("Put this link in your Instagram bio and send it instead of a PDF.")}</p>
        <div className="flex gap-2">
          <Button
            variant="inverse"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(`https://${url}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          >
            <Icon name="share" size={16} /> {copied ? tr("Copied") : tr("Copy link")}
          </Button>
          <Button variant="ghost" size="sm" to={`/${profile.handle}`} className="!text-mint-300">
            {tr("View")}
          </Button>
        </div>
      </div>
    </>
  );
}

function DirectorHome({ profile }) {
  const approved = isApprovedDirector(profile);
  return (
    <Card className="p-5 lg:col-span-3">
      {approved ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>{tr("Director access")}</Label>
            <p className="mb-0 mt-1 font-display text-h3 font-semibold text-text-primary">{tr("You're approved. Search everyone, open contacts.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button to="/boards">
              <Icon name="filter" size={16} /> {tr("Brief boards")}
            </Button>
            <Button variant="secondary" to="/explore">
              <Icon name="search" size={16} /> {tr("Search talent")}
            </Button>
          </div>
        </div>
      ) : profile.director_status === "rejected" ? (
        <Notice>{tr("We couldn't approve this account. Reply to studio@aboustate.tech if you think that's a mistake.")}</Notice>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>{tr("Under review")}</Label>
            <p className="mb-0 mt-1 max-w-[56ch] font-body text-body text-text-primary">
              {tr("We're checking your account. Meanwhile you can browse public profiles. Contacts and under-18 talent open up once you're approved.")}
            </p>
          </div>
          <Button variant="secondary" to="/explore">
            {tr("Browse talent")}
          </Button>
        </div>
      )}
    </Card>
  );
}

// Self-tape requests waiting for an answer, and how many roles are open.
function CastingsCard({ profile }) {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      supabase.from("on_requests").select("id", { count: "exact", head: true }).eq("status", "sent").neq("director", profile.id),
      supabase.from("on_calls").select("id", { count: "exact", head: true }).eq("status", "open").or(`deadline.is.null,deadline.gte.${today}`),
    ]).then(([r, c]) => setCounts({ requests: r.count || 0, calls: c.count || 0 }));
  }, [profile.id]);
  if (!counts) return null;
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5 lg:col-span-3">
      <div>
        <Label>{tr("Castings")}</Label>
        <p className="mb-0 mt-1 font-display text-h3 font-semibold text-text-primary">
          {counts.requests
            ? counts.requests === 1
              ? tr("A casting director asked you for a self-tape.")
              : tr("{n} casting directors asked you for a self-tape.", { n: counts.requests })
            : counts.calls === 0
              ? tr("New roles from casting directors show up here.")
              : counts.calls === 1
                ? tr("1 open call right now.")
                : tr("{n} open calls right now.", { n: counts.calls })}
        </p>
      </div>
      <Button to={counts.requests ? "/calls?tab=requests" : "/calls"}>
        <Icon name="bolt" size={16} /> {tr(counts.requests ? "Answer now" : "See open calls")}
      </Button>
    </Card>
  );
}

function GuardianHome() {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5 lg:col-span-3">
      <div>
        <Label>{tr("Family")}</Label>
        <p className="mb-0 mt-1 font-body text-body text-text-primary">{tr("Confirm and manage your child's profile.")}</p>
      </div>
      <Button to="/family">
        <Icon name="shield" size={16} /> {tr("Open family")}
      </Button>
    </Card>
  );
}
