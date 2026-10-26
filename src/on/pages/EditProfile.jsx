import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { PRIVATE_COLUMNS } from "../lib/options.js";
import { useAuth } from "../lib/auth.jsx";
import { mediaUrl, removeFile, uploadFile } from "../lib/media.js";
import {
  ACCENTS, BUILDS, CATEGORIES, CITIES, CREDIT_TYPES, EYES, GENDERS, HAIR, LANGUAGES, LEVELS, MEDIA_KINDS, SKILLS, profileStrength,
} from "../lib/options.js";
import { Avatar, Badge, Button, Card, Chips, Input, Label, Notice, Select, Spinner, Textarea, Toggle } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";
import { opt, tr } from "../lib/i18n.jsx";
import { parseVideoLink } from "../lib/embeds.js";
import { WorkCard } from "../components/WorkCard.jsx";

const TABS = [
  ["basics", "Basics"],
  ["media", "Photos & reels"],
  ["work", "Past work"],
  ["look", "Look"],
  ["skills", "Skills"],
  ["credits", "Credits"],
  ["contact", "Contact & privacy"],
];

const PROFILE_FIELDS = ["display_name", "headline", "bio", "city", "country", "website", "published", "avatar_path", "cover_path"];
const TALENT_FIELDS = [
  "gender", "playing_age_min", "playing_age_max", "height_cm", "weight_kg", "build", "eye_color", "hair_color", "nationality",
  "languages", "accents", "skills", "categories", "experience_level", "training", "credits", "work", "available", "will_travel", "instagram",
];
const PRIVATE_FIELDS = ["phone", "whatsapp", "contact_email", "guardian_name", "guardian_phone"];

function pick(obj, keys) {
  return Object.fromEntries(keys.map((k) => [k, obj?.[k] ?? null]));
}

function numOrNull(v) {
  return v === "" || v === null || v === undefined ? null : Number(v);
}

