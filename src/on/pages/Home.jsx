import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { profileStrength } from "../lib/options.js";
import { Avatar, Button, Card, Label, Notice, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { CARD_SELECT, TalentGrid } from "../components/TalentCard.jsx";
import { Page } from "../components/Shell.jsx";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
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
      </div>

      {faces.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <Label>New on ON</Label>
              <h2 className="m-0 mt-1 font-display text-h2 font-bold tracking-tight text-text-primary">Fresh faces</h2>
            </div>
            <Button variant="secondary" size="sm" to="/explore">
              Explore
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
  const url = `on.aboustate.tech/@${profile.handle}`;
  const [copied, setCopied] = useState(false);
  return (
    <>
      <Card className="p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>Profile strength</Label>
            <div className="mt-1 font-display text-display-l font-bold leading-tight text-text-primary">{score}%</div>
          </div>
          <Button to="/me/edit">{score < 100 ? "Keep building" : "Edit profile"}</Button>
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
                {m.label}
                <span className="font-mono text-micro text-text-accent">+{m.weight}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mb-0 mt-4 font-body text-small text-text-secondary">Your profile is complete. Keep your photos and availability current.</p>
        )}
        {profile.is_minor && !profile.guardian_approved_at && (
          <div className="mt-4">
            <Notice tone="accent">Your guardian still needs to confirm your profile. Until then, only you can see it.</Notice>
          </div>
        )}
      </Card>

      <div className="flex flex-col justify-between gap-4 rounded-lg bg-green-900 p-5 text-beige-100">
        <div className="flex items-center gap-3">
          <Avatar profile={profile} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-body text-body font-semibold">
              <span className="truncate">{profile.display_name}</span>
              {profile.verified && <Verified size={16} />}
            </div>
            <div className="truncate font-mono text-micro text-mint-300">{url}</div>
          </div>
        </div>
        <p className="m-0 font-body text-small text-mint-300">Put this link in your Instagram bio and send it instead of a PDF.</p>
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
            <Icon name="share" size={16} /> {copied ? "Copied" : "Copy link"}
          </Button>
          <Button variant="ghost" size="sm" to={`/@${profile.handle}`} className="!text-mint-300">
            View
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
            <Label>Director access</Label>
            <p className="mb-0 mt-1 font-display text-h3 font-semibold text-text-primary">You're approved. Search everyone, open contacts.</p>
          </div>
          <Button to="/explore">
            <Icon name="search" size={16} /> Search talent
          </Button>
        </div>
      ) : profile.director_status === "rejected" ? (
        <Notice>We couldn't approve this account. Reply to studio@aboustate.tech if you think that's a mistake.</Notice>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Label>Under review</Label>
            <p className="mb-0 mt-1 max-w-[56ch] font-body text-body text-text-primary">
              We're checking your account. Meanwhile you can browse public profiles. Contacts and under-18 talent open up once you're approved.
            </p>
          </div>
          <Button variant="secondary" to="/explore">
            Browse talent
          </Button>
        </div>
      )}
    </Card>
  );
}

function GuardianHome() {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5 lg:col-span-3">
      <div>
        <Label>Family</Label>
        <p className="mb-0 mt-1 font-body text-body text-text-primary">Confirm and manage your child's profile.</p>
      </div>
      <Button to="/family">
        <Icon name="shield" size={16} /> Open family
      </Button>
    </Card>
  );
}
