import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { PRIVATE_COLUMNS } from "../lib/options.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { mediaUrl } from "../lib/media.js";
import { MEDIA_KINDS, playingAge, profileStrength } from "../lib/options.js";
import { Avatar, Badge, Button, Card, Empty, Label, Notice, Spinner, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";

export function ProfilePage() {
  const { slug } = useParams();
  const handle = slug?.startsWith("@") ? slug.slice(1).toLowerCase() : null;
  const { profile: me } = useAuth();
  const [state, setState] = useState({ loading: true });
  const [tab, setTab] = useState("photos");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!handle) return;
    let alive = true;
    (async () => {
      setState({ loading: true });
      const { data: p } = await supabase.from("on_profiles").select("*").eq("handle", handle).maybeSingle();
      if (!p) return alive && setState({ loading: false, missing: true });
      const [{ data: t }, { data: media }, { data: priv }] = await Promise.all([
        supabase.from("on_talent").select("*").eq("profile_id", p.id).maybeSingle(),
        supabase.from("on_media").select("*").eq("profile_id", p.id).order("position").order("created_at"),
        supabase.from("on_talent_private").select(PRIVATE_COLUMNS).eq("profile_id", p.id).maybeSingle(),
      ]);
      if (alive) setState({ loading: false, p, t, media: media || [], priv });
    })();
    return () => {
      alive = false;
    };
  }, [handle]);

  if (!handle) return <NotFoundPage />;
  if (state.loading) return <Spinner />;
  if (state.missing) {
    return (
      <Page narrow>
        <Empty
          title="This profile isn't available"
          body="It may not exist, or it's private. Under-18 profiles are only visible to approved casting directors."
          action={<Button to="/explore" variant="secondary">Explore talent</Button>}
        />
      </Page>
    );
  }

  const { p, t, media, priv } = state;
  const isOwner = me && (me.id === p.id || p.guardian_id === me.id);
  const photos = media.filter((m) => m.kind === "headshot" || m.kind === "photo");
  const videos = media.filter((m) => m.kind === "reel" || m.kind === "selftape");
  const audio = media.filter((m) => m.kind === "audio");
  const age = playingAge(t);
  const cover = mediaUrl(p.cover_path) || (photos[1] && mediaUrl(photos[1].path));

  const facts = [
    age && ["Playing age", age],
    t?.height_cm && ["Height", `${t.height_cm} cm`],
    t?.gender && ["Gender", t.gender],
    t?.build && ["Build", t.build],
    t?.hair_color && ["Hair", t.hair_color],
    t?.eye_color && ["Eyes", t.eye_color],
    t?.nationality && ["Nationality", t.nationality],
    t?.experience_level && ["Experience", t.experience_level],
  ].filter(Boolean);

  const share = async () => {
    const url = `${window.location.origin}/@${p.handle}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${p.display_name} on ON`, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setState((s) => ({ ...s, copied: true }));
    setTimeout(() => setState((s) => ({ ...s, copied: false })), 1800);
  };

  const tabs = [
    ["photos", `Photos${photos.length ? ` ${photos.length}` : ""}`],
    ["reels", `Reels${videos.length + audio.length ? ` ${videos.length + audio.length}` : ""}`],
    ["about", "About"],
  ];

  return (
    <>
      <div className="relative h-[150px] overflow-hidden bg-green-900 sm:h-[220px]">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="bg-pattern-dots-dark h-full w-full opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 to-transparent" />
      </div>

      <Page className="!pt-0">
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="relative z-10 -mt-9 lg:-mt-10">
            <Avatar profile={p} size={120} ring />
            <div className="mt-3 flex items-center gap-2">
              <h1 className="m-0 font-display text-h2 font-bold tracking-tight text-text-primary">{p.display_name}</h1>
              {p.verified && <Verified size={20} />}
            </div>
            <div className="font-mono text-small text-text-secondary">@{p.handle}</div>
            {p.headline && <p className="mb-0 mt-3 font-body text-body text-text-primary">{p.headline}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {t?.available && <Badge tone="accent">Available</Badge>}
              {t?.will_travel && <Badge tone="outline">Will travel</Badge>}
              {p.is_minor && <Badge tone="inverse">Under 18</Badge>}
              {p.role === "director" && <Badge tone="inverse">Casting director</Badge>}
              {(t?.categories || []).map((c) => (
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
            {p.city && (
              <div className="mt-3 flex items-center gap-1 font-body text-small text-text-secondary">
                <Icon name="pin" size={16} />
                {[p.city, p.country].filter(Boolean).join(", ")}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner && (
                <Button to={p.id === me.id ? "/me/edit" : `/edit/${p.id}`} size="sm">
                  <Icon name="edit" size={16} /> Edit profile
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={share}>
                <Icon name="share" size={16} /> {state.copied ? "Link copied" : "Share"}
              </Button>
            </div>

            {isOwner && p.role === "talent" && <StrengthCard p={p} t={t} media={media} />}
            {isOwner && p.is_minor && !p.guardian_approved_at && (
              <div className="mt-4">
                <Notice tone="accent">
                  Waiting for your guardian ({p.guardian_email}) to confirm. Ask them to join ON as a parent with that email.
                </Notice>
              </div>
            )}

            {facts.length > 0 && (
              <Card className="mt-5 p-4">
                <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
                  {facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[10px] uppercase tracking-mono text-text-secondary">{k}</dt>
                      <dd className="m-0 font-body text-small font-semibold text-text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}

            <ContactCard p={p} t={t} priv={priv} me={me} isOwner={isOwner} />
          </aside>

          <section className="pt-5">
            <div className="mb-5 flex gap-1 border-b border-border-subtle">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`-mb-px border-b-2 px-4 py-3 font-body text-small font-semibold transition-colors duration-150 ${
                    tab === key ? "border-green-950 text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "photos" &&
              (photos.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photos.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className={`group relative overflow-hidden rounded-md bg-mint-100 ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                    >
                      <img src={mediaUrl(m.path)} alt={m.caption || p.display_name} loading="lazy" className="aspect-[4/5] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      {m.kind === "headshot" && (
                        <span className="absolute left-2 top-2">
                          <Badge>Headshot</Badge>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No photos yet"
                  body={isOwner ? "Profiles with three or more photos get opened far more often." : "Check back soon."}
                  action={isOwner && <Button to="/me/edit?tab=media">Add photos</Button>}
                />
              ))}

            {tab === "reels" &&
              (videos.length || audio.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {videos.map((m) => (
                    <Card key={m.id} className="overflow-hidden">
                      <video src={mediaUrl(m.path)} controls preload="metadata" playsInline className="aspect-video w-full bg-green-950 object-contain" />
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="truncate font-body text-small font-semibold text-text-primary">{m.caption || MEDIA_KINDS[m.kind]}</span>
                        <Badge tone="outline">{MEDIA_KINDS[m.kind]}</Badge>
                      </div>
                    </Card>
                  ))}
                  {audio.map((m) => (
                    <Card key={m.id} className="p-4">
                      <div className="mb-3 flex items-center gap-2 font-body text-small font-semibold text-text-primary">
                        <Icon name="mic" size={18} /> {m.caption || "Voice clip"}
                      </div>
                      <audio src={mediaUrl(m.path)} controls preload="none" className="w-full" />
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No reels yet"
                  body={isOwner ? "A 30 second self-tape does more than any photo." : "Nothing here yet."}
                  action={isOwner && <Button to="/me/edit?tab=media">Upload a reel</Button>}
                />
              ))}

            {tab === "about" && <About p={p} t={t} />}
          </section>
        </div>
      </Page>

      {lightbox !== null && <Lightbox items={photos} index={lightbox} onClose={() => setLightbox(null)} onMove={setLightbox} />}
    </>
  );
}

function About({ p, t }) {
  const lists = [
    ["Languages", t?.languages],
    ["Accents", t?.accents],
    ["Skills", t?.skills],
  ].filter(([, v]) => v && v.length);
  const credits = t?.credits || [];
  if (!p.bio && !lists.length && !credits.length && !t?.training) {
    return <Empty title="Nothing here yet" />;
  }
  return (
    <div className="grid gap-5">
      {p.bio && (
        <Card className="p-5">
          <Label>Bio</Label>
          <p className="mb-0 mt-2 whitespace-pre-line font-body text-body leading-body text-text-primary">{p.bio}</p>
        </Card>
      )}
      {lists.length > 0 && (
        <Card className="grid gap-4 p-5">
          {lists.map(([k, v]) => (
            <div key={k}>
              <Label>{k}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.map((x) => (
                  <span key={x} className="rounded-pill border border-border-subtle px-3 py-1 font-body text-small text-text-primary">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
      {credits.length > 0 && (
        <Card className="p-5">
          <Label>Credits</Label>
          <ul className="m-0 mt-3 list-none divide-y divide-border-subtle p-0">
            {credits.map((c, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span>
                  <span className="font-body text-body font-semibold text-text-primary">{c.title}</span>
                  {c.role && <span className="font-body text-small text-text-secondary"> as {c.role}</span>}
                  {c.director && <span className="block font-body text-micro text-text-secondary">Dir. {c.director}</span>}
                </span>
                <span className="font-mono text-micro text-text-secondary">{[c.type, c.year].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {t?.training && (
        <Card className="p-5">
          <Label>Training</Label>
          <p className="mb-0 mt-2 whitespace-pre-line font-body text-body text-text-primary">{t.training}</p>
        </Card>
      )}
    </div>
  );
}

function ContactCard({ p, t, priv, me, isOwner }) {
  if (p.role !== "talent") return null;
  if (priv && (isApprovedDirector(me) || me?.is_admin || isOwner)) {
    const rows = p.is_minor
      ? [
          ["user", priv.guardian_name ? `Guardian: ${priv.guardian_name}` : "Guardian"],
          ["phone", priv.guardian_phone],
          ["mail", p.guardian_email],
        ]
      : [
          ["phone", priv.phone],
          ["phone", priv.whatsapp && `WhatsApp ${priv.whatsapp}`],
          ["mail", priv.contact_email],
        ];
    return (
      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>Contact</Label>
          {isOwner && <span className="font-body text-micro text-text-secondary">Only approved directors see this</span>}
        </div>
        <ul className="m-0 grid list-none gap-2 p-0">
          {rows
            .filter(([, v]) => v)
            .map(([icon, v], i) => (
              <li key={i} className="flex items-center gap-2 font-body text-small text-text-primary">
                <Icon name={icon} size={16} className="text-text-secondary" />
                {icon === "mail" ? <a href={`mailto:${v}`} className="underline">{v}</a> : icon === "phone" && !v.startsWith("WhatsApp") ? <a href={`tel:${v}`}>{v}</a> : v}
              </li>
            ))}
          {t?.instagram && (
            <li className="flex items-center gap-2 font-body text-small text-text-primary">
              <Icon name="globe" size={16} className="text-text-secondary" />
              <a href={`https://instagram.com/${t.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" className="underline">
                @{t.instagram.replace(/^@/, "")}
              </a>
            </li>
          )}
        </ul>
      </Card>
    );
  }
  return (
    <Card className="mt-4 flex items-start gap-3 p-4">
      <Icon name="lock" size={18} className="mt-[2px] text-text-secondary" />
      <p className="m-0 font-body text-small text-text-secondary">
        Contact details are visible to approved casting directors.{" "}
        {!me && (
          <Link to="/join?as=director" className="font-semibold text-text-primary underline">
            Cast on ON
          </Link>
        )}
      </p>
    </Card>
  );
}

function StrengthCard({ p, t, media }) {
  const { score, missing } = profileStrength(p, t, media);
  return (
    <Card className="mt-5 p-4">
      <div className="flex items-center justify-between">
        <Label>Profile strength</Label>
        <span className="font-display text-h3 font-bold text-text-primary">{score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-pill bg-beige-300">
        <div className="h-full rounded-pill bg-accent transition-all duration-500" style={{ width: `${score}%` }} />
      </div>
      {missing.length > 0 && (
        <ul className="m-0 mt-3 grid list-none gap-1 p-0">
          {missing.slice(0, 3).map((m) => (
            <li key={m.label}>
              <Link to="/me/edit" className="flex items-center gap-2 font-body text-small text-text-primary hover:underline">
                <Icon name="plus" size={14} className="text-text-accent" /> {m.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Lightbox({ items, index, onClose, onMove }) {
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove((index + 1) % items.length);
      if (e.key === "ArrowLeft") onMove((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onMove]);

  const m = items[index];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="absolute right-4 top-4 text-beige-100" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={28} />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-pill bg-green-900/70 p-3 text-beige-100"
            onClick={(e) => {
              e.stopPropagation();
              onMove((index - 1 + items.length) % items.length);
            }}
          >
            <Icon name="back" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-pill bg-green-900/70 p-3 text-beige-100"
            onClick={(e) => {
              e.stopPropagation();
              onMove((index + 1) % items.length);
            }}
          >
            <Icon name="arrow" />
          </button>
        </>
      )}
      <img src={mediaUrl(m.path)} alt={m.caption || ""} className="max-h-full max-w-full rounded-md object-contain" onClick={(e) => e.stopPropagation()} />
      <div className="absolute bottom-4 left-0 right-0 text-center font-mono text-micro text-beige-300">
        {index + 1} / {items.length}
        {m.caption ? ` · ${m.caption}` : ""}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <Page narrow>
      <Empty title="Page not found" body="That link doesn't go anywhere on ON." action={<Button to="/">Go home</Button>} />
    </Page>
  );
}
