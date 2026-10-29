import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { mediaUrl } from "../lib/media.js";
import { opt, tr } from "../lib/i18n.jsx";
import { VERDICTS, formatDate } from "../lib/castings.js";
import { Badge, Button, Card, Empty, Label, Notice, Spinner, Verified, Wordmark } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { LangSwitch } from "../components/Shell.jsx";
import { WorkCard } from "../components/WorkCard.jsx";
import { TapePlayer } from "../components/TapePlayer.jsx";

const VOTER_KEY = "on:voter";

function savedVoter() {
  try {
    return localStorage.getItem(VOTER_KEY) || "";
  } catch {
    return "";
  }
}

// /shortlist/:token — a casting director's picks for a client. No sign-in:
// the link itself is the key, and it expires.
export function Shortlist() {
  const { token } = useParams();
  const [data, setData] = useState(undefined);
  const [voter, setVoter] = useState(savedVoter);
  const [asking, setAsking] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [roleId, setRoleId] = useState(null);

  const load = useCallback(async () => {
    const { data: d } = await supabase.rpc("on_share_get", { tok: token });
    setData(d || null);
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);

  const vote = async (role, talent, v, comment) => {
    if (!voter) return setAsking({ role, talent, v, comment });
    await supabase.rpc("on_share_vote", { tok: token, rid: role, tid: talent, who: voter, v, note: comment ?? null });
    load();
  };

  if (data === undefined) return <Spinner />;

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="border-b border-border-subtle bg-surface-page">
        <div className="mx-auto flex h-[60px] max-w-container items-center justify-between gap-4 px-4 sm:px-6">
          <a href="/" aria-label={tr("ON home")}>
            <Wordmark />
          </a>
          <div className="flex items-center gap-2">
            {voter && (
              <button type="button" onClick={() => setAsking({})} className="max-w-[160px] truncate font-body text-small text-text-secondary hover:text-text-primary">
                {tr("Voting as {name}", { name: "" })}
                <bdi>{voter}</bdi>
              </button>
            )}
            <LangSwitch />
          </div>
        </div>
      </header>

      {!data ? (
        <main className="mx-auto max-w-[640px] px-4 py-9">
          <Empty title="This shortlist link has expired" body="Ask the casting director for a new link." />
        </main>
      ) : (
        <main className="mx-auto max-w-container px-4 py-6 sm:px-6 sm:py-8">
          <Label>{tr("Shortlist")}</Label>
          <h1 className="m-0 mt-1 font-display text-h1 font-bold tracking-tight text-text-primary">
            <bdi>{data.title}</bdi>
          </h1>
          <p className="mb-0 mt-1 flex flex-wrap gap-x-3 font-body text-body text-text-secondary">
            {data.client && <span>{tr("For {client}", { client: "" })}<bdi>{data.client}</bdi></span>}
            <span>
              {tr("from {name}", { name: "" })}
              <bdi>{data.from_company || data.from_name}</bdi>
            </span>
            <span>{tr("Link works until {date}", { date: formatDate(data.expires_at) })}</span>
          </p>
          <div className="mt-4 max-w-[640px]">
            <Notice tone="accent">{tr("Vote yes, maybe or no on each person and leave a note. The casting director sees your votes right away. No account needed.")}</Notice>
          </div>

          {data.roles.length > 1 && (
            <div className="sticky top-0 z-20 -mx-4 mt-5 flex gap-1 overflow-x-auto bg-surface-page/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
              {data.roles.map((r) => (
                <a
                  key={r.id}
                  href={`#role-${r.id}`}
                  onClick={() => setRoleId(r.id)}
                  className={`whitespace-nowrap rounded-pill border px-3 py-1 font-body text-small ${roleId === r.id ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle text-text-primary"}`}
                >
                  <bdi>{r.name}</bdi> <span dir="ltr">({r.talent.length})</span>
                </a>
              ))}
            </div>
          )}

          {data.roles.map((r) => (
            <section key={r.id} id={`role-${r.id}`} className="mt-8 scroll-mt-[60px]">
              <h2 className="m-0 font-display text-h2 font-bold tracking-tight text-text-primary">
                <bdi>{r.name}</bdi>
              </h2>
              {r.notes && (
                <p dir="auto" className="mb-0 mt-1 max-w-[70ch] font-body text-small text-text-secondary">
                  {r.notes}
                </p>
              )}
              {r.talent.length === 0 ? (
                <p className="font-body text-small text-text-secondary">{tr("No one picked for this role yet.")}</p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {r.talent.map((p) => (
                    <PersonCard
                      key={p.id}
                      p={p}
                      votes={data.votes.filter((v) => v.role_id === r.id && v.talent === p.id)}
                      voter={voter}
                      onVote={(v, comment) => vote(r.id, p.id, v, comment)}
                      onPlay={setPlaying}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
          <p className="mt-9 font-body text-micro text-text-secondary">{tr("Shared privately through ON, casting in Egypt. Contact details are kept with the casting director.")}</p>
        </main>
      )}

      {asking && (
        <NameDialog
          initial={voter}
          onClose={() => setAsking(null)}
          onSave={async (name) => {
            setVoter(name);
            try {
              localStorage.setItem(VOTER_KEY, name);
            } catch {
              /* asked again next time */
            }
            const pending = asking;
            setAsking(null);
            if (pending.role) {
              await supabase.rpc("on_share_vote", { tok: token, rid: pending.role, tid: pending.talent, who: name, v: pending.v, note: pending.comment ?? null });
              load();
            }
          }}
        />
      )}
      {playing && <TapePlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function PersonCard({ p, votes, voter, onVote, onPlay }) {
  const [photo, setPhoto] = useState(0);
  const [showWork, setShowWork] = useState(false);
  const mine = votes.find((v) => v.voter === voter);
  const [comment, setComment] = useState(mine?.comment || "");
  useEffect(() => setComment(mine?.comment || ""), [mine?.comment]);
  const photos = p.photos.length ? p.photos : p.avatar ? [p.avatar] : [];
  const others = votes.filter((v) => v.voter !== voter);
  const age = p.age_min ? (p.age_max && p.age_max !== p.age_min ? `⁦${p.age_min}–${p.age_max}⁩` : String(p.age_min)) : null;
  const facts = [age && tr("Playing age {n}", { n: age }), p.height && tr("{n} cm", { n: p.height }), opt(p.build), opt(p.city)].filter(Boolean);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/5] bg-mint-100">
        {photos.length > 0 ? <img src={mediaUrl(photos[photo])} alt={p.name} className="h-full w-full object-cover" loading="lazy" /> : null}
        {photos.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {photos.map((_, i) => (
              <button key={i} type="button" aria-label={tr("Photo {n}", { n: i + 1 })} onClick={() => setPhoto(i)} className={`h-2 rounded-pill transition-all ${i === photo ? "w-5 bg-beige-100" : "w-2 bg-beige-100/60"}`} />
            ))}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button type="button" aria-label={tr("Previous")} className="absolute inset-y-0 start-0 w-1/3" onClick={() => setPhoto((photo - 1 + photos.length) % photos.length)} />
            <button type="button" aria-label={tr("Next")} className="absolute inset-y-0 end-0 w-1/3" onClick={() => setPhoto((photo + 1) % photos.length)} />
          </>
        )}
        <div className="absolute start-2 top-2 flex gap-1">
          {p.minor && <Badge tone="inverse">{tr("Under 18")}</Badge>}
          {p.seed && <Badge>{tr("Test profile")}</Badge>}
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <div>
          <div className="flex items-center gap-1 font-display text-h3 font-bold text-text-primary">
            <bdi>{p.name}</bdi>
            {p.verified && <Verified size={16} />}
          </div>
          {p.headline && (
            <div className="font-body text-small text-text-secondary">
              <bdi>{p.headline}</bdi>
            </div>
          )}
          <div className="mt-1 font-body text-micro text-text-secondary">{facts.join(" · ")}</div>
        </div>
        {[...(p.languages || []), ...(p.accents || []), ...(p.skills || [])].length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...(p.languages || []), ...(p.accents || []), ...(p.skills || [])].slice(0, 10).map((x) => (
              <span key={x} className="rounded-pill bg-beige-100 px-2 py-1 font-body text-micro text-text-primary">
                {opt(x)}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {p.tape && (
            <Button size="sm" variant="dark" onClick={() => onPlay({ url: p.tape, title: p.name })}>
              <Icon name="play" size={12} fill /> {tr("Watch self-tape")}
            </Button>
          )}
          {p.work.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setShowWork((v) => !v)}>
              <Icon name="film" size={14} /> {tr("Past work")} <span dir="ltr">({p.work.length})</span>
            </Button>
          )}
          {p.handle && (
            <Button size="sm" variant="ghost" href={`/${p.handle}`} target="_blank" rel="noopener">
              {tr("Full profile")}
            </Button>
          )}
        </div>
        {showWork && (
          <div className="grid gap-3">
            {p.work.map((w, i) => (
              <WorkCard key={i} item={w} />
            ))}
          </div>
        )}

        <div className="border-t border-border-subtle pt-3">
          <div className="flex gap-1">
            {VERDICTS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={mine?.vote === v}
                onClick={() => onVote(mine?.vote === v ? null : v, comment)}
                className={`flex-1 rounded-sm border px-3 py-2 font-body text-small font-semibold transition-colors duration-150 ${
                  mine?.vote === v ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle text-text-primary hover:border-green-950"
                }`}
              >
                {tr(label)}
              </button>
            ))}
          </div>
          <textarea
            dir="auto"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => comment !== (mine?.comment || "") && onVote(mine?.vote ?? null, comment)}
            placeholder={tr("Add a note (optional)")}
            className="mt-2 min-h-[60px] w-full resize-y rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-green-950"
          />
          {others.length > 0 && (
            <ul className="m-0 mt-2 grid list-none gap-1 p-0">
              {others.map((v) => (
                <li key={v.voter} className="font-body text-micro text-text-secondary">
                  <span className="font-semibold text-text-primary">
                    <bdi>{v.voter}</bdi>
                  </span>
                  {v.vote && `: ${tr(VERDICTS.find(([k]) => k === v.vote)[1])}`}
                  {v.comment && (
                    <>
                      {" · "}
                      <bdi>{v.comment}</bdi>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function NameDialog({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial || "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/60 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <form
        className="grid w-full max-w-[380px] gap-3 rounded-lg bg-surface-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim().slice(0, 60));
        }}
      >
        <h2 className="m-0 font-display text-h3 font-semibold text-text-primary">{tr("What's your name?")}</h2>
        <p className="m-0 font-body text-small text-text-secondary">{tr("So the casting director knows whose vote it is.")}</p>
        <input
          autoFocus
          dir="auto"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-green-950"
        />
        <Button type="submit" disabled={!name.trim()}>
          {tr("Save")}
        </Button>
      </form>
    </div>
  );
}
