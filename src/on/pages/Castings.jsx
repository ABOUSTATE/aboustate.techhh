import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { fit, rankForRole } from "../lib/match.js";
import { opt, tr } from "../lib/i18n.jsx";
import { TALENT_SELECT, TYPE_LABEL, deadlineText, daysLeft, loadTalents, traitText, withTalent } from "../lib/castings.js";
import { Avatar, Badge, Button, Card, Empty, Input, Label, Notice, Spinner, Textarea, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";
import { TapePlayer } from "../components/TapePlayer.jsx";

const CALL_SELECT = "id, title, project, company, city, pay, deadline, traits, needs_tape, status, owner, created_at";

// The talent profiles a signed-in person acts for: themselves, or the
// children a guardian looks after.
function useActors() {
  const { profile } = useAuth();
  const [actors, setActors] = useState(null);
  useEffect(() => {
    if (!profile) return setActors([]);
    const q = supabase.from("on_profiles").select(`${TALENT_SELECT}, role, published`);
    (profile.role === "guardian" ? q.eq("guardian_id", profile.id) : q.eq("id", profile.id)).then(({ data }) =>
      setActors(withTalent(data).filter((p) => p.role !== "director"))
    );
  }, [profile]);
  return actors;
}

function canDirect(profile) {
  return isApprovedDirector(profile) || profile?.is_admin;
}

// ---------------------------------------------------------------------
// /calls: open calls, self-tape requests, applications
// ---------------------------------------------------------------------
export function Castings() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const director = canDirect(profile);
  const tabs = director ? [["mine", "My open calls"], ["open", "All open calls"]] : [["open", "Open calls"], ["requests", "Self-tape requests"], ["applied", "Applied"]];
  const tab = tabs.some(([k]) => k === params.get("tab")) ? params.get("tab") : tabs[0][0];

  return (
    <Page>
      <div className="mb-5">
        <Label>{tr("Castings")}</Label>
        <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">{tr(director ? "Open calls" : "Your castings")}</h1>
        <p className="mb-0 mt-2 max-w-[60ch] font-body text-body text-text-secondary">
          {tr(director ? "Post a role from any brief board. Talent who fit see it first, and you get applicants already sorted by fit." : "Roles you can apply for, sorted by how well they fit you, and the self-tapes casting directors asked you for.")}
        </p>
      </div>
      <div className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border-subtle [scrollbar-width:none]">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setParams({ tab: key }, { replace: true })}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 font-body text-small font-semibold transition-colors duration-150 ${
              tab === key ? "border-green-950 text-text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tr(label)}
          </button>
        ))}
      </div>
      {tab === "mine" && <MyCalls />}
      {tab === "open" && <OpenCalls />}
      {tab === "requests" && <Requests />}
      {tab === "applied" && <Applied />}
    </Page>
  );
}

function OpenCalls() {
  const actors = useActors();
  const [calls, setCalls] = useState(null);
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    supabase
      .from("on_calls")
      .select(CALL_SELECT)
      .eq("status", "open")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setCalls(data || []));
  }, []);
  if (!calls || !actors) return <Spinner />;
  if (!calls.length) return <Empty title="No open calls right now" body="New roles show up here as casting directors post them. Keep your profile complete so you're ready." />;

  // Best fit for whoever this person applies as.
  const scored = calls
    .map((c) => ({ c, pct: Math.max(0, ...actors.map((a) => rankForRole([a], c)[0]?.pct || 0)) }))
    .sort((a, b) => b.pct - a.pct || new Date(b.c.created_at) - new Date(a.c.created_at));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {scored.map(({ c, pct }) => (
        <CallCard key={c.id} call={c} pct={actors.length ? pct : null} />
      ))}
    </div>
  );
}

