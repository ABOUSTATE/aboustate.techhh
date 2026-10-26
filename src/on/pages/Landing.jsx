import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../lib/media.js";
import { supabase } from "../../lib/supabaseClient.js";
import { Button, Label } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { CARD_SELECT, TalentGrid } from "../components/TalentCard.jsx";
import { Footer } from "../components/Shell.jsx";

const TALENT_STEPS = [
  { icon: "user", title: "Make your profile", body: "Your photos, your reel, your look and what you can do. One link instead of a folder of headshots." },
  { icon: "camera", title: "Keep it fresh", body: "Swap photos, add a self-tape, mark yourself available. Directors see the latest you." },
  { icon: "bolt", title: "Get found", body: "Casting directors search by playing age, look, languages and skills. Show up when you fit." },
];

const FAQ = [
  ["Is it free?", "Yes. Making a profile and being found costs nothing."],
  ["Who can see my phone number?", "Only casting directors we've checked and approved. Everyone else sees your public profile, never your contact details."],
  ["I'm under 18. Can I join?", "Yes, with a parent or guardian. They confirm your account from their own, and your profile is only visible to approved casting directors."],
  ["I cast. How do I get access?", "Sign up as a casting director and tell us where you work. We review every request by hand, usually within a couple of days."],
];

export function Landing() {
  const [faces, setFaces] = useState([]);

  useEffect(() => {
    supabase
      .from("on_profiles")
      .select(CARD_SELECT)
      .eq("role", "talent")
      .not("avatar_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setFaces(data || []));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-green-950 px-4 pb-9 pt-8 sm:px-6 sm:pb-10 sm:pt-9">
        <div className="bg-pattern-dots-dark absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-container items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-pill border border-green-700 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-pill bg-accent" />
              <span className="font-mono text-micro uppercase tracking-mono text-mint-300">Casting is on</span>
            </div>
            <h1 className="m-0 max-w-[14ch] font-display text-display-l font-bold leading-tight tracking-tight text-beige-100">
              Get seen by the people who cast.
            </h1>
            <p className="mt-5 max-w-[46ch] font-body text-body-l leading-body text-mint-300">
              ON is where Egyptian actors, models and voices keep their profile, and where casting directors come looking. No
              waiting rooms, no lost headshots.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/join?as=talent" size="lg">
                Make my profile
              </Button>
              <Button to="/join?as=director" size="lg" variant="inverse">
                I cast
              </Button>
            </div>
            <p className="mt-4 font-body text-small text-green-300">Free for talent. Under 18? Join with a parent.</p>
          </div>

          <HeroCollage faces={faces} />
        </div>
      </section>

      <section className="px-4 py-9 sm:px-6">
        <div className="mx-auto max-w-container">
          <Label>For talent</Label>
          <h2 className="mb-6 mt-2 max-w-[22ch] font-display text-h1 font-bold tracking-tight text-text-primary">Your whole casting self, one link.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TALENT_STEPS.map((s, i) => (
              <div key={s.title} className="rounded-lg border border-border-subtle bg-surface-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-mint-100 text-green-900">
                    <Icon name={s.icon} />
                  </span>
                  <span className="font-mono text-micro text-text-secondary">0{i + 1}</span>
                </div>
                <h3 className="m-0 font-display text-h3 font-semibold text-text-primary">{s.title}</h3>
                <p className="mb-0 mt-2 font-body text-small leading-body text-text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {faces.length > 0 && (
        <section className="px-4 pb-9 sm:px-6">
          <div className="mx-auto max-w-container">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <Label>New on ON</Label>
                <h2 className="m-0 mt-2 font-display text-h2 font-bold tracking-tight text-text-primary">Fresh faces</h2>
              </div>
              <Button to="/explore" variant="secondary" size="sm">
                Explore all
              </Button>
            </div>
            <TalentGrid items={faces.slice(0, 10)} />
          </div>
        </section>
      )}

      <section className="bg-surface-inverse px-4 py-9 sm:px-6">
        <div className="mx-auto grid max-w-container gap-8 lg:grid-cols-2">
          <div>
            <Label>
              <span className="text-mint-300">For casting directors</span>
            </Label>
            <h2 className="mb-4 mt-2 max-w-[18ch] font-display text-h1 font-bold tracking-tight text-beige-100">Search talent the way you brief it.</h2>
            <p className="max-w-[48ch] font-body text-body leading-body text-mint-300">
              Filter by playing age, look, city, languages, accents and skills. Open a profile and the reel is right there. Approved
              directors see contact details and can reach talent directly.
            </p>
            <div className="mt-6">
              <Button to="/join?as=director" variant="inverse">
                Request director access
              </Button>
            </div>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {[
              ["search", "Real filters", "Playing age, height, accents, skills, availability."],
              ["shield", "Checked accounts", "Every director is reviewed before they can see contacts."],
              ["film", "Reels up front", "Self-tapes and showreels play inside the profile."],
              ["lock", "Minors protected", "Under-18 profiles need a guardian and stay hidden from the public."],
            ].map(([icon, t, b]) => (
              <li key={t} className="rounded-lg border border-green-700 p-4">
                <Icon name={icon} className="text-accent" />
                <div className="mt-3 font-body text-small font-semibold text-beige-100">{t}</div>
                <div className="mt-1 font-body text-small text-mint-300">{b}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-9 sm:px-6">
        <div className="mx-auto max-w-[780px]">
          <Label>Questions</Label>
          <h2 className="mb-5 mt-2 font-display text-h2 font-bold tracking-tight text-text-primary">Good to know</h2>
          <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface-card">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-body font-semibold text-text-primary">
                  {q}
                  <Icon name="plus" size={18} className="transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mb-0 mt-2 font-body text-small leading-body text-text-secondary">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-mint-100 p-5">
            <div className="font-display text-h3 font-semibold text-text-primary">Your next role starts with a profile.</div>
            <Button to="/join?as=talent">Join ON</Button>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

// Real profiles when there are some; otherwise a quiet sample card so the
// hero never looks empty (it's clearly labelled as an example).
function HeroCollage({ faces }) {
  const shown = faces.slice(0, 3);
  if (shown.length === 0) {
    return (
      <div className="relative mx-auto w-full max-w-[380px]">
        <div className="rotate-[-3deg] rounded-lg border border-green-700 bg-green-900 p-4 shadow-lg">
          <div className="aspect-[4/5] rounded-md bg-pattern-mark bg-green-700" />
          <div className="mt-3 h-3 w-32 rounded-pill bg-green-700" />
          <div className="mt-2 h-2 w-20 rounded-pill bg-green-700" />
        </div>
        <div className="absolute -bottom-4 right-0 rotate-[4deg] rounded-lg bg-beige-100 px-4 py-3 shadow-lg">
          <div className="font-mono text-micro uppercase tracking-mono text-text-secondary">Your profile</div>
          <div className="font-display text-h3 font-bold text-text-primary">on.aboustate.tech/@you</div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[420px] sm:h-[420px]">
      {shown.map((p, i) => (
        <Link
          key={p.id}
          to={`/@${p.handle}`}
          className="absolute w-[58%] overflow-hidden rounded-lg border-4 border-beige-100 bg-beige-100 shadow-lg transition-transform duration-300 hover:z-10 hover:scale-105"
          style={{
            left: ["0%", "40%", "18%"][i],
            top: ["4%", "0%", "34%"][i],
            transform: `rotate(${[-6, 5, -1][i]}deg)`,
            zIndex: [1, 2, 3][i],
          }}
        >
          <img src={mediaUrl(p.avatar_path)} alt={p.display_name} className="aspect-[4/5] w-full object-cover" />
          <div className="px-2 py-2 font-body text-micro font-semibold text-text-primary">{p.display_name}</div>
        </Link>
      ))}
    </div>
  );
}