export function EditProfile() {
  const { id: paramId } = useParams();
  const [params, setParams] = useSearchParams();
  const { profile: me, refresh } = useAuth();
  const navigate = useNavigate();
  const targetId = paramId || me?.id;
  const tab = params.get("tab") || "basics";

  const [p, setP] = useState(null);
  const [t, setT] = useState(null);
  const [priv, setPriv] = useState(null);
  const [media, setMedia] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      const [{ data: pp }, { data: tt }, { data: vv }, { data: mm }] = await Promise.all([
        supabase.from("on_profiles").select("*").eq("id", targetId).maybeSingle(),
        supabase.from("on_talent").select("*").eq("profile_id", targetId).maybeSingle(),
        supabase.from("on_talent_private").select(PRIVATE_COLUMNS).eq("profile_id", targetId).maybeSingle(),
        supabase.from("on_media").select("*").eq("profile_id", targetId).order("position").order("created_at"),
      ]);
      setP(pp);
      setT(tt || { profile_id: targetId, languages: [], accents: [], skills: [], categories: [], credits: [] });
      setPriv(vv || { profile_id: targetId });
      setMedia(mm || []);
    })();
  }, [targetId]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!p || !t) return <Spinner />;
  if (p.id !== me.id && p.guardian_id !== me.id && !me.is_admin) {
    return (
      <Page narrow>
        <Notice>{tr("You can't edit this profile.")}</Notice>
      </Page>
    );
  }

  const setProfile = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  // For fields that were already written to the database (uploads).
  const setProfileSaved = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const setTalent = (k, v) => {
    setT((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  const setPrivate = (k, v) => {
    setPriv((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    const talent = pick(t, TALENT_FIELDS);
    ["playing_age_min", "playing_age_max", "height_cm", "weight_kg"].forEach((k) => (talent[k] = numOrNull(talent[k])));
    talent.credits = (talent.credits || []).filter((c) => c.title?.trim());
    talent.work = (talent.work || []).filter((w) => parseVideoLink(w.url));
    const results = await Promise.all([
      supabase.from("on_profiles").update(pick(p, PROFILE_FIELDS)).eq("id", p.id),
      p.role === "talent" ? supabase.from("on_talent").update(talent).eq("profile_id", p.id) : { error: null },
      p.role === "talent" ? supabase.from("on_talent_private").update(pick(priv, PRIVATE_FIELDS)).eq("profile_id", p.id) : { error: null },
    ]);
    setSaving(false);
    const err = results.find((r) => r.error)?.error;
    if (err) return setMsg(tr(err.message));
    setDirty(false);
    setMsg(tr("Saved"));
    setTimeout(() => setMsg(""), 2000);
    if (p.id === me.id) refresh();
  };

  const { score, missing } = profileStrength(p, t, media);
  const isWelcome = params.get("welcome") === "1";

  return (
    <Page>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar profile={p} size={48} />
          <div>
            <h1 className="m-0 font-display text-h2 font-bold tracking-tight text-text-primary">{tr("Edit profile")}</h1>
            <Link to={`/@${p.handle}`} className="font-mono text-small text-text-secondary hover:text-text-primary" dir="ltr">
              on.aboustate.tech/@{p.handle}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-end sm:block">
            <div className="font-mono text-micro uppercase tracking-mono text-text-secondary">{tr("Strength")}</div>
            <div className="font-display text-h3 font-bold text-text-primary" dir="ltr">{score}%</div>
          </div>
          <Button variant="secondary" to={`/@${p.handle}`}>
            {tr("View profile")}
          </Button>
        </div>
      </div>

      {isWelcome && (
        <div className="mb-5">
          <Notice tone="dark">
            <span className="font-semibold">{tr("You're on ON.")}</span>{" "}
            {tr("Start with a clear photo of your face, then add a few more and a short self-tape. That's what casting directors open first.")}
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {TABS.filter(([k]) => p.role === "talent" || k === "basics").map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setParams({ tab: key }, { replace: true })}
              className={`shrink-0 rounded-pill px-4 py-2 text-start font-body text-small font-semibold transition-colors duration-150 lg:rounded-md ${
                tab === key ? "bg-green-900 text-beige-100" : "text-text-secondary hover:bg-surface-card hover:text-text-primary"
              }`}
            >
              {tr(label)}
            </button>
          ))}
          {missing.length > 0 && (
            <div className="mt-4 hidden rounded-md border border-border-subtle bg-surface-card p-3 lg:block">
              <Label>{tr("Next up")}</Label>
              <ul className="m-0 mt-2 grid list-none gap-1 p-0 font-body text-micro text-text-primary">
                {missing.slice(0, 4).map((m) => (
                  <li key={m.label} className="flex gap-2">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-pill bg-accent" />
                    {tr(m.label)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="min-w-0 pb-9">
          {tab === "basics" && <Basics p={p} setProfile={setProfile} setProfileSaved={setProfileSaved} />}
          {tab === "media" && <MediaManager p={p} media={media} setMedia={setMedia} setProfile={setProfileSaved} />}
          {tab === "work" && <PastWork t={t} setTalent={setTalent} />}
          {tab === "look" && <Look t={t} setTalent={setTalent} />}
          {tab === "skills" && <Skills t={t} setTalent={setTalent} />}
          {tab === "credits" && <Credits t={t} setTalent={setTalent} />}
          {tab === "contact" && <Contact p={p} t={t} priv={priv} setProfile={setProfile} setTalent={setTalent} setPrivate={setPrivate} />}
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 px-4 transition-all duration-200 md:bottom-5 ${dirty || msg ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-4 rounded-lg bg-green-950 px-4 py-3 shadow-lg">
          <span className="font-body text-small text-beige-100">{msg || tr("You have unsaved changes")}</span>
          {dirty && (
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? tr("Saving") : tr("Save changes")}
            </Button>
          )}
        </div>
      </div>
    </Page>
  );
}

function Section({ title, hint, children }) {
  return (
    <Card className="mb-4 p-5">
      <h2 className="m-0 font-display text-h3 font-semibold tracking-tight text-text-primary">{tr(title)}</h2>
      {hint && <p className="mb-0 mt-1 font-body text-small text-text-secondary">{tr(hint)}</p>}
      <div className="mt-4 grid gap-4">{children}</div>
    </Card>
  );
}

function Basics({ p, setProfile, setProfileSaved }) {
  return (
    <>
      <Section title="Profile photo" hint="A clear, recent photo of your face. No filters, no sunglasses.">
        <ImagePicker p={p} field="avatar_path" setProfile={setProfileSaved} round />
      </Section>
      <Section title="Cover" hint="Wide image across the top of your profile. Optional.">
        <ImagePicker p={p} field="cover_path" setProfile={setProfileSaved} />
      </Section>
      <Section title="About you">
        <Input label="Name" value={p.display_name || ""} onChange={(e) => setProfile("display_name", e.target.value)} maxLength={80} />
        <Input
          label="Headline"
          placeholder="Actor and dancer. Cairene and Sa'idi accents."
          value={p.headline || ""}
          maxLength={120}
          onChange={(e) => setProfile("headline", e.target.value)}
          hint={`${(p.headline || "").length}/120`}
        />
        <Textarea
          label="Bio"
          value={p.bio || ""}
          maxLength={600}
          onChange={(e) => setProfile("bio", e.target.value)}
          hint={tr("{n}/600. Write it the way you'd introduce yourself at a casting.", { n: (p.bio || "").length })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field2 label="City">
            <input list="on-cities" className="w-full rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-green-950" value={p.city || ""} onChange={(e) => setProfile("city", e.target.value)} />
            <datalist id="on-cities">
              {CITIES.map((c) => (
                <option key={c} value={c}>{opt(c)}</option>
              ))}
            </datalist>
          </Field2>
          <Input label="Country" value={p.country || ""} onChange={(e) => setProfile("country", e.target.value)} />
        </div>
        {p.role === "director" && <Input label="Website" type="url" dir="ltr" value={p.website || ""} onChange={(e) => setProfile("website", e.target.value)} />}
      </Section>
    </>
  );
}

function Field2({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-micro font-medium text-text-secondary">{tr(label)}</span>
      {children}
    </label>
  );
}

// The avatar can point at a gallery photo; only delete files nothing else uses.
async function removeIfUnused(path) {
  if (!path) return;
  const { count } = await supabase.from("on_media").select("id", { head: true, count: "exact" }).eq("path", path);
  if (!count) removeFile(path);
}

function ImagePicker({ p, field, setProfile, round }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pickFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const up = await uploadFile(p.id, file, { maxSide: round ? 900 : 2200 });
      const old = p[field];
      setProfile(field, up.path);
      await supabase.from("on_profiles").update({ [field]: up.path }).eq("id", p.id);
      removeIfUnused(old);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };
  const src = mediaUrl(p[field]);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className={`overflow-hidden bg-mint-100 ${round ? "h-[96px] w-[96px] rounded-pill" : "aspect-[3/1] w-full max-w-[420px] rounded-md"}`}>
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-mint-500"><Icon name="camera" size={28} /></div>}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => input.current.click()} disabled={busy}>
          {tr(busy ? "Uploading" : src ? "Replace" : "Upload")}
        </Button>
        {src && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const old = p[field];
              setProfile(field, null);
              await supabase.from("on_profiles").update({ [field]: null }).eq("id", p.id);
              removeIfUnused(old);
            }}
          >
            Remove
          </Button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickFile(e.target.files[0])} />
      {error && <span className="w-full font-body text-micro text-text-primary">{error}</span>}
    </div>
  );
}

function MediaManager({ p, media, setMedia, setProfile }) {
  const photoInput = useRef(null);
  const videoInput = useRef(null);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const photos = media.filter((m) => m.kind === "headshot" || m.kind === "photo");
  const clips = media.filter((m) => !["headshot", "photo"].includes(m.kind));

  const upload = async (files, kindFor) => {
    setError("");
    let position = media.length;
    let hasAvatar = !!p.avatar_path;
    let photoCount = photos.length;
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}`;
      setQueue((q) => [...q, key]);
      try {
        const up = await uploadFile(p.id, file);
        const kind = kindFor(file, photoCount);
        const { data, error: err } = await supabase
          .from("on_media")
          .insert({ profile_id: p.id, kind, path: up.path, mime: up.mime, width: up.width, height: up.height, duration_s: up.duration_s, bytes: up.bytes, position: position++ })
          .select()
          .single();
        if (err) {
          removeFile(up.path);
          throw err;
        }
        setMedia((m) => [...m, data]);
        if (kind === "headshot" || kind === "photo") photoCount++;
        if ((kind === "headshot" || kind === "photo") && !hasAvatar) {
          hasAvatar = true;
          setProfile("avatar_path", up.path);
          await supabase.from("on_profiles").update({ avatar_path: up.path }).eq("id", p.id);
        }
      } catch (e) {
        setError(e.message);
      }
      setQueue((q) => q.filter((k) => k !== key));
    }
  };

  const update = async (m, patch) => {
    setMedia((list) => list.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
    await supabase.from("on_media").update(patch).eq("id", m.id);
  };

  const remove = async (m) => {
    if (!confirm(tr("Delete this from your profile?"))) return;
    setMedia((list) => list.filter((x) => x.id !== m.id));
    await supabase.from("on_media").delete().eq("id", m.id);
    if (p.avatar_path === m.path) {
      // Deleting the profile photo hands the job to the next photo.
      const next = photos.find((x) => x.id !== m.id)?.path || null;
      setProfile("avatar_path", next);
      await supabase.from("on_profiles").update({ avatar_path: next }).eq("id", p.id);
    }
    if (p.cover_path !== m.path) removeFile(m.path);
  };

  const move = async (m, dir, list) => {
    const i = list.findIndex((x) => x.id === m.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const reordered = [...list];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    const positions = Object.fromEntries(reordered.map((x, k) => [x.id, k]));
    setMedia((all) => [...all.map((x) => (x.id in positions ? { ...x, position: positions[x.id] } : x))].sort((a, b) => a.position - b.position));
    await Promise.all(reordered.map((x, k) => supabase.from("on_media").update({ position: k }).eq("id", x.id)));
  };

  return (
    <>
      <Section title="Photos" hint={tr("{n}/16. Headshots first, then full length, then anything that shows range. The first photo leads your profile.", { n: photos.length })}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {photos.map((m, i) => (
            <div key={m.id} className="group relative overflow-hidden rounded-md border border-border-subtle bg-mint-100">
              <img src={mediaUrl(m.path)} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="absolute start-2 top-2 flex gap-1">
                {i === 0 && <Badge tone="accent">{tr("Lead")}</Badge>}
                {m.kind === "headshot" && <Badge>{tr("Headshot")}</Badge>}
                {p.avatar_path === m.path && <Badge tone="inverse">{tr("Profile photo")}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-1 border-t border-border-subtle bg-surface-card p-2">
                <IconBtn label="Move earlier" icon="back" onClick={() => move(m, -1, photos)} />
                <IconBtn label="Move later" icon="arrow" onClick={() => move(m, 1, photos)} />
                <IconBtn
                  label={m.kind === "headshot" ? "Mark as photo" : "Mark as headshot"}
                  icon="star"
                  active={m.kind === "headshot"}
                  onClick={() => update(m, { kind: m.kind === "headshot" ? "photo" : "headshot" })}
                />
                <IconBtn
                  label="Use as profile photo"
                  icon="user"
                  active={p.avatar_path === m.path}
                  onClick={async () => {
                    setProfile("avatar_path", m.path);
                    await supabase.from("on_profiles").update({ avatar_path: m.path }).eq("id", p.id);
                  }}
                />
                <span className="ms-auto" />
                <IconBtn label="Delete" icon="trash" onClick={() => remove(m)} />
              </div>
            </div>
          ))}
          {photos.length < 16 && (
            <button
              type="button"
              onClick={() => photoInput.current.click()}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle bg-surface-card text-text-secondary transition-colors duration-150 hover:border-green-950 hover:text-text-primary"
            >
              <Icon name="plus" size={28} />
              <span className="font-body text-small font-semibold">{tr("Add photos")}</span>
            </button>
          )}
        </div>
        <input
          ref={photoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            upload(e.target.files, (_f, n) => (n === 0 ? "headshot" : "photo"));
            e.target.value = "";
          }}
        />
      </Section>

      <Section title="Reels, self-tapes and voice" hint={tr("{n}/4. Up to 50 MB each. MP4 from your phone works fine.", { n: clips.length })}>
        <div className="grid gap-3 sm:grid-cols-2">
          {clips.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-md border border-border-subtle bg-surface-card">
              {m.kind === "audio" ? (
                <div className="p-4">
                  <audio src={mediaUrl(m.path)} controls preload="none" className="w-full" />
                </div>
              ) : (
                <video src={mediaUrl(m.path)} controls preload="metadata" playsInline className="aspect-video w-full bg-green-950 object-contain" />
              )}
              <div className="grid gap-2 p-3">
                <div className="flex gap-2">
                  <select
                    className="rounded-sm border border-border-subtle bg-surface-card px-2 py-1 font-body text-small text-text-primary"
                    value={m.kind}
                    onChange={(e) => update(m, { kind: e.target.value })}
                  >
                    {(m.kind === "audio" ? ["audio"] : ["reel", "selftape"]).map((k) => (
                      <option key={k} value={k}>
                        {tr(MEDIA_KINDS[k])}
                      </option>
                    ))}
                  </select>
                  <input
                    className="min-w-0 flex-1 rounded-sm border border-border-subtle bg-surface-card px-2 py-1 font-body text-small text-text-primary"
                    placeholder={tr("Caption, e.g. Monologue in Sa'idi")}
                    defaultValue={m.caption || ""}
                    maxLength={200}
                    onBlur={(e) => e.target.value !== (m.caption || "") && update(m, { caption: e.target.value })}
                  />
                  <IconBtn label="Delete" icon="trash" onClick={() => remove(m)} />
                </div>
              </div>
            </div>
          ))}
          {clips.length < 4 && (
            <button
              type="button"
              onClick={() => videoInput.current.click()}
              className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle bg-surface-card text-text-secondary transition-colors duration-150 hover:border-green-950 hover:text-text-primary"
            >
              <Icon name="film" size={28} />
              <span className="font-body text-small font-semibold">{tr("Add a reel, self-tape or voice clip")}</span>
            </button>
          )}
        </div>
        <input
          ref={videoInput}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a"
          hidden
          onChange={(e) => {
            upload(e.target.files, (f) => (f.type.startsWith("audio/") ? "audio" : "selftape"));
            e.target.value = "";
          }}
        />
      </Section>

      {queue.length > 0 && <Notice tone="accent">{queue.length > 1 ? tr("Uploading {n} files. Keep this page open.", { n: queue.length }) : tr("Uploading 1 file. Keep this page open.")}</Notice>}
      {error && <Notice>{tr(error)}</Notice>}
    </>
  );
}

function IconBtn({ label, icon, onClick, active }) {
  return (
    <button
      type="button"
      title={tr(label)}
      aria-label={tr(label)}
      onClick={onClick}
      className={`rounded-sm p-1 transition-colors duration-150 ${active ? "bg-green-900 text-beige-100" : "text-text-secondary hover:bg-beige-100 hover:text-text-primary"}`}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

// Links only: the videos stay on YouTube, Drive, Vimeo or Instagram and play
// in embedded players, so they cost no storage on ON.
function PastWork({ t, setTalent }) {
  const work = t.work || [];
  const set = (i, k, v) => setTalent("work", work.map((w, j) => (j === i ? { ...w, [k]: v } : w)));
  return (
    <Section title="Past work" hint="Ads, films and series you've been in. Paste a link from YouTube, Google Drive, Vimeo or Instagram and it plays on your profile. Nothing is uploaded.">
      {work.map((w, i) => {
        const video = parseVideoLink(w.url);
        return (
          <div key={i} className="grid gap-3 rounded-md border border-border-subtle p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label="Link"
                dir="ltr"
                type="url"
                placeholder="https://"
                value={w.url || ""}
                onChange={(e) => set(i, "url", e.target.value)}
                error={w.url && !video ? "Paste a YouTube, Google Drive, Vimeo or Instagram link." : ""}
                hint={video ? video.provider + (video.provider === "Google Drive" ? " · " + tr("Share it as “Anyone with the link”.") : "") : ""}
              />
              <div className="flex items-end">
                <IconBtn label="Remove" icon="trash" onClick={() => setTalent("work", work.filter((_, j) => j !== i))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1fr]">
              <Input label="Title" value={w.title || ""} onChange={(e) => set(i, "title", e.target.value)} maxLength={80} />
              <Input label="Brand or client" value={w.brand || ""} onChange={(e) => set(i, "brand", e.target.value)} maxLength={60} />
              <Input label="Your role" value={w.role || ""} onChange={(e) => set(i, "role", e.target.value)} maxLength={60} />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_0.6fr_1fr]">
              <Select label="Type" options={CREDIT_TYPES} value={w.type || ""} onChange={(e) => set(i, "type", e.target.value)} />
              <Input label="Year" type="number" min={1950} max={2100} value={w.year || ""} onChange={(e) => set(i, "year", e.target.value)} />
              <div className="flex items-end pb-2">
                <Toggle label="Vertical video" checked={!!(w.vertical ?? video?.vertical)} onChange={(v) => set(i, "vertical", v)} />
              </div>
            </div>
            {video && <WorkCard item={w} />}
          </div>
        );
      })}
      {work.length < 12 && (
        <div>
          <Button variant="secondary" size="sm" onClick={() => setTalent("work", [...work, { url: "", title: "", brand: "", role: "", type: "TV ad", year: "" }])}>
            <Icon name="plus" size={16} /> {tr("Add past work")}
          </Button>
        </div>
      )}
    </Section>
  );
}

function Look({ t, setTalent }) {
  return (
    <>
      <Section title="Playing age" hint="The ages you can believably play on screen, not your real age.">
        <div className="grid grid-cols-2 gap-4">
          <Input label="From" type="number" min={1} max={100} value={t.playing_age_min ?? ""} onChange={(e) => setTalent("playing_age_min", e.target.value)} />
          <Input label="To" type="number" min={1} max={100} value={t.playing_age_max ?? ""} onChange={(e) => setTalent("playing_age_max", e.target.value)} />
        </div>
      </Section>
      <Section title="Your look">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Gender" options={GENDERS} value={t.gender || ""} onChange={(e) => setTalent("gender", e.target.value || null)} />
          <Select label="Build" options={BUILDS} value={t.build || ""} onChange={(e) => setTalent("build", e.target.value || null)} />
          <Input label="Height (cm)" type="number" min={40} max={250} value={t.height_cm ?? ""} onChange={(e) => setTalent("height_cm", e.target.value)} />
          <Input label="Weight (kg)" type="number" min={5} max={300} value={t.weight_kg ?? ""} onChange={(e) => setTalent("weight_kg", e.target.value)} hint="Optional" />
          <Select label="Hair" options={HAIR} value={t.hair_color || ""} onChange={(e) => setTalent("hair_color", e.target.value || null)} />
          <Select label="Eyes" options={EYES} value={t.eye_color || ""} onChange={(e) => setTalent("eye_color", e.target.value || null)} />
          <Input label="Nationality" value={t.nationality || ""} onChange={(e) => setTalent("nationality", e.target.value)} />
        </div>
      </Section>
    </>
  );
}

function Skills({ t, setTalent }) {
  return (
    <>
      <Section title="What you do" hint="Pick everything that applies.">
        <Chips options={CATEGORIES} value={t.categories || []} onChange={(v) => setTalent("categories", v)} />
        <Select label="Experience" options={LEVELS} value={t.experience_level || ""} onChange={(e) => setTalent("experience_level", e.target.value || null)} />
      </Section>
      <Section title="Languages">
        <Chips options={LANGUAGES} value={t.languages || []} onChange={(v) => setTalent("languages", v)} />
      </Section>
      <Section title="Accents and dialects">
        <Chips options={ACCENTS} value={t.accents || []} onChange={(v) => setTalent("accents", v)} />
      </Section>
      <Section title="Skills" hint="Only what you could do on set tomorrow.">
        <Chips options={[...new Set([...SKILLS, ...(t.skills || [])])]} value={t.skills || []} onChange={(v) => setTalent("skills", v)} />
        <AddCustom onAdd={(s) => setTalent("skills", [...new Set([...(t.skills || []), s])])} />
      </Section>
      <Section title="Training">
        <Textarea
          label="Courses, workshops, schools"
          value={t.training || ""}
          maxLength={600}
          onChange={(e) => setTalent("training", e.target.value)}
        />
      </Section>
    </>
  );
}

function AddCustom({ onAdd }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim().slice(0, 40));
        setV("");
      }}
    >
      <input
        className="min-w-0 flex-1 rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-green-950"
        placeholder={tr("Something else")}
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <Button type="submit" variant="secondary" size="sm">
        Add
      </Button>
    </form>
  );
}

function Credits({ t, setTalent }) {
  const credits = t.credits || [];
  const set = (i, k, v) => setTalent("credits", credits.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  return (
    <Section title="Credits" hint="Films, series, ads, theatre. Newest first. Student work counts.">
      {credits.map((c, i) => (
        <div key={i} className="grid gap-3 rounded-md border border-border-subtle p-3 sm:grid-cols-[1.4fr_1fr_0.9fr_0.6fr_auto]">
          <Input label="Title" value={c.title || ""} onChange={(e) => set(i, "title", e.target.value)} />
          <Input label="Role" value={c.role || ""} onChange={(e) => set(i, "role", e.target.value)} />
          <Select label="Type" options={CREDIT_TYPES} value={c.type || ""} onChange={(e) => set(i, "type", e.target.value)} />
          <Input label="Year" type="number" min={1950} max={2100} value={c.year || ""} onChange={(e) => set(i, "year", e.target.value)} />
          <div className="flex items-end">
            <IconBtn label="Remove credit" icon="trash" onClick={() => setTalent("credits", credits.filter((_, j) => j !== i))} />
          </div>
          <Input className="sm:col-span-4" label="Director (optional)" value={c.director || ""} onChange={(e) => set(i, "director", e.target.value)} />
        </div>
      ))}
      {credits.length < 30 && (
        <div>
          <Button variant="secondary" size="sm" onClick={() => setTalent("credits", [...credits, { title: "", role: "", type: "", year: "" }])}>
            <Icon name="plus" size={16} /> Add credit
          </Button>
        </div>
      )}
    </Section>
  );
}

function Contact({ p, t, priv, setProfile, setTalent, setPrivate }) {
  return (
    <>
      <Section title="Availability">
        <Toggle label="Available for work" hint="Shows a badge on your profile and in search." checked={!!t.available} onChange={(v) => setTalent("available", v)} />
        <Toggle label="Happy to travel" checked={!!t.will_travel} onChange={(v) => setTalent("will_travel", v)} />
        {!p.is_minor && (
          <Toggle
            label="Profile is public"
            hint="Turn off to hide your profile from search and from anyone who isn't signed in as you."
            checked={!!p.published}
            onChange={(v) => setProfile("published", v)}
          />
        )}
      </Section>
      <Section title="Contact" hint="Only approved casting directors can see these. Never shown publicly.">
        {p.is_minor ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Guardian name" value={priv.guardian_name || ""} onChange={(e) => setPrivate("guardian_name", e.target.value)} />
            <Input label="Guardian phone" type="tel" dir="ltr" value={priv.guardian_phone || ""} onChange={(e) => setPrivate("guardian_phone", e.target.value)} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" type="tel" dir="ltr" value={priv.phone || ""} onChange={(e) => setPrivate("phone", e.target.value)} />
            <Input label="WhatsApp" type="tel" dir="ltr" value={priv.whatsapp || ""} onChange={(e) => setPrivate("whatsapp", e.target.value)} hint="Leave empty if same as phone" />
            <Input label="Contact email" type="email" dir="ltr" value={priv.contact_email || ""} onChange={(e) => setPrivate("contact_email", e.target.value)} />
          </div>
        )}
        <Input label="Instagram" placeholder="@yourhandle" dir="ltr" value={t.instagram || ""} onChange={(e) => setTalent("instagram", e.target.value)} />
      </Section>
      {p.is_minor && (
        <Notice tone="accent">
          This is an under-18 profile. Only approved casting directors can see it, and they contact your guardian, not you.
        </Notice>
      )}
    </>
  );
}
