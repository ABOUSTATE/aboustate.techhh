import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { PRIVATE_COLUMNS } from "../lib/options.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { mediaUrl } from "../lib/media.js";
import { MEDIA_KINDS, playingAge, profileStrength } from "../lib/options.js";
import { Avatar, Badge, Button, Card, Empty, Label, Notice, Spinner, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";
import { opt, tr } from "../lib/i18n.jsx";
import { WorkCard } from "../components/WorkCard.jsx";

export function ProfilePage() {
  const { slug } = useParams();
  // Profiles live at /handle. Older /@handle links still work and redirect.
  const legacy = slug?.startsWith("@");
  const raw = (legacy ? slug.slice(1) : slug || "").toLowerCase();
  const handle = /^[a-z0-9_.]{3,24}$/.test(raw) ? raw : null;
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

  if (legacy && handle) return <Navigate to={`/${handle}`} replace />;
  if (!handle) return <NotFoundPage />;
  if (state.loading) return <Spinner />;
  if (state.missing) {
    return (
      <Page narrow>
        <Empty
          title={tr("This profile isn't available")}
          body={tr("It may not exist, or it's private. Under-18 profiles are only visible to approved casting directors.")}
          action={<Button to="/explore" variant="secondary">{tr("Explore talent")}</Button>}
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
    t?.height_cm && ["Height", tr("{n} cm", { n: t.height_cm })],
    t?.gender && ["Gender", opt(t.gender)],
    t?.build && ["Build", opt(t.build)],
    t?.hair_color && ["Hair", opt(t.hair_color)],
    t?.eye_color && ["Eyes", opt(t.eye_color)],
    t?.nationality && ["Nationality", t.nationality],
    t?.experience_level && ["Experience", opt(t.experience_level)],
  ].filter(Boolean);

  const share = async () => {
    const url = `${window.location.origin}/${p.handle}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: tr("{name} on ON", { name: p.display_name }), url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setState((s) => ({ ...s, copied: true }));
    setTimeout(() => setState((s) => ({ ...s, copied: false })), 1800);
  };

  const work = t?.work || [];
  const tabs = [
    ["photos", `${tr("Photos")}${photos.length ? ` ${photos.length}` : ""}`],
    ...(work.length || isOwner ? [["work", `${tr("Past work")}${work.length ? ` ${work.length}` : ""}`]] : []),
    ["reels", `${tr("Reels")}${videos.length + audio.length ? ` ${videos.length + audio.length}` : ""}`],
    ["about", tr("About")],
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
              <h1 className="m-0 font-display text-h2 font-bold tracking-tight text-text-primary"><bdi>{p.display_name}</bdi></h1>
              {p.verified && <Verified size={20} />}
            </div>
            <div className="font-mono text-small text-text-secondary"><bdi dir="ltr">@{p.handle}</bdi></div>
            {p.headline && <p className="mb-0 mt-3 font-body text-body text-text-primary"><bdi>{p.headline}</bdi></p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {t?.available && <Badge tone="accent">{tr("Available")}</Badge>}
              {t?.will_travel && <Badge tone="outline">{tr("Will travel")}</Badge>}
              {p.is_minor && <Badge tone="inverse">{tr("Under 18")}</Badge>}
              {p.seed && <Badge>{tr("Test profile")}</Badge>}
              {p.role === "director" && <Badge tone="inverse">{tr("Casting director")}</Badge>}
              {(t?.categories || []).map((c) => (
                <Badge key={c}>{opt(c)}</Badge>
              ))}
            </div>
            {p.city && (
              <div className="mt-3 flex items-center gap-1 font-body text-small text-text-secondary">
                <Icon name="pin" size={16} />
                {[p.city, p.country].filter(Boolean).map(opt).join(tr(", "))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner && (
                <Button to={p.id === me.id ? "/me/edit" : `/edit/${p.id}`} size="sm">
                  <Icon name="edit" size={16} /> {tr("Edit profile")}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={share}>
                <Icon name="share" size={16} /> {state.copied ? tr("Link copied") : tr("Share")}
              </Button>
            </div>

            {isOwner && p.role === "talent" && <StrengthCard p={p} t={t} media={media} />}
            {isOwner && p.is_minor && !p.guardian_approved_at && (
              <div className="mt-4">
                <Notice tone="accent">
                  {tr("Waiting for your guardian ({email}) to confirm. Ask them to join ON as a parent with that email.", { email: p.guardian_email })}
                </Notice>
              </div>
            )}

            {facts.length > 0 && (
              <Card className="mt-5 p-4">
                <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
                  {facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[10px] uppercase tracking-mono text-text-secondary">{tr(k)}</dt>
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
                        <span className="absolute start-2 top-2">
                          <Badge>{tr("Headshot")}</Badge>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <Empty
                  title={tr("No photos yet")}
                  body={tr(isOwner ? "Profiles with three or more photos get opened far more often." : "Check back soon.")}
                  action={isOwner && <Button to="/me/edit?tab=media">{tr("Add photos")}</Button>}
                />
              ))}

            {tab === "reels" &&
              (videos.length || audio.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {videos.map((m) => (
                    <Card key={m.id} className="overflow-hidden">
                      <video src={mediaUrl(m.path)} controls preload="metadata" playsInline className="aspect-video w-full bg-green-950 object-contain" />
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="truncate font-body text-small font-semibold text-text-primary"><bdi>{m.caption || tr(MEDIA_KINDS[m.kind])}</bdi></span>
                        <Badge tone="outline">{tr(MEDIA_KINDS[m.kind])}</Badge>
                      </div>
                    </Card>
                  ))}
                  {audio.map((m) => (
                    <Card key={m.id} className="p-4">
                      <div className="mb-3 flex items-center gap-2 font-body text-small font-semibold text-text-primary">
                        <Icon name="mic" size={18} /> {m.caption || tr("Voice clip")}
                      </div>
                      <audio src={mediaUrl(m.path)} controls preload="none" className="w-full" />
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty
                  title={tr("No reels yet")}
                  body={tr(isOwner ? "A 30 second self-tape does more than any photo." : "Nothing here yet.")}
                  action={isOwner && <Button to="/me/edit?tab=media">{tr("Upload a reel")}</Button>}
                />
              ))}

            {tab === "work" &&
              (work.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {work.map((w, i) => (
                    <WorkCard key={i} item={w} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No past work yet"
                  body="Link the ads and films you've been in. They play right here, straight from YouTube, Google Drive, Vimeo or Instagram."
                  action={<Button to="/me/edit?tab=work">{tr("Add past work")}</Button>}
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
    return <Empty title={tr("Nothing here yet")} />;
  }
  return (
    <div className="grid gap-5">
      {p.bio && (
        <Card className="p-5">
          <Label>{tr("Bio")}</Label>
          <p className="mb-0 mt-2 whitespace-pre-line font-body text-body leading-body text-text-primary"><bdi>{p.bio}</bdi></p>
        </Card>
      )}
      {lists.length > 0 && (
        <Card className="grid gap-4 p-5">
          {lists.map(([k, v]) => (
            <div key={k}>
              <Label>{tr(k)}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {v.map((x) => (
                  <span key={x} className="rounded-pill border border-border-subtle px-3 py-1 font-body text-small text-text-primary">
                    {opt(x)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
      {credits.length > 0 && (
        <Card className="p-5">
          <Label>{tr("Credits")}</Label>
          <ul className="m-0 mt-3 list-none divide-y divide-border-subtle p-0">
            {credits.map((c, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span>
                  <span className="font-body text-body font-semibold text-text-primary"><bdi>{c.title}</bdi></span>
                  {c.role && <span className="font-body text-small text-text-secondary"> {tr("as {role}", { role: c.role })}</span>}
                  {c.director && <span className="block font-body text-micro text-text-secondary">{tr("Dir. {name}", { name: c.director })}</span>}
                </span>
                <span className="font-mono text-micro text-text-secondary">{[opt(c.type), c.year].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {t?.training && (
        <Card className="p-5">
          <Label>{tr("Training")}</Label>
          <p className="mb-0 mt-2 whitespace-pre-line font-body text-body text-text-primary"><bdi>{t.training}</bdi></p>
        </Card>
      )}
    </div>
  );
}

function ContactCard({ p, t, priv, me, isOwner }) {
  if (p.role !== "talent") return null;
  if (priv && (isApprovedDirector(me) || me?.is_admin || isOwner)) {
    // [icon, shown text, link]
    const rows = p.is_minor
      ? [
          ["user", priv.guardian_name ? tr("Guardian: {name}", { name: priv.guardian_name }) : tr("Guardian")],
          ["phone", priv.guardian_phone, priv.guardian_phone && `tel:${priv.guardian_phone}`],
          ["mail", p.guardian_email, `mailto:${p.guardian_email}`],
        ]
      : [
          ["phone", priv.phone, priv.phone && `tel:${priv.phone}`],
          ["phone", priv.whatsapp && tr("WhatsApp {n}", { n: priv.whatsapp }), priv.whatsapp && `https://wa.me/${priv.whatsapp.replace(/\D/g, "")}`],
          ["mail", priv.contact_email, `mailto:${priv.contact_email}`],
        ];
    return (
      <Card className="mt-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label>{tr("Contact")}</Label>
          {isOwner && <span className="font-body text-micro text-text-secondary">{tr("Only approved directors see this")}</span>}
        </div>
        <ul className="m-0 grid list-none gap-2 p-0">
          {rows
            .filter(([, v]) => v)
            .map(([icon, v, href], i) => (
              <li key={i} className="flex items-center gap-2 font-body text-small text-text-primary">
                <Icon name={icon} size={16} className="text-text-secondary" />
                {href ? (
                  <a href={href} className="underline" dir="ltr" target={href.startsWith("https") ? "_blank" : undefined} rel="noopener">
                    {v}
                  </a>
                ) : (
                  v
                )}
              </li>
            ))}
          {t?.instagram && (
            <li className="flex items-center gap-2 font-body text-small text-text-primary">
              <Icon name="globe" size={16} className="text-text-secondary" />
              <a href={`https://instagram.com/${t.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener" className="underline" dir="ltr">
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
        {tr("Contact details are visible to approved casting directors.")}{" "}
        {!me && (
          <Link to="/join?as=director" className="font-semibold text-text-primary underline">
            {tr("Cast on ON")}
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
        <Label>{tr("Profile strength")}</Label>
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
                <Icon name="plus" size={14} className="text-text-accent" /> {tr(m.label)}
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
      <button type="button" className="absolute end-4 top-4 text-beige-100" aria-label={tr("Close")} onClick={onClose}>
        <Icon name="close" size={28} />
      </button>
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label={tr("Previous")}
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded-pill bg-green-900/70 p-3 text-beige-100"
            onClick={(e) => {
              e.stopPropagation();
              onMove((index - 1 + items.length) % items.length);
            }}
          >
            <Icon name="back" />
          </button>
          <button
            type="button"
            aria-label={tr("Next")}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-pill bg-green-900/70 p-3 text-beige-100"
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
      <Empty title={tr("Page not found")} body={tr("That link doesn't go anywhere on ON.")} action={<Button to="/">{tr("Go home")}</Button>} />
    </Page>
  );
}
