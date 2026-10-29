import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { briefTitle, pdfToText, readBrief } from "../lib/brief.js";
import { matchesFor, rankForRole, TRAIT_TYPES } from "../lib/match.js";
import { ACCENTS, BUILDS, CATEGORIES, CITIES, EYES, GENDERS, HAIR, LANGUAGES, SKILLS } from "../lib/options.js";
import { opt, tr } from "../lib/i18n.jsx";
import { TALENT_SELECT, TYPE_LABEL, VERDICTS, traitText, withTalent } from "../lib/castings.js";
import { Avatar, Badge, Button, Card, Empty, Label, Notice, Spinner, Verified } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { Page } from "../components/Shell.jsx";
import { TapePlayer } from "../components/TapePlayer.jsx";
import { AskTapesDialog, PostCallDialog, ShareDialog } from "../components/BoardDialogs.jsx";

const TYPE_OPTIONS = {
  gender: GENDERS,
  build: BUILDS,
  hair: HAIR,
  eyes: EYES,
  categories: CATEGORIES,
  languages: LANGUAGES,
  accents: ACCENTS,
  skills: SKILLS,
  city: CITIES,
};

function canUseBoards(profile) {
  return isApprovedDirector(profile) || profile?.is_admin;
}

// ---------------------------------------------------------------------
// List + new board from a brief
// ---------------------------------------------------------------------
export function Boards() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState(null);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const input = useRef(null);

  useEffect(() => {
    supabase
      .from("on_boards")
      .select("id, title, brief_name, roles, updated_at")
      .eq("owner", profile.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setBoards(data || []));
  }, [profile.id]);

  if (!canUseBoards(profile)) {
    return (
      <Page narrow>
        <Notice tone="accent">{tr("Brief boards open once your casting director account is approved.")}</Notice>
      </Page>
    );
  }

  const openFile = async (file) => {
    if (!file) return;
    setError("");
    setFileName(file.name);
    setBusy("reading");
    try {
      const out = file.type === "application/pdf" || /\.pdf$/i.test(file.name) ? await pdfToText(file) : await file.text();
      if (!out.trim()) throw new Error(tr("No text found in this PDF. If it's a scan, paste the brief's text instead."));
      setText(out);
    } catch (e) {
      setError(e.message);
    }
    setBusy("");
  };

  const build = async () => {
    setBusy("building");
    setError("");
    const roles = readBrief(text);
    const { data, error: err } = await supabase
      .from("on_boards")
      .insert({ title: briefTitle(text, fileName.replace(/\.\w+$/, "")), brief_name: fileName || null, brief_text: text.slice(0, 60000), roles })
      .select("id")
      .single();
    setBusy("");
    if (err) return setError(tr(err.message));
    navigate(`/boards/${data.id}`);
  };

  return (
    <Page>
      <div className="mb-6">
        <Label>{tr("Casting tools")}</Label>
        <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Brief boards")}</h1>
        <p className="mb-0 mt-2 max-w-[60ch] font-body text-body text-text-secondary">
          {tr("Drop in a casting brief. ON reads the roles and what each one needs, then shows every talent who fits each trait, or comes close.")}
        </p>
      </div>

      <Card className="mb-8 grid gap-4 p-5">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            openFile(e.dataTransfer.files[0]);
          }}
          onClick={() => input.current.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle bg-beige-100 px-5 py-7 text-center transition-colors duration-150 hover:border-green-950"
        >
          <Icon name="film" size={28} className="text-text-secondary" />
          <span className="font-body text-body font-semibold text-text-primary">
            {busy === "reading" ? tr("Reading the brief") : fileName ? <bdi>{fileName}</bdi> : tr("Drop a brief PDF here, or click to choose one")}
          </span>
          <span className="font-body text-micro text-text-secondary">{tr("PDF or text file. Arabic and English both work. The file isn't uploaded; only its text is kept.")}</span>
          <input ref={input} type="file" accept="application/pdf,.pdf,text/plain,.txt" hidden onChange={(e) => openFile(e.target.files[0])} />
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-body text-micro font-medium text-text-secondary">{tr("Or paste the brief")}</span>
          <textarea
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px] w-full resize-y rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small leading-body text-text-primary outline-none focus:border-green-950"
            placeholder={tr("Role 1: Karim. Male, 20 to 26, tall, Cairene accent, can dance...")}
          />
        </label>
        {error && <Notice>{error}</Notice>}
        <div>
          <Button onClick={build} disabled={!text.trim() || !!busy}>
            {busy === "building" ? tr("Building") : tr("Build board")}
          </Button>
        </div>
      </Card>

      <h2 className="mb-3 mt-0 font-display text-h3 font-semibold text-text-primary">{tr("Your boards")}</h2>
      {!boards ? (
        <Spinner />
      ) : boards.length === 0 ? (
        <Empty title="No boards yet" body="Your first brief becomes your first board." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Link key={b.id} to={`/boards/${b.id}`} className="rounded-lg border border-border-subtle bg-surface-card p-4 transition-colors duration-150 hover:border-green-950">
              <div className="truncate font-body text-body font-semibold text-text-primary">
                <bdi>{b.title}</bdi>
              </div>
              <div className="mt-1 font-body text-micro text-text-secondary">
                {(b.roles?.length || 0) === 1 ? tr("1 role") : tr("{n} roles", { n: b.roles?.length || 0 })} · {new Date(b.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------
// One board
// ---------------------------------------------------------------------
export function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [talents, setTalents] = useState(null);
  const [saved, setSaved] = useState(true);
  const [showBrief, setShowBrief] = useState(false);
  const [extras, setExtras] = useState({ requests: [], shares: [], votes: [], calls: [] });
  const [dialog, setDialog] = useState(null);
  const [playing, setPlaying] = useState(null);
  const first = useRef(true);

  // Self-tape requests, client links (with their votes) and open calls
  // made from this board.
  const loadExtras = useCallback(async () => {
    const [{ data: requests }, { data: shares }, { data: calls }] = await Promise.all([
      supabase.rpc("on_board_requests", { bid: id }),
      supabase.from("on_shares").select("*").eq("board_id", id).order("created_at", { ascending: false }),
      supabase.from("on_calls").select("id, role_id, status").eq("board_id", id),
    ]);
    let votes = [];
    if (shares?.length) {
      const { data } = await supabase.from("on_share_votes").select("*").in("share_id", shares.map((x) => x.id));
      votes = data || [];
    }
    setExtras({ requests: requests || [], shares: shares || [], votes, calls: calls || [] });
  }, [id]);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  useEffect(() => {
    supabase
      .from("on_boards")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setBoard(data || false));
    supabase
      .from("on_profiles")
      .select(TALENT_SELECT)
      .eq("role", "talent")
      .eq("published", true)
      .limit(2000)
      .then(({ data }) => setTalents(withTalent(data)));
  }, [id]);

  // Save edits a moment after they stop.
  useEffect(() => {
    if (!board) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const t = setTimeout(async () => {
      await supabase.from("on_boards").update({ title: board.title, roles: board.roles }).eq("id", board.id);
      setSaved(true);
    }, 700);
    return () => clearTimeout(t);
  }, [board]);

  if (board === null || talents === null) return <Spinner />;
  if (board === false) {
    return (
      <Page narrow>
        <Empty title="This board isn't available" action={<Button to="/boards">{tr("Brief boards")}</Button>} />
      </Page>
    );
  }

  const setRoles = (fn) => setBoard((b) => ({ ...b, roles: fn(b.roles) }));
  // `patch` can be a function of the current role, so quick clicks in a
  // row don't overwrite each other.
  const setRole = (rid, patch) => setRoles((rs) => rs.map((r) => (r.id === rid ? { ...r, ...(typeof patch === "function" ? patch(r) : patch) } : r)));

  return (
    <Page className="!max-w-none">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link to="/boards" className="font-body text-small text-text-secondary hover:text-text-primary">
            ← {tr("Brief boards")}
          </Link>
          <input
            dir="auto"
            value={board.title}
            onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value.slice(0, 120) }))}
            className="mt-1 block w-full bg-transparent font-display text-h1 font-bold tracking-tight text-text-primary outline-none"
            aria-label={tr("Board title")}
          />
          <div className="mt-1 flex flex-wrap items-center gap-3 font-body text-micro text-text-secondary">
            <span>{board.roles.length === 1 ? tr("1 role") : tr("{n} roles", { n: board.roles.length })}</span>
            <span>{tr("{n} talents searched", { n: talents.length })}</span>
            <span>{saved ? tr("Saved") : tr("Saving")}</span>
            {board.brief_text && (
              <button type="button" onClick={() => setShowBrief((v) => !v)} className="underline">
                {tr(showBrief ? "Hide brief" : "Show brief")}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="dark" onClick={() => setDialog({ kind: "share" })}>
            <Icon name="share" size={16} /> {tr("Share with client")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setRoles((rs) => [...rs, { id: crypto.randomUUID(), name: tr("New role"), notes: "", traits: [], picks: [] }])}
          >
            <Icon name="plus" size={16} /> {tr("Add role")}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm(tr("Delete this board?"))) return;
              await supabase.from("on_boards").delete().eq("id", board.id);
              navigate("/boards");
            }}
          >
            <Icon name="trash" size={16} />
          </Button>
        </div>
      </div>

      {showBrief && (
        <Card className="mb-5 max-h-[320px] overflow-auto p-4">
          <pre dir="auto" className="m-0 whitespace-pre-wrap font-body text-small text-text-primary">
            {board.brief_text}
          </pre>
        </Card>
      )}

      {talents.length === 0 && (
        <div className="mb-5">
          <Notice>{tr("There's no public talent to match yet. The board fills in as profiles join.")}</Notice>
        </div>
      )}

      <div className="flex snap-x gap-4 overflow-x-auto pb-6">
        {board.roles.map((role) => (
          <RoleColumn
            key={role.id}
            role={role}
            talents={talents}
            requests={extras.requests.filter((r) => r.role_id === role.id)}
            votes={extras.votes.filter((v) => v.role_id === role.id)}
            call={extras.calls.find((c) => c.role_id === role.id)}
            onAskTapes={() => setDialog({ kind: "tapes", role })}
            onPostCall={() => setDialog({ kind: "call", role })}
            onPlay={setPlaying}
            onVerdict={async (rid, v) => {
              await supabase.rpc("on_request_verdict", { rid, v });
              loadExtras();
            }}
            onChange={(patch) => setRole(role.id, patch)}
            onRemove={() => confirm(tr("Remove this role?")) && setRoles((rs) => rs.filter((r) => r.id !== role.id))}
          />
        ))}
      </div>

      {dialog?.kind === "tapes" && <AskTapesDialog board={board} role={dialog.role} talents={talents} requests={extras.requests} onClose={() => setDialog(null)} onDone={loadExtras} />}
      {dialog?.kind === "call" && <PostCallDialog board={board} role={dialog.role} onClose={() => setDialog(null)} />}
      {dialog?.kind === "share" && <ShareDialog board={board} shares={extras.shares} votes={extras.votes} onClose={() => setDialog(null)} onDone={loadExtras} />}
      {playing && <TapePlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
    </Page>
  );
}

