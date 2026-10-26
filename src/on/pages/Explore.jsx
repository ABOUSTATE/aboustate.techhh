import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { isApprovedDirector, useAuth } from "../lib/auth.jsx";
import { ACCENTS, CATEGORIES, CITIES, GENDERS, LANGUAGES, SKILLS } from "../lib/options.js";
import { Button, Chips, Empty, Input, Label, Notice, Select, Spinner, Toggle } from "../components/ui.jsx";
import { Icon } from "../components/icons.jsx";
import { CARD_SELECT, TalentGrid } from "../components/TalentCard.jsx";
import { Page } from "../components/Shell.jsx";
import { tr } from "../lib/i18n.jsx";

const PAGE = 24;
const LIST_KEYS = ["cat", "lang", "acc", "skill"];

function readFilters(params) {
  const f = Object.fromEntries(params.entries());
  LIST_KEYS.forEach((k) => (f[k] = f[k] ? f[k].split(",") : []));
  return f;
}

export function Explore() {
  const { profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const [q, setQ] = useState(filters.q || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [page, setPage] = useState(0);
  const [panel, setPanel] = useState(false);

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    const val = Array.isArray(v) ? v.join(",") : v;
    if (val === "" || val === null || val === undefined || val === false) next.delete(k);
    else next.set(k, val === true ? "1" : val);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const t = setTimeout(() => q !== (filters.q || "") && setFilter("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [params]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let query = supabase
        .from("on_profiles")
        .select(CARD_SELECT.replace("on_talent(", "on_talent!inner("))
        .eq("role", "talent")
        .eq("published", true);
      const f = filters;
      if (f.q) {
        const term = f.q.replace(/[%,()]/g, " ");
        query = query.or(`display_name.ilike.%${term}%,handle.ilike.%${term}%,headline.ilike.%${term}%`);
      }
      if (f.city) query = query.ilike("city", `%${f.city}%`);
      if (f.gender) query = query.eq("on_talent.gender", f.gender);
      if (f.age) query = query.lte("on_talent.playing_age_min", Number(f.age)).gte("on_talent.playing_age_max", Number(f.age));
      if (f.hmin) query = query.gte("on_talent.height_cm", Number(f.hmin));
      if (f.hmax) query = query.lte("on_talent.height_cm", Number(f.hmax));
      if (f.cat.length) query = query.contains("on_talent.categories", f.cat);
      if (f.lang.length) query = query.contains("on_talent.languages", f.lang);
      if (f.acc.length) query = query.contains("on_talent.accents", f.acc);
      if (f.skill.length) query = query.contains("on_talent.skills", f.skill);
      if (f.avail) query = query.eq("on_talent.available", true);
      if (f.verified) query = query.eq("verified", true);
      if (f.photo) query = query.not("avatar_path", "is", null);
      query = query.order(f.sort === "updated" ? "updated_at" : "created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE);
      const { data } = await query;
      if (!alive) return;
      const rows = data || [];
      setMore(rows.length > PAGE);
      setItems((prev) => (page === 0 ? rows.slice(0, PAGE) : [...prev, ...rows.slice(0, PAGE)]));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [filters, page]);

  const activeCount = [...Object.entries(filters)].filter(([k, v]) => k !== "q" && k !== "sort" && (Array.isArray(v) ? v.length : v)).length;

  return (
    <Page>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 font-display text-h1 font-bold tracking-tight text-text-primary">{tr("Explore talent")}</h1>
          <p className="mb-0 mt-1 font-body text-small text-text-secondary">
            {tr(isApprovedDirector(profile) ? "You're seeing everyone, including under-18 profiles." : "Public profiles. Approved casting directors also see under-18s and contact details.")}
          </p>
        </div>
      </div>

      <div className="sticky top-[60px] z-30 -mx-4 mb-5 flex gap-2 bg-surface-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <label className="flex flex-1 items-center gap-2 rounded-pill border border-border-subtle bg-surface-card px-4">
          <Icon name="search" size={18} className="text-text-secondary" />
          <input
            className="w-full bg-transparent py-2 font-body text-small text-text-primary outline-none placeholder:text-beige-700"
            placeholder={tr("Search names, handles, headlines")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Button variant={activeCount ? "dark" : "secondary"} onClick={() => setPanel((v) => !v)} className="!rounded-pill">
          <Icon name="filter" size={16} /> {tr("Filters")}{activeCount ? ` ${activeCount}` : ""}
        </Button>
        <select
          aria-label={tr("Sort")}
          className="hidden rounded-pill border border-border-subtle bg-surface-card px-4 font-body text-small text-text-primary sm:block"
          value={filters.sort || ""}
          onChange={(e) => setFilter("sort", e.target.value)}
        >
          <option value="">{tr("Newest")}</option>
          <option value="updated">{tr("Recently updated")}</option>
        </select>
      </div>

      {panel && (
        <div className="mb-6 grid gap-5 rounded-lg border border-border-subtle bg-surface-card p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Plays age" type="number" min={1} max={100} placeholder="e.g. 25" value={filters.age || ""} onChange={(e) => setFilter("age", e.target.value)} />
            <Select label="Gender" options={GENDERS} placeholder="Any" value={filters.gender || ""} onChange={(e) => setFilter("gender", e.target.value)} />
            <Select label="City" options={CITIES} placeholder="Anywhere" value={filters.city || ""} onChange={(e) => setFilter("city", e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Height from" type="number" placeholder="cm" value={filters.hmin || ""} onChange={(e) => setFilter("hmin", e.target.value)} />
              <Input label="to" type="number" placeholder="cm" value={filters.hmax || ""} onChange={(e) => setFilter("hmax", e.target.value)} />
            </div>
          </div>
          <FilterChips label="Does" options={CATEGORIES} value={filters.cat} onChange={(v) => setFilter("cat", v)} />
          <FilterChips label="Speaks" options={LANGUAGES} value={filters.lang} onChange={(v) => setFilter("lang", v)} />
          <FilterChips label="Accents" options={ACCENTS} value={filters.acc} onChange={(v) => setFilter("acc", v)} />
          <FilterChips label="Skills" options={SKILLS} value={filters.skill} onChange={(v) => setFilter("skill", v)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle label="Available now" checked={!!filters.avail} onChange={(v) => setFilter("avail", v)} />
            <Toggle label="Verified only" checked={!!filters.verified} onChange={(v) => setFilter("verified", v)} />
            <Toggle label="Has a photo" checked={!!filters.photo} onChange={(v) => setFilter("photo", v)} />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
              {tr("Clear all")}
            </Button>
            <Button variant="dark" onClick={() => setPanel(false)}>
              {tr("Show results")}
            </Button>
          </div>
        </div>
      )}

      {loading && page === 0 ? (
        <Spinner />
      ) : items.length ? (
        <>
          <TalentGrid items={items} />
          {more && (
            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => setPage((n) => n + 1)} disabled={loading}>
                {tr(loading ? "Loading" : "Load more")}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Empty
          title="Nobody matches yet"
          body={activeCount || filters.q ? "Try fewer filters. New profiles join every week." : "Profiles will show up here as talent joins."}
          action={(activeCount || filters.q) && <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>{tr("Clear filters")}</Button>}
        />
      )}
      {!profile && (
        <div className="mt-7">
          <Notice tone="dark">
            {tr("Casting?")}{" "}
            <a href="/join?as=director" className="font-semibold underline">
              {tr("Request director access")}
            </a>{" "}
            {tr("to see contacts and under-18 talent.")}
          </Notice>
        </div>
      )}
    </Page>
  );
}

function FilterChips({ label, options, value, onChange }) {
  return (
    <div>
      <div className="mb-2">
        <Label>{tr(label)}</Label>
      </div>
      <Chips options={options} value={value} onChange={onChange} />
    </div>
  );
}
