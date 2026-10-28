import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { BUCKET } from "../lib/media.js";
import { opt, tr } from "../lib/i18n.jsx";
import { Avatar, Badge, Button, Card, Empty, Input, Label, Notice, Spinner, Toggle, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";

const FREE_STORAGE_BYTES = 1024 ** 3; // Supabase free plan

const VIEWS = [
  ["all", "All"],
  ["talent", "Talent"],
  ["review", "Directors to review"],
  ["director", "Directors"],
  ["guardian", "Parents"],
  ["minors", "Under 18"],
  ["managed", "Managed"],
  ["hidden", "Hidden"],
  ["seed", "Test profiles"],
];

function inView(r, view) {
  switch (view) {
    case "talent":
      return r.role === "talent";
    case "review":
      return r.role === "director" && r.director_status === "pending";
    case "director":
      return r.role === "director";
    case "guardian":
      return r.role === "guardian";
    case "minors":
      return r.is_minor;
    case "managed":
      return r.managed;
    case "hidden":
      return !r.published;
    case "seed":
      return r.seed;
    default:
      return true;
  }
}

function when(ts) {
  if (!ts) return "–";
  const d = new Date(ts);
  const days = Math.floor((Date.now() - d) / 864e5);
  if (days === 0) return tr("Today");
  if (days === 1) return tr("Yesterday");
  if (days < 30) return tr("{n} days ago", { n: days });
  return d.toLocaleDateString();
}

function mb(bytes) {
  return `${(bytes / 1024 ** 2).toFixed(bytes > 100 * 1024 ** 2 ? 0 : 1)} MB`;
}

async function callApi(body) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/on", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export function Admin() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("created");
  const [creating, setCreating] = useState(false);
  const [handover, setHandover] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const { data, error: err } = await supabase.rpc("on_admin_profiles");
    if (err) return setError(tr(err.message));
    setRows(data || []);
  };
  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    if (!rows) return null;
    const week = Date.now() - 7 * 864e5;
    return {
      talent: rows.filter((r) => r.role === "talent").length,
      directors: rows.filter((r) => r.role === "director").length,
      review: rows.filter((r) => r.role === "director" && r.director_status === "pending").length,
      guardians: rows.filter((r) => r.role === "guardian").length,
      minorsWaiting: rows.filter((r) => r.is_minor && !r.guardian_approved_at).length,
      newThisWeek: rows.filter((r) => new Date(r.created_at) > week).length,
      bytes: rows.reduce((s, r) => s + Number(r.media_bytes || 0), 0),
    };
  }, [rows]);

  const shown = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    const list = rows.filter(
      (r) => inView(r, view) && (!term || [r.display_name, r.handle, r.email, r.city, r.company].some((v) => (v || "").toLowerCase().includes(term)))
    );
    const key = { created: "created_at", updated: "updated_at", signin: "last_sign_in_at" }[sort];
    return [...list].sort((a, b) => new Date(b[key] || 0) - new Date(a[key] || 0));
  }, [rows, view, q, sort]);

  const act = async (id, fn) => {
    setBusy(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(tr(e.message));
    }
    setBusy(null);
  };

  const setPublished = (r, published) =>
    act(r.id, async () => {
      const { error: err } = await supabase.from("on_profiles").update({ published }).eq("id", r.id);
      if (err) throw err;
    });
  const setVerified = (r, v) =>
    act(r.id, async () => {
      const { error: err } = await supabase.rpc("on_admin_set_verified", { pid: r.id, v });
      if (err) throw err;
    });
  const setDirector = (r, status) =>
    act(r.id, async () => {
      const { error: err } = await supabase.rpc("on_admin_set_director", { pid: r.id, status });
      if (err) throw err;
    });
  const remove = (r) => {
    const typed = prompt(tr("This deletes @{handle}'s profile, photos and past work. Type the handle to confirm.", { handle: r.handle }));
    if (typed?.trim().toLowerCase() !== r.handle) return;
    act(r.id, async () => {
      const { data: files } = await supabase.storage.from(BUCKET).list(r.id, { limit: 100 });
      if (files?.length) await supabase.storage.from(BUCKET).remove(files.map((f) => `${r.id}/${f.name}`));
      const { error: err } = await supabase.from("on_profiles").delete().eq("id", r.id);
      if (err) throw err;
    });
  };

  if (!rows && !error) return <Spinner />;

  return (
    <Page>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>ON</Label>
          <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Admin")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {rows?.some((r) => r.seed) && (
            <Button
              variant="secondary"
              onClick={async () => {
                const n = rows.filter((r) => r.seed).length;
                if (!confirm(tr("Delete all {n} test profiles, their photos and their logins? This can't be undone.", { n }))) return;
                setError("");
                try {
                  await callApi({ action: "admin-delete-seed" });
                  await load();
                } catch (e) {
                  setError(tr(e.message));
                }
              }}
            >
              <Icon name="trash" size={16} /> {tr("Delete all test profiles")}
            </Button>
          )}
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> {tr("New managed profile")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Stat label="Talent" value={stats.talent} onClick={() => setView("talent")} />
          <Stat label="Directors" value={stats.directors} note={stats.review ? tr("{n} to review", { n: stats.review }) : null} accent={stats.review > 0} onClick={() => setView(stats.review ? "review" : "director")} />
          <Stat label="Parents" value={stats.guardians} onClick={() => setView("guardian")} />
          <Stat label="Under 18" value={rows.filter((r) => r.is_minor).length} note={stats.minorsWaiting ? tr("{n} waiting for a parent", { n: stats.minorsWaiting }) : null} onClick={() => setView("minors")} />
          <Stat label="New this week" value={stats.newThisWeek} />
          <Card className="p-4">
            <Label>{tr("Storage")}</Label>
            <div className="mt-1 font-display text-h2 font-bold text-text-primary" dir="ltr">{mb(stats.bytes)}</div>
            <div className="mt-2 h-1 overflow-hidden rounded-pill bg-beige-300">
              <div className="h-full rounded-pill bg-accent" style={{ width: `${Math.min(100, (stats.bytes / FREE_STORAGE_BYTES) * 100)}%` }} />
            </div>
            <div className="mt-1 font-body text-micro text-text-secondary">{tr("of 1 GB on the free plan")}</div>
          </Card>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {VIEWS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`rounded-pill border px-3 py-1 font-body text-small font-medium transition-colors duration-150 ${
              view === key ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle bg-surface-card text-text-primary hover:border-green-950"
            }`}
          >
            {tr(label)} <span className="font-mono text-micro opacity-70">{rows?.filter((r) => inView(r, key)).length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-pill border border-border-subtle bg-surface-card px-4">
          <Icon name="search" size={18} className="text-text-secondary" />
          <input
            className="w-full bg-transparent py-2 font-body text-small text-text-primary outline-none placeholder:text-beige-700"
            placeholder={tr("Search name, handle, email, city or company")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label={tr("Sort")}
          className="rounded-pill border border-border-subtle bg-surface-card px-4 font-body text-small text-text-primary"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="created">{tr("Newest")}</option>
          <option value="updated">{tr("Recently updated")}</option>
          <option value="signin">{tr("Last signed in")}</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <Empty title="Nothing here" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-card">
          {shown.map((r) => (
            <Row
              key={r.id}
              r={r}
              busy={busy === r.id}
              onPublish={setPublished}
              onVerify={setVerified}
              onDirector={setDirector}
              onHandover={setHandover}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={load} />}
      {handover && <HandoverDialog r={handover} onClose={() => setHandover(null)} onDone={load} />}
    </Page>
  );
}

function Stat({ label, value, note, accent, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-lg border p-4 text-start transition-colors duration-150 ${accent ? "border-mint-500 bg-mint-100" : "border-border-subtle bg-surface-card"} ${onClick ? "hover:border-green-950" : ""}`}
    >
      <Label>{tr(label)}</Label>
      <div className="mt-1 font-display text-h1 font-bold leading-tight text-text-primary">{value}</div>
      {note && <div className="font-body text-micro font-medium text-text-primary">{note}</div>}
    </Tag>
  );
}

function Row({ r, busy, onPublish, onVerify, onDirector, onHandover, onDelete }) {
  const roleName = { talent: "Talent", director: "Casting director", guardian: "Parent or guardian" }[r.role];
  return (
    <div className={`flex flex-wrap items-center gap-4 border-b border-border-subtle p-4 last:border-b-0 ${busy ? "opacity-50" : ""}`}>
      <Avatar profile={r} size={48} />
      <div className="min-w-[220px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/${r.handle}`} className="font-body text-body font-semibold text-text-primary hover:underline">
            <bdi>{r.display_name}</bdi>
          </Link>
          {r.verified && <Verified size={14} />}
          <Badge tone="outline">{tr(roleName)}</Badge>
          {r.is_admin && <Badge tone="inverse">{tr("Admin")}</Badge>}
          {r.managed && <Badge>{tr("Managed")}</Badge>}
          {r.seed && <Badge tone="accent">{tr("Test profile")}</Badge>}
          {!r.published && <Badge>{tr("Hidden")}</Badge>}
          {r.role === "director" && <Badge tone={r.director_status === "approved" ? "accent" : "neutral"}>{tr(r.director_status)}</Badge>}
          {r.is_minor && <Badge tone="inverse">{r.guardian_approved_at ? tr("Under 18 · confirmed") : tr("Under 18 · waiting for a parent")}</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-micro text-text-secondary">
          <bdi dir="ltr">@{r.handle}</bdi>
          <bdi dir="ltr">{r.email}</bdi>
          {r.city && <span>{opt(r.city)}</span>}
          {r.company && <bdi>{r.company}</bdi>}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-body text-micro text-text-secondary">
          <span>{tr("{n} photos", { n: r.photos })}</span>
          <span>{tr("{n} videos", { n: r.videos })}</span>
          <span>{tr("{n} past work", { n: r.work_count })}</span>
          <span dir="ltr">{mb(Number(r.media_bytes))}</span>
          <span>{tr("Joined {when}", { when: when(r.created_at) })}</span>
          <span>{tr("Last sign-in {when}", { when: when(r.last_sign_in_at) })}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" to={`/${r.handle}`}>
          {tr("View")}
        </Button>
        <Button size="sm" variant="secondary" to={`/edit/${r.id}`}>
          <Icon name="edit" size={14} /> {tr("Edit")}
        </Button>
        {r.role === "director" && r.director_status !== "approved" && (
          <Button size="sm" onClick={() => onDirector(r, "approved")}>
            {tr("Approve")}
          </Button>
        )}
        {r.role === "director" && r.director_status !== "rejected" && !r.is_admin && (
          <Button size="sm" variant="ghost" onClick={() => onDirector(r, "rejected")}>
            {tr(r.director_status === "approved" ? "Revoke" : "Reject")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onVerify(r, !r.verified)}>
          {tr(r.verified ? "Unverify" : "Verify")}
        </Button>
        {(!r.is_minor || r.guardian_approved_at) && (
          <Button size="sm" variant="ghost" onClick={() => onPublish(r, !r.published)}>
            {tr(r.published ? "Hide" : "Make public")}
          </Button>
        )}
        {r.managed && (
          <Button size="sm" variant="ghost" onClick={() => onHandover(r)}>
            {tr("Hand over")}
          </Button>
        )}
        {!r.is_admin && (
          <button type="button" title={tr("Delete")} aria-label={tr("Delete")} onClick={() => onDelete(r)} className="rounded-sm p-2 text-text-secondary hover:bg-beige-100 hover:text-text-primary">
            <Icon name="trash" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function Dialog({ title, onClose, children }) {
  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-lg bg-surface-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="m-0 font-display text-h3 font-semibold text-text-primary">{tr(title)}</h2>
          <button type="button" aria-label={tr("Close")} onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateDialog({ onClose, onCreated }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [published, setPublished] = useState(true);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { id } = await callApi({ action: "admin-create-talent", name, handle, email: email || undefined, published });
      await onCreated();
      navigate(`/edit/${id}`);
    } catch (err) {
      setError(tr(err.message));
      setBusy(false);
    }
  };

  return (
    <Dialog title="New managed profile" onClose={onClose}>
      <p className="mb-4 mt-0 font-body text-small text-text-secondary">
        {tr("For talent who haven't signed up yet, like an agency roster. You build the profile; hand it over later with a sign-in link.")}
      </p>
      <form onSubmit={submit} className="grid gap-4">
        <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Handle"
          required
          dir="ltr"
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
          hint={`on.aboustate.tech/${handle || "handle"}`}
        />
        <Input label="Their email (optional)" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} hint="Leave empty to use a studio address until hand-over." />
        <Toggle label="Public right away" checked={published} onChange={setPublished} />
        <Toggle label="They are 18 or over and agreed to be on ON" checked={adult} onChange={setAdult} />
        {error && <Notice>{error}</Notice>}
        <Button type="submit" disabled={busy || !adult || !name || handle.length < 3} className="w-full">
          {busy ? tr("Creating") : tr("Create and edit profile")}
        </Button>
      </form>
    </Dialog>
  );
}

function HandoverDialog({ r, onClose, onDone }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const out = await callApi({ action: "admin-handover", profileId: r.id, email });
      setLink(out.link);
      onDone();
    } catch (err) {
      setError(tr(err.message));
    }
    setBusy(false);
  };

  const message = tr("Your ON profile is ready: {link}", { link });

  return (
    <Dialog title="Hand over profile" onClose={onClose}>
      {!link ? (
        <form onSubmit={submit} className="grid gap-4">
          <p className="m-0 font-body text-small text-text-secondary">
            {tr("{name}'s login moves to their own email, and you get a one-time sign-in link to send them. After that the profile is theirs.", { name: r.display_name })}
          </p>
          <Input label="Their email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <Notice>{error}</Notice>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? tr("Working") : tr("Create sign-in link")}
          </Button>
        </form>
      ) : (
        <div className="grid gap-4">
          <Notice tone="accent">{tr("Done. Send this link to {name}. It works once; after signing in they can set a password in Settings.", { name: r.display_name })}</Notice>
          <input readOnly dir="ltr" value={link} className="w-full rounded-sm border border-border-subtle bg-beige-100 px-3 py-2 font-mono text-micro text-text-primary" onFocus={(e) => e.target.select()} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              }}
            >
              <Icon name="share" size={14} /> {copied ? tr("Copied") : tr("Copy link")}
            </Button>
            <Button size="sm" variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener">
              {tr("Send on WhatsApp")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
