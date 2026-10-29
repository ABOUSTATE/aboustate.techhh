import { supabase } from "../../lib/supabaseClient.js";
import { opt, tr } from "./i18n.jsx";

// Shared bits for boards, self-tape requests, client shortlists and open
// calls.

export const TALENT_SELECT = "id, handle, display_name, avatar_path, city, verified, is_minor, seed, on_talent!inner(*)";

export function withTalent(rows) {
  return (rows || []).map((p) => ({ ...p, t: Array.isArray(p.on_talent) ? p.on_talent[0] : p.on_talent }));
}

export async function loadTalents(ids) {
  if (!ids.length) return [];
  const { data } = await supabase.from("on_profiles").select(TALENT_SELECT).in("id", ids);
  return withTalent(data);
}

export const TYPE_LABEL = {
  gender: "Gender",
  age: "Playing age",
  height: "Height",
  build: "Build",
  hair: "Hair",
  eyes: "Eyes",
  categories: "What they do",
  languages: "Languages",
  accents: "Accents",
  skills: "Skills",
  city: "City",
};

export function traitText(trait) {
  if (trait.type === "age") return `⁦${trait.value.min}–${trait.value.max}⁩`;
  if (trait.type === "height") return tr("{n} cm", { n: `⁦${trait.value.min}–${trait.value.max}⁩` });
  return opt(trait.value);
}

function locale() {
  return document.documentElement.lang === "ar" ? "ar-EG" : "en-GB";
}

export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString(locale(), { day: "numeric", month: "short" });
}

// Whole days until a date (a deadline on the day itself is 0).
export function daysLeft(d) {
  if (!d) return null;
  const end = new Date(`${String(d).slice(0, 10)}T23:59:59`);
  return Math.floor((end - new Date()) / 86400000);
}

export function deadlineText(d) {
  const n = daysLeft(d);
  if (n === null) return tr("No deadline");
  if (n < 0) return tr("Deadline passed");
  if (n === 0) return tr("Due today");
  if (n === 1) return tr("Due tomorrow");
  return tr("Due {date}", { date: formatDate(d) });
}

export const VERDICTS = [
  ["yes", "Yes"],
  ["maybe", "Maybe"],
  ["no", "No"],
];
