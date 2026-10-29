import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../lib/auth.jsx";
import { tr } from "../lib/i18n.jsx";
import { Avatar, Button, Dialog, Input, Label, Notice, Textarea, Toggle } from "./ui.jsx";

// The board's outward-facing actions: asking picks for self-tapes, posting
// a role as an open call, and sharing picks with a client.

export function AskTapesDialog({ board, role, talents, requests, onClose, onDone }) {
  const { profile } = useAuth();
  const asked = new Set(requests.filter((r) => r.role_id === role.id).map((r) => r.talent));
  const open = (role.picks || []).filter((pid) => !asked.has(pid) && talents.some((p) => p.id === pid));
  const [chosen, setChosen] = useState(open);
  const [message, setMessage] = useState(role.notes || "");
  const [sides, setSides] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const byId = Object.fromEntries(talents.map((p) => [p.id, p]));

  const send = async () => {
    setBusy(true);
    setError("");
    const rows = chosen.map((talent) => ({
      board_id: board.id,
      role_id: role.id,
      director: profile.id,
      talent,
      role_name: role.name,
      project: board.title,
      from_name: profile.display_name,
      from_company: profile.company || null,
      message: message.trim() || null,
      sides: sides.trim() || null,
      deadline: deadline || null,
    }));
    const { error: err } = await supabase.from("on_requests").insert(rows);
    setBusy(false);
    if (err) return setError(tr(err.message));
    onDone();
    onClose();
  };

  return (
    <Dialog title="Ask for self-tapes" onClose={onClose}>
      {open.length === 0 ? (
        <p className="m-0 font-body text-small text-text-secondary">{tr("Everyone in this role's picks has already been asked.")}</p>
      ) : (
        <div className="grid gap-4">
          <div>
            <Label>{tr("Send to")}</Label>
            <div className="mt-2 grid gap-2">
              {open.map((pid) => (
                <label key={pid} className="flex items-center gap-2 font-body text-small text-text-primary">
                  <input type="checkbox" checked={chosen.includes(pid)} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, pid] : c.filter((x) => x !== pid)))} />
                  <Avatar profile={byId[pid]} size={24} />
                  <bdi>{byId[pid].display_name}</bdi>
                </label>
              ))}
            </div>
          </div>
          <Textarea label="What you need" dir="auto" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="One take, eye level, natural light. Slate with your name and height first." />
          <Textarea label="Lines to read (optional)" dir="auto" value={sides} onChange={(e) => setSides(e.target.value)} placeholder="Paste the scene here." />
          <Input label="Deadline" type="date" dir="ltr" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <p className="m-0 font-body text-micro text-text-secondary">
            {tr("Talent send back a YouTube, Drive or Vimeo link, so tapes never use your storage. Under-18s get the request through their guardian.")}
          </p>
          {error && <Notice>{error}</Notice>}
          <div>
            <Button onClick={send} disabled={!chosen.length || busy}>
              {busy ? tr("Sending") : chosen.length === 1 ? tr("Send 1 request") : tr("Send {n} requests", { n: chosen.length })}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export function PostCallDialog({ board, role, onClose }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const city = role.traits.find((t) => t.type === "city")?.value || "";
  const [f, setF] = useState({ title: role.name, description: role.notes || "", city, pay: "", shoot_dates: "", deadline: "", needs_tape: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const post = async () => {
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase
      .from("on_calls")
      .insert({
        ...f,
        title: f.title.trim() || role.name,
        deadline: f.deadline || null,
        board_id: board.id,
        role_id: role.id,
        owner: profile.id,
        project: board.title,
        company: profile.company || null,
        traits: role.traits,
      })
      .select("id")
      .single();
    setBusy(false);
    if (err) return setError(tr(err.message));
    navigate(`/calls/${data.id}`);
  };

  return (
    <Dialog title="Post as open call" onClose={onClose}>
      <div className="grid gap-4">
        <p className="m-0 font-body text-small text-text-secondary">{tr("Talent who fit this role's traits see it first and can apply in one tap. Contact details stay private.")}</p>
        <Input label="Role" dir="auto" value={f.title} onChange={set("title")} />
        <Textarea label="About the role" dir="auto" value={f.description} onChange={set("description")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" dir="auto" value={f.city} onChange={set("city")} />
          <Input label="Pay (optional)" dir="auto" value={f.pay} onChange={set("pay")} placeholder="Paid, rate on request" />
          <Input label="Shoot dates (optional)" dir="auto" value={f.shoot_dates} onChange={set("shoot_dates")} />
          <Input label="Apply by" type="date" dir="ltr" value={f.deadline} onChange={set("deadline")} />
        </div>
        <Toggle checked={f.needs_tape} onChange={set("needs_tape")} label="Ask for a self-tape link with each application" />
        {error && <Notice>{error}</Notice>}
        <div>
          <Button onClick={post} disabled={busy}>
            {busy ? tr("Posting") : tr("Post open call")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function shareUrl(token) {
  return `${window.location.origin}/shortlist/${token}`;
}

export function ShareDialog({ board, shares, votes, onClose, onDone }) {
  const { profile } = useAuth();
  const withPicks = board.roles.filter((r) => (r.picks || []).length);
  const [title, setTitle] = useState(board.title);
  const [client, setClient] = useState("");
  const [days, setDays] = useState(14);
  const [roles, setRoles] = useState(withPicks.map((r) => r.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const create = async () => {
    setBusy(true);
    setError("");
    const { error: err } = await supabase.from("on_shares").insert({
      board_id: board.id,
      owner: profile.id,
      title: title.trim() || board.title,
      client: client.trim() || null,
      role_ids: roles,
      expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    setBusy(false);
    if (err) return setError(tr(err.message));
    setClient("");
    onDone();
  };

  const copy = async (token) => {
    await navigator.clipboard.writeText(shareUrl(token));
    setCopied(token);
    setTimeout(() => setCopied(""), 1600);
  };

  const live = shares.filter((s) => !s.revoked && new Date(s.expires_at) > new Date());

  return (
    <Dialog title="Share with client" onClose={onClose} wide>
      <div className="grid gap-5">
        {live.length > 0 && (
          <div className="grid gap-2">
            <Label>{tr("Live links")}</Label>
            {live.map((s) => {
              const voters = new Set(votes.filter((x) => x.share_id === s.id).map((x) => x.voter)).size;
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-subtle p-3">
                  <div className="min-w-0">
                    <div className="truncate font-body text-small font-semibold text-text-primary">
                      <bdi>{s.client || s.title}</bdi>
                    </div>
                    <div className="font-body text-micro text-text-secondary">
                      {tr("Expires {date}", { date: new Date(s.expires_at).toLocaleDateString() })} · {voters === 1 ? tr("1 person voted") : tr("{n} people voted", { n: voters })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" onClick={() => copy(s.token)}>
                      {copied === s.token ? tr("Copied") : tr("Copy link")}
                    </Button>
                    <Button size="sm" variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(shareUrl(s.token))}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </Button>
                    <Button size="sm" variant="secondary" href={shareUrl(s.token)} target="_blank" rel="noopener">
                      {tr("Open")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!confirm(tr("Turn this link off? Anyone who has it won't be able to open it."))) return;
                        await supabase.from("on_shares").update({ revoked: true }).eq("id", s.id);
                        onDone();
                      }}
                    >
                      {tr("Turn off")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid gap-4 rounded-md bg-beige-100 p-4">
          <Label>{tr("New link")}</Label>
          {withPicks.length === 0 ? (
            <p className="m-0 font-body text-small text-text-secondary">{tr("Pick talent on the board first (the star next to each name). The link shows your picks.")}</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Title" dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input label="Client (optional)" dir="auto" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Brand or agency name" />
              </div>
              <div>
                <span className="font-body text-micro font-medium text-text-secondary">{tr("Roles")}</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {withPicks.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 font-body text-small text-text-primary">
                      <input type="checkbox" checked={roles.includes(r.id)} onChange={(e) => setRoles((c) => (e.target.checked ? [...c, r.id] : c.filter((x) => x !== r.id)))} />
                      <bdi>{r.name}</bdi> <span className="text-text-secondary" dir="ltr">({r.picks.length})</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 font-body text-small text-text-primary">
                {tr("Link works for")}
                <select className="rounded-sm border border-border-subtle bg-surface-card px-2 py-1" value={days} onChange={(e) => setDays(+e.target.value)}>
                  {[3, 7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {tr("{n} days", { n: d })}
                    </option>
                  ))}
                </select>
              </label>
              <p className="m-0 font-body text-micro text-text-secondary">
                {tr("Your client sees photos, look, skills, past work and any tapes, and can vote and comment without signing up. Phone numbers and emails are never shown. Under-18s show their first name only.")}
              </p>
              {error && <Notice>{error}</Notice>}
              <div>
                <Button onClick={create} disabled={!roles.length || busy}>
                  {busy ? tr("Creating") : tr("Create link")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
