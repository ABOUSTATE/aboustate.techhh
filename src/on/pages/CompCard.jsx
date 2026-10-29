import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { PRIVATE_COLUMNS, playingAge } from "../lib/options.js";
import { mediaUrl } from "../lib/media.js";
import { opt, tr } from "../lib/i18n.jsx";
import { Button, Empty, Spinner, Wordmark } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { LangSwitch } from "../components/Shell.jsx";

// /handle/card — a one-page comp card laid out for A4. The browser's own
// print dialog turns it into a PDF, which keeps Arabic text shaped right
// and needs no PDF library.
export function CompCard() {
  const { slug } = useParams();
  const handle = (slug || "").replace(/^@/, "").toLowerCase();
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("on_profiles").select("*").eq("handle", handle).maybeSingle();
      if (!p || p.role !== "talent") return setState(false);
      const [{ data: t }, { data: media }, { data: priv }] = await Promise.all([
        supabase.from("on_talent").select("*").eq("profile_id", p.id).maybeSingle(),
        supabase.from("on_media").select("path, kind").eq("profile_id", p.id).in("kind", ["headshot", "photo"]).order("position").order("created_at"),
        supabase.from("on_talent_private").select(PRIVATE_COLUMNS).eq("profile_id", p.id).maybeSingle(),
      ]);
      setState({ p, t: t || {}, photos: (media || []).map((m) => m.path), priv });
    })();
  }, [handle]);

  useEffect(() => {
    if (!state) return;
    const before = document.title;
    document.title = `${state.p.display_name} · ON comp card`;
    return () => {
      document.title = before;
    };
  }, [state]);

  if (state === null) return <Spinner />;
  if (state === false) {
    return (
      <main className="mx-auto max-w-[640px] px-4 py-9">
        <Empty title="This profile isn't available" action={<Button to="/explore">{tr("Explore talent")}</Button>} />
      </main>
    );
  }

  const { p, t, photos, priv } = state;
  const head = mediaUrl(p.avatar_path) || mediaUrl(photos[0]);
  const rest = photos.map(mediaUrl).filter((u) => u && u !== head).slice(0, 4);
  const age = playingAge(t);
  const stats = [
    age && ["Playing age", age],
    t.height_cm && ["Height", tr("{n} cm", { n: t.height_cm })],
    t.weight_kg && ["Weight", tr("{n} kg", { n: t.weight_kg })],
    t.build && ["Build", opt(t.build)],
    t.hair_color && ["Hair", opt(t.hair_color)],
    t.eye_color && ["Eyes", opt(t.eye_color)],
    p.city && ["City", opt(p.city)],
  ].filter(Boolean);
  const lists = [
    (t.languages || []).length && ["Languages", t.languages.map(opt).join(tr(", "))],
    (t.accents || []).length && ["Accents", t.accents.map(opt).join(tr(", "))],
    (t.skills || []).length && ["Skills", t.skills.slice(0, 10).map(opt).join(tr(", "))],
  ].filter(Boolean);
  // Under-18 cards carry the guardian's contact, never the child's.
  const contact = p.is_minor
    ? [priv?.guardian_name && tr("Guardian: {name}", { name: priv.guardian_name }), priv?.guardian_phone].filter(Boolean)
    : [priv?.phone || priv?.whatsapp, priv?.contact_email].filter(Boolean);

  return (
    <div className="min-h-screen bg-beige-300 print:bg-white">
      <style>{"@page { size: A4; margin: 0 } @media print { html, body { background: #fff } }"}</style>
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-4 print:hidden">
        <Link to={`/${p.handle}`} className="inline-flex items-center gap-1 font-body text-small text-text-secondary hover:text-text-primary">
          <Icon name="back" size={14} /> {tr("Back to profile")}
        </Link>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Button onClick={() => window.print()}>
            <Icon name="share" size={16} /> {tr("Save as PDF")}
          </Button>
        </div>
        <p className="m-0 w-full font-body text-micro text-text-secondary">{tr("In the print window choose “Save as PDF”. On a phone, use Share then Print.")}</p>
      </div>

      <article className="mx-auto flex h-[297mm] w-[210mm] flex-col overflow-hidden bg-white shadow-lg print:shadow-none" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-[4mm] p-[10mm] pb-[6mm]">
          <div className="min-h-0 overflow-hidden rounded-md bg-mint-100">{head && <img src={head} alt="" className="h-full w-full object-cover" />}</div>
          <div className="flex min-h-0 flex-col gap-[4mm]">
            <div>
              <h1 className="m-0 font-display text-[34px] font-extrabold leading-none tracking-tight text-green-950">
                <bdi>{p.display_name}</bdi>
              </h1>
              {p.headline && (
                <p className="mb-0 mt-2 font-body text-[13px] leading-snug text-green-900">
                  <bdi>{p.headline}</bdi>
                </p>
              )}
              {(t.categories || []).length > 0 && (
                <p className="mb-0 mt-2 font-mono text-[10px] uppercase tracking-mono text-green-700">{t.categories.map(opt).join(" · ")}</p>
              )}
            </div>
            <div className={`grid min-h-0 flex-1 gap-[3mm] ${rest.length > 2 ? "grid-cols-2 grid-rows-2" : rest.length === 2 ? "grid-rows-2" : "grid-rows-1"}`}>
              {rest.map((u) => (
                <div key={u} className="min-h-0 overflow-hidden rounded-sm bg-mint-100">
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-green-950 px-[10mm] py-[6mm] text-beige-100">
          <dl className="m-0 grid grid-cols-4 gap-x-[6mm] gap-y-[3mm]">
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[9px] uppercase tracking-mono text-mint-300">{tr(k)}</dt>
                <dd className="m-0 font-body text-[14px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {lists.length > 0 && (
            <dl className="m-0 mt-[4mm] grid gap-[2mm] border-t border-green-700 pt-[4mm]">
              {lists.map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-[24mm] shrink-0 font-mono text-[9px] uppercase tracking-mono text-mint-300">{tr(k)}</dt>
                  <dd className="m-0 font-body text-[12px]">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-[4mm] flex items-end justify-between gap-4 border-t border-green-700 pt-[4mm]">
            <div className="font-body text-[12px]">
              <div className="font-semibold" dir="ltr">
                on.aboustate.tech/{p.handle}
              </div>
              {contact.length > 0 && (
                <div className="flex flex-wrap gap-x-4 text-mint-300">
                  {contact.map((c) => (
                    <bdi key={c}>{c}</bdi>
                  ))}
                </div>
              )}
            </div>
            <Wordmark light />
          </div>
        </div>
      </article>
      <div className="h-8 print:hidden" />
    </div>
  );
}