function RoleColumn({ role, talents, requests, votes, call, onAskTapes, onPostCall, onPlay, onVerdict, onChange, onRemove }) {
  const ranked = useMemo(() => rankForRole(talents, role), [talents, role]);
  const byId = useMemo(() => Object.fromEntries(talents.map((p) => [p.id, p])), [talents]);
  const groups = TRAIT_TYPES.map((type) => [type, role.traits.filter((t) => t.type === type)]).filter(([, list]) => list.length);
  const removeTrait = (trait) => onChange({ traits: role.traits.filter((t) => t !== trait) });
  const addTrait = (trait) => onChange({ traits: [...role.traits, trait] });
  const pick = (pid) => onChange((r) => ({ picks: r.picks?.includes(pid) ? r.picks.filter((x) => x !== pid) : [...(r.picks || []), pid] }));

  return (
    <section className="w-[340px] shrink-0 snap-start rounded-lg border border-border-subtle bg-surface-card">
      <header className="border-b border-border-subtle p-4">
        <div className="flex items-start gap-2">
          <input
            dir="auto"
            value={role.name}
            onChange={(e) => onChange({ name: e.target.value.slice(0, 60) })}
            className="min-w-0 flex-1 bg-transparent font-display text-h3 font-bold text-text-primary outline-none"
            aria-label={tr("Role name")}
          />
          <button type="button" onClick={onRemove} aria-label={tr("Remove role")} className="rounded-sm p-1 text-text-secondary hover:bg-beige-100 hover:text-text-primary">
            <Icon name="close" size={16} />
          </button>
        </div>
        {role.notes && (
          <p dir="auto" className="mb-0 mt-1 line-clamp-3 font-body text-micro text-text-secondary">
            {role.notes}
          </p>
        )}
      </header>

      <div className="grid gap-4 p-4">
        {groups.length === 0 && <p className="m-0 font-body text-small text-text-secondary">{tr("No traits yet. Add what this role needs.")}</p>}
        {groups.map(([type, list]) => (
          <TraitSection key={type} type={type} traits={list} talents={talents} onRemove={removeTrait} picks={role.picks || []} onPick={pick} />
        ))}
        <AddTrait onAdd={addTrait} />
      </div>

      <div className="border-t border-border-subtle p-4">
        <Label>{tr("Best matches")}</Label>
        {ranked.length === 0 ? (
          <p className="mb-0 mt-2 font-body text-small text-text-secondary">{tr("Nobody fits yet.")}</p>
        ) : (
          <ul className="m-0 mt-2 grid list-none gap-2 p-0">
            {ranked.slice(0, 8).map(({ p, pct }) => (
              <li key={p.id}>
                <TalentRow p={p} right={<span className="font-mono text-micro text-text-accent" dir="ltr">{pct}%</span>} picked={role.picks?.includes(p.id)} onPick={() => pick(p.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {(role.picks || []).length > 0 && (
        <div className="border-t border-border-subtle bg-mint-100 p-4">
          <Label>{tr("Picks")}</Label>
          <ul className="m-0 mt-2 grid list-none gap-3 p-0">
            {role.picks.map((pid) => {
              if (!byId[pid]) return null;
              const req = requests.find((r) => r.talent === pid);
              return (
                <li key={pid}>
                  <TalentRow p={byId[pid]} picked onPick={() => pick(pid)} right={<PickStatus req={req} votes={votes.filter((v) => v.talent === pid)} />} />
                  {req?.status === "submitted" && (
                    <div className="mt-1 flex flex-wrap items-center gap-1 ps-[40px]">
                      <Button size="sm" variant="dark" onClick={() => onPlay({ url: req.tape_url, title: byId[pid].display_name })}>
                        <Icon name="play" size={12} fill /> {tr("Watch tape")}
                      </Button>
                      {VERDICTS.map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          aria-pressed={req.verdict === v}
                          onClick={() => onVerdict(req.id, req.verdict === v ? null : v)}
                          className={`rounded-pill border px-2 py-1 font-body text-micro ${
                            req.verdict === v ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle bg-surface-card text-text-primary"
                          }`}
                        >
                          {tr(label)}
                        </button>
                      ))}
                    </div>
                  )}
                  {req?.tape_note && (
                    <p dir="auto" className="mb-0 mt-1 ps-[40px] font-body text-micro text-text-secondary">
                      {req.tape_note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <Button size="sm" variant="dark" onClick={onAskTapes}>
              <Icon name="camera" size={14} /> {tr("Ask for self-tapes")}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-border-subtle p-4">
        {call ? (
          <Link to={`/calls/${call.id}`} className="flex items-center justify-between gap-2 font-body text-small font-semibold text-text-primary hover:underline">
            <span className="inline-flex items-center gap-2">
              <Icon name="bolt" size={16} /> {tr(call.status === "open" ? "Open call is live" : "Open call closed")}
            </span>
            <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <Button size="sm" variant="secondary" onClick={onPostCall}>
            <Icon name="bolt" size={14} /> {tr("Post as open call")}
          </Button>
        )}
      </div>
    </section>
  );
}

function TraitSection({ type, traits, talents, onRemove, picks, onPick }) {
  const [open, setOpen] = useState(false);
  // Everyone who fits any trait in this section; exact beats similar.
  const { exact, similar } = useMemo(() => {
    const ex = new Map();
    const si = new Map();
    for (const trait of traits) {
      const m = matchesFor(talents, trait);
      m.exact.forEach((p) => ex.set(p.id, p));
      m.similar.forEach((p) => !ex.has(p.id) && si.set(p.id, p));
    }
    ex.forEach((_, k) => si.delete(k));
    return { exact: [...ex.values()], similar: [...si.values()] };
  }, [traits, talents]);
  const total = exact.length + similar.length;

  return (
    <div>
      <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-secondary">{tr(TYPE_LABEL[type])}</div>
      <div className="flex flex-wrap gap-2">
        {traits.map((trait, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-pill border border-border-subtle bg-beige-100 py-1 pe-1 ps-3 font-body text-small text-text-primary">
            {traitText(trait)}
            <button type="button" onClick={() => onRemove(trait)} aria-label={tr("Remove")} className="rounded-pill p-1 text-text-secondary hover:bg-beige-300 hover:text-text-primary">
              <Icon name="close" size={12} />
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`mt-2 flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 font-body text-small transition-colors duration-150 ${
          open ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle text-text-primary hover:border-green-950"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Icon name={open ? "close" : "plus"} size={16} />
          {total === 1 ? tr("1 talent") : tr("{n} talents", { n: total })}
        </span>
        {total > 0 && <span className="font-mono text-micro opacity-80">{tr("{a} exact · {b} close", { a: exact.length, b: similar.length })}</span>}
      </button>
      {open && (
        <div className="mt-2 grid gap-3 rounded-md bg-beige-100 p-3">
          {total === 0 && <p className="m-0 font-body text-small text-text-secondary">{tr("Nobody fits this yet.")}</p>}
          {exact.length > 0 && (
            <div>
              <div className="mb-1 font-body text-micro font-semibold text-text-primary">{tr("Exact")}</div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {exact.map((p) => (
                  <li key={p.id}><TalentRow p={p} picked={picks.includes(p.id)} onPick={() => onPick(p.id)} /></li>
                ))}
              </ul>
            </div>
          )}
          {similar.length > 0 && (
            <div>
              <div className="mb-1 font-body text-micro font-semibold text-text-primary">{tr("Close matches")}</div>
              <ul className="m-0 grid list-none gap-2 p-0">
                {similar.map((p) => (
                  <li key={p.id}><TalentRow p={p} picked={picks.includes(p.id)} onPick={() => onPick(p.id)} /></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TalentRow({ p, right, picked, onPick }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar profile={p} size={32} />
      <a href={`/${p.handle}`} target="_blank" rel="noopener" className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate font-body text-small font-semibold text-text-primary hover:underline">
          <bdi>{p.display_name}</bdi>
          {p.verified && <Verified size={12} />}
          {p.is_minor && <Badge tone="inverse">{tr("Under 18")}</Badge>}
        </span>
      </a>
      {right}
      <button
        type="button"
        onClick={onPick}
        aria-pressed={!!picked}
        title={tr(picked ? "Remove from picks" : "Add to picks")}
        className={`rounded-sm p-1 ${picked ? "bg-green-900 text-beige-100" : "text-text-secondary hover:bg-beige-300 hover:text-text-primary"}`}
      >
        <Icon name={picked ? "check" : "star"} size={14} />
      </button>
    </div>
  );
}

function PickStatus({ req, votes }) {
  const yes = votes.filter((v) => v.vote === "yes").length;
  const label = !req ? null : req.status === "submitted" ? "Tape in" : req.status === "declined" ? "Declined" : "Tape asked";
  return (
    <span className="flex shrink-0 items-center gap-1">
      {votes.length > 0 && (
        <span className="font-mono text-[10px] text-text-accent" title={votes.map((v) => `${v.voter}: ${tr(v.vote ? v.vote[0].toUpperCase() + v.vote.slice(1) : "No vote")}${v.comment ? ` · ${v.comment}` : ""}`).join("\n")}>
          {tr("Client {n} yes", { n: yes })}
        </span>
      )}
      {label && <Badge tone={req.status === "submitted" ? "accent" : "outline"}>{tr(label)}</Badge>}
    </span>
  );
}

function AddTrait({ onAdd }) {
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const ranged = type === "age" || type === "height";
  const ready = type && (ranged ? min && max && +min <= +max : value);
  const field = "rounded-sm border border-border-subtle bg-surface-card px-2 py-1 font-body text-small text-text-primary";

  const submit = () => {
    if (!ready) return;
    onAdd(ranged ? { type, value: { min: +min, max: +max } } : { type, value });
    setValue("");
    setMin("");
    setMax("");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border-subtle pt-3">
      <select aria-label={tr("Trait")} className={field} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">{tr("Add a trait")}</option>
        {TRAIT_TYPES.map((t) => (
          <option key={t} value={t}>
            {tr(TYPE_LABEL[t])}
          </option>
        ))}
      </select>
      {type && !ranged && (
        <select aria-label={tr(TYPE_LABEL[type])} className={field} value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">{tr("Choose")}</option>
          {TYPE_OPTIONS[type].map((o) => (
            <option key={o} value={o}>
              {opt(o)}
            </option>
          ))}
        </select>
      )}
      {ranged && (
        <>
          <input type="number" dir="ltr" aria-label={tr("From")} placeholder={tr("From")} className={`${field} w-[72px]`} value={min} onChange={(e) => setMin(e.target.value)} />
          <input type="number" dir="ltr" aria-label={tr("To")} placeholder={tr("To")} className={`${field} w-[72px]`} value={max} onChange={(e) => setMax(e.target.value)} />
        </>
      )}
      {type && (
        <Button size="sm" variant="secondary" onClick={submit} disabled={!ready}>
          {tr("Add")}
        </Button>
      )}
    </div>
  );
}
