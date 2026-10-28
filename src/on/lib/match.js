// Matches talent against a role's traits: an exact fit, or a close one
// ("or similar"), so a board never comes up empty for a near miss.

// Values that sit next to each other count as similar.
const NEAR = {
  build: [["Slim", "Athletic"], ["Athletic", "Muscular"], ["Average", "Curvy"], ["Curvy", "Plus size"], ["Average", "Athletic"]],
  hair: [["Black", "Dark brown"], ["Dark brown", "Brown"], ["Brown", "Light brown"], ["Light brown", "Blonde"], ["Grey", "Bald"]],
  eyes: [["Brown", "Dark brown"], ["Brown", "Hazel"], ["Hazel", "Green"], ["Green", "Blue"], ["Blue", "Grey"]],
  city: [["Cairo", "Giza"]],
};
const GROUPS = {
  accents: [
    ["Cairene", "Alexandrian"],
    ["Sa'idi", "Fellahi", "Nubian", "Bedouin"],
    ["Gulf", "Levantine", "Moroccan", "Fusha (MSA)"],
    ["British", "American"],
  ],
  skills: [
    ["Ballet", "Contemporary dance", "Belly dance", "Tanoura", "Gymnastics"],
    ["Stage combat", "Martial arts", "Boxing"],
    ["Singing", "Piano", "Guitar", "Oud"],
    ["Swimming", "Football", "Cycling", "Skateboarding", "Yoga", "Gymnastics"],
    ["Driving", "Motorbike", "Horse riding"],
    ["Comedy", "Improv", "Impressions"],
  ],
  categories: [["Actor", "Extra", "Presenter"], ["Model", "Influencer"], ["Singer", "Voice actor"], ["Dancer", "Stunt performer"]],
  languages: [],
};

function near(type, a, b) {
  if (!a || !b) return false;
  return (NEAR[type] || []).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
function sameGroup(type, a, b) {
  return (GROUPS[type] || []).some((g) => g.includes(a) && g.includes(b));
}

// "exact" | "similar" | null for one talent and one trait.
export function fit(talent, trait) {
  const t = talent.t || {};
  const v = trait.value;
  switch (trait.type) {
    case "gender":
      return t.gender === v ? "exact" : null;
    case "age": {
      const lo = t.playing_age_min ?? t.playing_age_max;
      const hi = t.playing_age_max ?? t.playing_age_min;
      if (lo == null) return null;
      if (lo <= v.max && hi >= v.min) return "exact";
      if (lo <= v.max + 3 && hi >= v.min - 3) return "similar";
      return null;
    }
    case "height": {
      const h = t.height_cm;
      if (!h) return null;
      if (h >= v.min && h <= v.max) return "exact";
      if (h >= v.min - 6 && h <= v.max + 6) return "similar";
      return null;
    }
    case "build":
    case "hair":
    case "eyes": {
      const have = t[trait.type === "build" ? "build" : trait.type === "hair" ? "hair_color" : "eye_color"];
      return have === v ? "exact" : near(trait.type, have, v) ? "similar" : null;
    }
    case "city":
      return talent.city === v ? "exact" : near("city", talent.city, v) ? "similar" : null;
    case "languages":
    case "accents":
    case "skills":
    case "categories": {
      const list = t[trait.type] || [];
      if (list.includes(v)) return "exact";
      return list.some((x) => sameGroup(trait.type, x, v)) ? "similar" : null;
    }
    default:
      return null;
  }
}

// Everyone who fits one trait, exact first.
export function matchesFor(talents, trait) {
  const exact = [];
  const similar = [];
  for (const p of talents) {
    const f = fit(p, trait);
    if (f === "exact") exact.push(p);
    else if (f === "similar") similar.push(p);
  }
  return { exact, similar };
}

// Talents ranked for a whole role: an exact trait counts 1, a close one 0.5.
export function rankForRole(talents, role) {
  const traits = role.traits || [];
  if (!traits.length) return [];
  return talents
    .map((p) => {
      let score = 0;
      const hits = [];
      for (const tr of traits) {
        const f = fit(p, tr);
        if (f === "exact") score += 1;
        if (f === "similar") score += 0.5;
        if (f) hits.push({ trait: tr, fit: f });
      }
      return { p, score, pct: Math.round((score / traits.length) * 100), hits };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.p.display_name.localeCompare(b.p.display_name));
}

export const TRAIT_TYPES = ["gender", "age", "height", "build", "hair", "eyes", "categories", "languages", "accents", "skills", "city"];