function CallCard({ call, pct, right }) {
  const left = daysLeft(call.deadline);
  return (
    <Link to={`/calls/${call.id}`} className="block rounded-lg border border-border-subtle bg-surface-card p-4 transition-colors duration-150 hover:border-green-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-display text-h3 font-bold text-text-primary">
            <bdi>{call.title}</bdi>
          </div>
          <div className="truncate font-body text-small text-text-secondary">
            <Parts items={[call.project, call.company]} />
          </div>
        </div>
        {pct != null && pct > 0 && <Badge tone={pct >= 75 ? "accent" : "neutral"}>{tr("Fits you {n}%", { n: pct })}</Badge>}
        {right}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {(call.traits || []).slice(0, 6).map((t, i) => (
          <span key={i} className="rounded-pill border border-border-subtle px-2 py-1 font-body text-micro text-text-primary">
            {traitText(t)}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 font-body text-micro text-text-secondary">
        {call.city && (
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" size={14} /> {opt(call.city)}
          </span>
        )}
        {call.pay && <bdi>{call.pay}</bdi>}
        {call.needs_tape && <span>{tr("Self-tape needed")}</span>}
        <span className={left !== null && left <= 2 ? "font-semibold text-text-primary" : ""}>{call.status === "closed" ? tr("Closed") : deadlineText(call.deadline)}</span>
      </div>
    </Link>
  );
}

function MyCalls() {
  const { profile } = useAuth();
  const [calls, setCalls] = useState(null);
  useEffect(() => {
    supabase
      .from("on_calls")
      .select(`${CALL_SELECT}, on_applications(count)`)
      .eq("owner", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCalls(data || []));
  }, [profile.id]);
  if (!calls) return <Spinner />;
  if (!calls.length) {
    return <Empty title="No open calls yet" body="Open a brief board and press “Post as open call” under any role." action={<Button to="/boards">{tr("Brief boards")}</Button>} />;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {calls.map((c) => {
        const n = c.on_applications?.[0]?.count || 0;
        return <CallCard key={c.id} call={c} right={<Badge tone={n ? "accent" : "outline"}>{n === 1 ? tr("1 applicant") : tr("{n} applicants", { n })}</Badge>} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Self-tape requests (talent and guardians)
// ---------------------------------------------------------------------
function Requests() {
  const { profile } = useAuth();
  const actors = useActors();
  const [rows, setRows] = useState(null);
  const load = useCallback(() => {
    supabase
      .from("on_requests")
      .select("id, talent, role_name, project, from_name, from_company, message, sides, deadline, status, tape_url, tape_note, submitted_at, created_at")
      .neq("director", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, [profile.id]);
  useEffect(load, [load]);
  if (!rows || !actors) return <Spinner />;
  if (!rows.length) return <Empty title="No self-tape requests yet" body="When a casting director wants to see you for a role, their request shows up here with the lines and the deadline." />;
  const names = Object.fromEntries(actors.map((a) => [a.id, a.display_name]));
  const waiting = rows.filter((r) => r.status === "sent");
  const done = rows.filter((r) => r.status !== "sent");
  return (
    <div className="grid gap-4">
      {waiting.map((r) => (
        <RequestCard key={r.id} r={r} forName={actors.length > 1 ? names[r.talent] : null} onDone={load} />
      ))}
      {done.length > 0 && (
        <>
          <h2 className="mb-0 mt-4 font-display text-h3 font-semibold text-text-primary">{tr("Answered")}</h2>
          {done.map((r) => (
            <RequestCard key={r.id} r={r} forName={actors.length > 1 ? names[r.talent] : null} onDone={load} />
          ))}
        </>
      )}
    </div>
  );
}

function RequestCard({ r, forName, onDone }) {
  const [url, setUrl] = useState(r.tape_url || "");
  const [note, setNote] = useState(r.tape_note || "");
  const [editing, setEditing] = useState(r.status === "sent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const late = daysLeft(r.deadline) !== null && daysLeft(r.deadline) < 0;

  const reply = async (decline) => {
    if (decline && !confirm(tr("Let them know you can't do this one?"))) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.rpc("on_request_reply", { rid: r.id, url: decline ? null : url.trim(), note: note.trim() || null, decline });
    setBusy(false);
    if (err) return setError(tr(err.message));
    setEditing(false);
    onDone();
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Label>{tr("Self-tape request")}</Label>
          <div className="mt-1 font-display text-h3 font-bold text-text-primary">
            <bdi>{r.role_name}</bdi>
          </div>
          <div className="font-body text-small text-text-secondary">
            <Parts items={[r.project, r.from_company || r.from_name]} />
            {forName && (
              <>
                {" · "}
                {tr("for {name}", { name: forName })}
              </>
            )}
          </div>
        </div>
        <Badge tone={r.status === "submitted" ? "accent" : r.status === "declined" ? "outline" : late ? "inverse" : "neutral"}>
          {r.status === "submitted" ? tr("Sent") : r.status === "declined" ? tr("Declined") : deadlineText(r.deadline)}
        </Badge>
      </div>
      {r.message && (
        <p dir="auto" className="mb-0 mt-3 whitespace-pre-wrap font-body text-body text-text-primary">
          {r.message}
        </p>
      )}
      {r.sides && (
        <details className="mt-3 rounded-md bg-beige-100 p-3">
          <summary className="cursor-pointer font-body text-small font-semibold text-text-primary">{tr("Lines to read")}</summary>
          <pre dir="auto" className="mb-0 mt-2 whitespace-pre-wrap font-body text-small text-text-primary">
            {r.sides}
          </pre>
        </details>
      )}
      {editing ? (
        <div className="mt-4 grid gap-3">
          <Input label="Link to your tape" dir="ltr" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/..." hint="Upload to YouTube as Unlisted, or Google Drive with “Anyone with the link”, then paste the link." />
          <Textarea label="Note (optional)" dir="auto" value={note} onChange={(e) => setNote(e.target.value)} className="[&_textarea]:min-h-[70px]" />
          {error && <Notice>{error}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => reply(false)} disabled={busy || !/^https?:\/\//.test(url.trim())}>
              <Icon name="check" size={16} /> {tr("Send tape")}
            </Button>
            {r.status === "sent" && (
              <Button variant="ghost" onClick={() => reply(true)} disabled={busy}>
                {tr("I can't do this one")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        r.status === "submitted" && (
          <div className="mt-4 flex flex-wrap items-center gap-3 font-body text-small text-text-secondary">
            <a href={r.tape_url} target="_blank" rel="noopener noreferrer" className="truncate text-text-primary underline" dir="ltr">
              {r.tape_url}
            </a>
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              {tr("Change link")}
            </Button>
          </div>
        )
      )}
    </Card>
  );
}

function Applied() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    supabase
      .from("on_applications")
      .select(`id, status, created_at, on_calls(${CALL_SELECT})`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data || []).filter((a) => a.on_calls)));
  }, []);
  if (!rows) return <Spinner />;
  if (!rows.length) return <Empty title="You haven't applied yet" body="Open calls that fit you are on the first tab." />;
  const label = { applied: "Applied", shortlisted: "Shortlisted", passed: "Not this time" };
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((a) => (
        <CallCard key={a.id} call={a.on_calls} right={<Badge tone={a.status === "shortlisted" ? "accent" : "outline"}>{tr(label[a.status])}</Badge>} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// /calls/:id
// ---------------------------------------------------------------------
export function CallPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [call, setCall] = useState(null);
  useEffect(() => {
    supabase
      .from("on_calls")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setCall(data || false));
  }, [id]);
  if (call === null) return <Spinner />;
  if (call === false) {
    return (
      <Page narrow>
        <Empty title="This open call isn't available" body="It may have closed, or the deadline passed." action={<Button to="/calls">{tr("Open calls")}</Button>} />
      </Page>
    );
  }
  const owner = profile && (call.owner === profile.id || profile.is_admin);
  const left = daysLeft(call.deadline);
  const open = call.status === "open" && (left === null || left >= 0);

  return (
    <Page>
      <Link to="/calls" className="inline-flex items-center gap-1 font-body text-small text-text-secondary hover:text-text-primary">
        <Icon name="back" size={14} /> {tr("Open calls")}
      </Link>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <Label>{tr("Open call")}</Label>
          <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">
            <bdi>{call.title}</bdi>
          </h1>
          <div className="mt-1 font-body text-body text-text-secondary">
            <Parts items={[call.project, call.company]} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={open ? "accent" : "outline"}>{open ? deadlineText(call.deadline) : tr("Closed")}</Badge>
            {call.city && <Badge>{opt(call.city)}</Badge>}
            {call.needs_tape && <Badge tone="inverse">{tr("Self-tape needed")}</Badge>}
          </div>
          {call.description && (
            <p dir="auto" className="mb-0 mt-5 max-w-[66ch] whitespace-pre-wrap font-body text-body leading-body text-text-primary">
              {call.description}
            </p>
          )}
          <dl className="m-0 mt-5 grid max-w-[520px] grid-cols-2 gap-x-4 gap-y-3">
            {call.pay && <Fact k="Pay" v={call.pay} />}
            {call.shoot_dates && <Fact k="Shoot dates" v={call.shoot_dates} />}
          </dl>
          {(call.traits || []).length > 0 && (
            <div className="mt-5">
              <Label>{tr("What the role needs")}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {call.traits.map((t, i) => (
                  <span key={i} className="rounded-pill border border-border-subtle bg-beige-100 px-3 py-1 font-body text-small text-text-primary">
                    <span className="text-text-secondary">{tr(TYPE_LABEL[t.type])}: </span>
                    {traitText(t)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {owner && <Applicants call={call} onCall={setCall} />}
        </div>
        <aside>{owner ? <OwnerPanel call={call} onCall={setCall} /> : <ApplyPanel call={call} open={open} />}</aside>
      </div>
    </Page>
  );
}

function Fact({ k, v }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-mono text-text-secondary">{tr(k)}</dt>
      <dd className="m-0 font-body text-small font-semibold text-text-primary">
        <bdi>{v}</bdi>
      </dd>
    </div>
  );
}

function ApplyPanel({ call, open }) {
  const { profile } = useAuth();
  const actors = useActors();
  const [apps, setApps] = useState(null);
  const [who, setWho] = useState("");
  const [note, setNote] = useState("");
  const [tape, setTape] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!profile) return setApps([]);
    supabase
      .from("on_applications")
      .select("id, talent, status")
      .eq("call_id", call.id)
      .then(({ data }) => setApps(data || []));
  }, [call.id, profile]);
  useEffect(load, [load]);

  if (!profile) {
    return (
      <Card className="grid gap-3 p-5">
        <p className="m-0 font-display text-h3 font-semibold text-text-primary">{tr("Want this role?")}</p>
        <p className="m-0 font-body text-small text-text-secondary">{tr("Make a free ON profile to apply. It takes a few minutes.")}</p>
        <Button to="/join?as=talent">{tr("Join ON to apply")}</Button>
        <Button to="/login" variant="secondary">
          {tr("Log in")}
        </Button>
      </Card>
    );
  }
  if (!actors || !apps) return <Spinner />;
  if (!actors.length) return <Notice>{tr("Only talent profiles can apply to open calls.")}</Notice>;

  const target = actors.find((a) => a.id === who) || actors[0];
  const mine = apps.find((a) => a.talent === target.id);
  const hits = (call.traits || []).map((t) => ({ t, f: fit(target, t) }));
  const pct = rankForRole([target], call)[0]?.pct || 0;

  const apply = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.from("on_applications").insert({ call_id: call.id, talent: target.id, note: note.trim() || null, tape_url: tape.trim() || null });
    setBusy(false);
    if (err) return setError(tr(/published/.test(err.message) || /row-level/.test(err.message) ? "Your profile needs to be public to apply." : err.message));
    load();
  };

  return (
    <Card className="grid gap-4 p-5">
      {actors.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="font-body text-micro font-medium text-text-secondary">{tr("Applying for")}</span>
          <select className="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small" value={target.id} onChange={(e) => setWho(e.target.value)}>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.display_name}
              </option>
            ))}
          </select>
        </label>
      )}
      {hits.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between">
            <Label>{tr("How you fit")}</Label>
            <span className="font-display text-h3 font-bold text-text-primary" dir="ltr">
              {pct}%
            </span>
          </div>
          <ul className="m-0 mt-2 grid list-none gap-1 p-0">
            {hits.map(({ t, f }, i) => (
              <li key={i} className="flex items-center gap-2 font-body text-small text-text-primary">
                <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-pill ${f === "exact" ? "bg-accent" : f ? "bg-mint-300" : "bg-beige-300"}`}>
                  <Icon name={f ? "check" : "close"} size={12} />
                </span>
                {tr(TYPE_LABEL[t.type])}: {traitText(t)}
                {f === "similar" && <span className="text-text-secondary">({tr("close")})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mine ? (
        <div className="grid gap-3">
          <Notice tone="accent">
            {mine.status === "shortlisted" ? tr("You're shortlisted. The casting director will be in touch.") : mine.status === "passed" ? tr("They went another way on this one. Keep applying.") : tr("Applied. The casting director sees your profile, photos and past work.")}
          </Notice>
          {mine.status === "applied" && (
            <Button
              variant="ghost"
              onClick={async () => {
                if (!confirm(tr("Withdraw your application?"))) return;
                await supabase.from("on_applications").delete().eq("id", mine.id);
                load();
              }}
            >
              {tr("Withdraw")}
            </Button>
          )}
        </div>
      ) : open ? (
        <div className="grid gap-3">
          <Textarea label="Note to the casting director (optional)" dir="auto" value={note} onChange={(e) => setNote(e.target.value)} className="[&_textarea]:min-h-[80px]" />
          {call.needs_tape && (
            <Input label="Link to your self-tape" dir="ltr" type="url" value={tape} onChange={(e) => setTape(e.target.value)} placeholder="https://youtu.be/..." hint="YouTube Unlisted or Google Drive with “Anyone with the link”." />
          )}
          {!target.published && <Notice>{tr("Your profile needs to be public to apply.")}</Notice>}
          {error && <Notice>{error}</Notice>}
          <Button onClick={apply} disabled={busy || (call.needs_tape && !/^https?:\/\//.test(tape.trim()))}>
            {busy ? tr("Applying") : tr("Apply")}
          </Button>
          <p className="m-0 font-body text-micro text-text-secondary">{tr("ON is free for talent. Never pay anyone to be cast.")}</p>
        </div>
      ) : (
        <Notice>{tr("This call is closed.")}</Notice>
      )}
    </Card>
  );
}

function OwnerPanel({ call, onCall }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/calls/${call.id}`;
  const set = async (patch) => {
    const { data } = await supabase.from("on_calls").update(patch).eq("id", call.id).select("*").single();
    if (data) onCall(data);
  };
  return (
    <Card className="grid gap-3 p-5">
      <Label>{tr("Your open call")}</Label>
      <p className="m-0 font-body text-small text-text-secondary">{tr("Anyone with the link can read it; only talent can apply. Share it on WhatsApp or Instagram for more applicants.")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          <Icon name="share" size={14} /> {copied ? tr("Copied") : tr("Copy link")}
        </Button>
        <Button size="sm" variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(`${call.title}\n${url}`)}`} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-3">
        <Button size="sm" variant="secondary" onClick={() => set({ status: call.status === "open" ? "closed" : "open" })}>
          {tr(call.status === "open" ? "Close the call" : "Reopen the call")}
        </Button>
        {call.board_id && (
          <Button size="sm" variant="ghost" to={`/boards/${call.board_id}`}>
            {tr("Open the board")}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            if (!confirm(tr("Delete this open call and its applications?"))) return;
            await supabase.from("on_calls").delete().eq("id", call.id);
            navigate("/calls");
          }}
        >
          <Icon name="trash" size={14} />
        </Button>
      </div>
    </Card>
  );
}

function Applicants({ call }) {
  const [apps, setApps] = useState(null);
  const [talents, setTalents] = useState([]);
  const [board, setBoard] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const { data } = await supabase.from("on_applications").select("*").eq("call_id", call.id).order("created_at");
    setApps(data || []);
    setTalents(await loadTalents((data || []).map((a) => a.talent)));
  }, [call.id]);
  useEffect(() => {
    load();
    if (call.board_id) supabase.from("on_boards").select("id, roles").eq("id", call.board_id).maybeSingle().then(({ data }) => setBoard(data));
  }, [load, call.board_id]);

  const ranked = useMemo(() => {
    const byId = Object.fromEntries(talents.map((p) => [p.id, p]));
    return (apps || [])
      .filter((a) => byId[a.talent])
      .map((a) => ({ a, p: byId[a.talent], pct: call.traits?.length ? rankForRole([byId[a.talent]], call)[0]?.pct || 0 : null }))
      .sort((x, y) => (y.pct || 0) - (x.pct || 0));
  }, [apps, talents, call]);

  if (!apps) return <Spinner />;
  const role = board?.roles?.find((r) => r.id === call.role_id);
  const picked = (pid) => role?.picks?.includes(pid);
  const togglePick = async (pid) => {
    const roles = board.roles.map((r) => (r.id === call.role_id ? { ...r, picks: picked(pid) ? r.picks.filter((x) => x !== pid) : [...(r.picks || []), pid] } : r));
    setBoard({ ...board, roles });
    await supabase.from("on_boards").update({ roles }).eq("id", board.id);
  };
  const setStatus = async (a, status) => {
    setApps((list) => list.map((x) => (x.id === a.id ? { ...x, status } : x)));
    await supabase.from("on_applications").update({ status }).eq("id", a.id);
  };
  const shown = ranked.filter(({ a }) => filter === "all" || a.status === filter);

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="m-0 font-display text-h2 font-bold tracking-tight text-text-primary">
          {ranked.length === 1 ? tr("1 applicant") : tr("{n} applicants", { n: ranked.length })}
        </h2>
        <div className="flex gap-1">
          {[
            ["all", "All"],
            ["applied", "New"],
            ["shortlisted", "Shortlisted"],
            ["passed", "Passed"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              aria-pressed={filter === k}
              className={`rounded-pill border px-3 py-1 font-body text-micro ${filter === k ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle text-text-primary"}`}
            >
              {tr(label)}
            </button>
          ))}
        </div>
      </div>
      {ranked.length === 0 ? (
        <Empty title="No applicants yet" body="Share the call's link to reach more talent." />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {shown.map(({ a, p, pct }) => (
            <li key={a.id}>
              <Card className="flex flex-wrap items-start gap-3 p-4">
                <Avatar profile={p} size={56} />
                <div className="min-w-0 flex-1">
                  <a href={`/${p.handle}`} target="_blank" rel="noopener" className="flex items-center gap-1 font-body text-body font-semibold text-text-primary hover:underline">
                    <bdi>{p.display_name}</bdi>
                    {p.verified && <Verified size={14} />}
                    {p.is_minor && <Badge tone="inverse">{tr("Under 18")}</Badge>}
                    {p.seed && <Badge>{tr("Test profile")}</Badge>}
                  </a>
                  <div className="font-body text-micro text-text-secondary">
                    {[p.t?.playing_age_min && `${tr("Playing age")} ⁦${p.t.playing_age_min}–${p.t.playing_age_max}⁩`, p.t?.height_cm && tr("{n} cm", { n: p.t.height_cm }), opt(p.city)].filter(Boolean).join(" · ")}
                  </div>
                  {a.note && (
                    <p dir="auto" className="mb-0 mt-2 font-body text-small text-text-primary">
                      {a.note}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.tape_url && (
                      <Button size="sm" variant="dark" onClick={() => setPlaying({ url: a.tape_url, title: p.display_name })}>
                        <Icon name="play" size={12} fill /> {tr("Watch tape")}
                      </Button>
                    )}
                    <Button size="sm" variant={a.status === "shortlisted" ? "primary" : "secondary"} onClick={() => setStatus(a, a.status === "shortlisted" ? "applied" : "shortlisted")}>
                      {tr(a.status === "shortlisted" ? "Shortlisted" : "Shortlist")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(a, a.status === "passed" ? "applied" : "passed")}>
                      {tr(a.status === "passed" ? "Undo pass" : "Pass")}
                    </Button>
                    {role && (
                      <Button size="sm" variant="ghost" onClick={() => togglePick(p.id)}>
                        <Icon name={picked(p.id) ? "check" : "star"} size={14} /> {tr(picked(p.id) ? "On the board" : "Add to board picks")}
                      </Button>
                    )}
                  </div>
                </div>
                {pct != null && (
                  <span className="font-display text-h3 font-bold text-text-accent" dir="ltr">
                    {pct}%
                  </span>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
      {playing && <TapePlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
    </section>
  );
}

// Names in mixed languages, each kept in its own direction.
function Parts({ items }) {
  return items.filter(Boolean).map((x, i) => (
    <span key={i}>
      {i > 0 && " · "}
      <bdi>{x}</bdi>
    </span>
  ));
}
