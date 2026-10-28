// Reads a casting brief (PDF or pasted text) into roles and traits.
//
// No AI service: the brief is matched against ON's own vocabulary (the
// same options talent pick from), in English and Egyptian Arabic, plus
// common ways briefs phrase things ("late 20s", "tall", "Upper Egypt",
// "عشرينات"). It's a strong first draft; the board stays editable.

import { ACCENTS, BUILDS, CATEGORIES, CITIES, LANGUAGES, SKILLS } from "./options.js";
import { AR_OPT } from "./ar.js";

// ---- PDF to text (pdf.js, loaded only when a PDF is opened) ----------
export async function pdfToText(file) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    // Rebuild lines from the text items' vertical positions.
    let line = [];
    let lastY = null;
    const lines = [];
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.join(" "));
        line = [];
      }
      line.push(item.str);
      lastY = y;
      if (item.hasEOL) {
        lines.push(line.join(" "));
        line = [];
        lastY = null;
      }
    }
    if (line.length) lines.push(line.join(" "));
    pages.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"));
  }
  return pages.join("\n\n");
}

// ---- Text clean-up ----------------------------------------------------
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
// For display: tidy spacing and digits, keep the brief's own spelling.
function tidy(text) {
  return text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ");
}
// For matching only: also fold the alef forms (أ إ آ → ا).
function normalize(text) {
  return tidy(text).replace(/[إأآ]/g, "ا");
}

// ---- Splitting into roles --------------------------------------------
const ROLE_HEAD = /^\s*(?:(?:role|character|char\.?|part|cast(?:ing)?\s*for|extras?|background)\b|الدور|دور|الشخصية|شخصية|كومبارس)\s*(?:#|no\.?|رقم)?\s*\d*\s*[:\-–—.)]?\s*(.*)$/i;
const NUMBERED = /^\s*(\d{1,2})\s*[.)\-–]\s*(.{2,60})$/;
const CAPS_NAME = /^\s*([A-Z][A-Z .'’-]{1,30})(?:\s*[(:\-–—]|$)/;

function splitRoles(text) {
  const lines = text.split("\n");
  const blocks = [];
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let name = null;
    const head = line.match(ROLE_HEAD);
    if (head) name = head[1] || line;
    else if (NUMBERED.test(line) && line.length < 70) name = line.match(NUMBERED)[2];
    else if (CAPS_NAME.test(line) && line === line.toUpperCase() && line.length <= 60 && /[A-Z]{2}/.test(line)) name = line;
    if (name) {
      current = { name: cleanName(name), lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      (blocks.intro ||= []).push(line);
    }
  }
  return blocks;
}

// "First: Karim" / "الاول: كريم" → "Karim" / "كريم".
const ORDINAL = /^(?:first|second|third|fourth|fifth|lead|main|supporting|الاول|الأول|التاني|الثاني|التالت|الثالث|الرابع|الخامس|الرئيسي)\s*[:\-–—]\s*(?=\S)/i;

function cleanName(s) {
  return s
    .replace(ORDINAL, "")
    .replace(/\s*[:\-–—]\s*$/, "")
    .split(/[,:\-–—(]/)[0]
    .trim()
    .slice(0, 60) || "Role";
}

// ---- Traits ------------------------------------------------------------
// \b only works on Latin letters; Arabic words need their own edges.
const AR = (words) => `(?:^|[\\s،,.:(/-])(?:${words})(?=$|[\\s،,.:)/-])`;

// Extra ways briefs say things, mapped to ON's stored values.
const SYNONYMS = {
  gender: [
    ["Female", new RegExp(`\\b(female|woman|women|girl|lady|actress|mother|mom|wife|sister|daughter|she)\\b|${AR("انثى|ست|سيدة|بنت|فتاة|ممثلة|ام|الام|زوجة|اخت|البنت|الست")}`, "i")],
    ["Male", new RegExp(`\\b(male|man|men|boy|guy|father|dad|husband|brother|son|he)\\b|${AR("ذكر|راجل|رجل|شاب|ولد|الاب|اب|زوج|اخ|الراجل|الشاب|الولد")}`, "i")],
  ],
  build: [
    ["Slim", /\b(slim|thin|skinny|lean|slender)\b|رفيع|نحيف/i],
    ["Athletic", /\b(athletic|fit|sporty|toned)\b|رياضي/i],
    ["Muscular", /\b(muscular|buff|bodybuilder|strong build)\b|عضلي|مفتول/i],
    ["Average", /\b(average build|medium build|regular build)\b/i],
    ["Curvy", /\bcurvy\b/i],
    ["Plus size", /\b(plus[- ]size|heavy|heavyset|chubby|overweight|big guy|large build|stocky)\b|تخين|ممتلئ|مليان/i],
  ],
  hair: [
    ["Bald", /\b(bald|shaved head)\b|اصلع/i],
    ["Blonde", /\b(blonde?|fair hair)\b|اشقر|شقرا/i],
    ["Grey", /\b(gr[ae]y|white|silver)[- ]hair(ed)?\b|شعر ابيض|شايب/i],
    ["Red", /\b(red|ginger)[- ]hair(ed)?\b/i],
    ["Black", /\bblack[- ]hair(ed)?\b|شعر اسود/i],
    ["Brown", /\bbrown[- ]hair(ed)?\b|شعر بني/i],
  ],
  eyes: [
    ["Green", /\bgreen[- ]eye[sd]?\b|عيون خضرا|عينين خضر/i],
    ["Blue", /\bblue[- ]eye[sd]?\b|عيون زرقا/i],
    ["Hazel", /\bhazel\b|عسلي/i],
  ],
  languages: [
    ["English", /\b(english|fluent english|native english)\b|انجليزي|انجلش/i],
    ["Arabic", /\barabic\b|عربي/i],
    ["French", /\bfrench\b|فرنساوي|فرنسي/i],
  ],
  accents: [
    ["Cairene", /\b(cairene|cairo accent|cairo dialect|masri)\b|قاهري|مصري/i],
    ["Sa'idi", /\b(sa'?idi|saidi|upper egypt(ian)?)\b|صعيدي|صعايدة/i],
    ["Alexandrian", /\b(alexandrian|alex accent)\b|اسكندراني/i],
    ["Fusha (MSA)", /\b(fusha|fus7a|msa|classical arabic|standard arabic)\b|فصحى|فصحي/i],
    ["Gulf", /\b(gulf|khaleeji|saudi)\b|خليجي/i],
    ["Levantine", /\b(levantine|shami|syrian|lebanese)\b|شامي/i],
    ["Bedouin", /\b(bedouin|bedu)\b|بدوي/i],
    ["Fellahi", /\b(fellahi|rural accent|village accent)\b|فلاحي/i],
    ["Nubian", /\bnubian\b|نوبي/i],
  ],
  skills: [
    ["Singing", /\b(sing|singer|singing|vocals?)\b|غنا|بيغني|بتغني|يغني|تغني|مطرب/i],
    ["Belly dance", /\bbelly ?danc\w*\b|رقص شرقي/i],
    ["Contemporary dance", /\bcontemporary\b|رقص معاصر/i],
    ["Swimming", /\bswim\w*\b|سباحة|عوم/i],
    ["Driving", /\b(driv(e|ing|er'?s?) ?licen[cs]e|can drive|driving)\b|سواقة|رخصة/i],
    ["Horse riding", /\b(horse ?riding|ride horses?|equestrian)\b|ركوب خيل/i],
    ["Football", /\b(football|soccer)\b|كورة/i],
    ["Martial arts", /\b(martial arts?|karate|kung ?fu|taekwondo|judo|mma)\b|كاراتيه|فنون قتالية/i],
    ["Boxing", /\bbox(ing|er)\b|بوكس|ملاكمة/i],
    ["Stage combat", /\b(stage combat|fight scenes?|stunts?)\b/i],
    ["Improv", /\bimprov\w*\b|ارتجال/i],
    ["Comedy", /\b(comed\w+|comic|funny|humou?r)\b|كوميدي|دمه خفيف|دمها خفيف|بيضحك/i],
    ["Gymnastics", /\bgymnast\w*\b|جمباز/i],
    ["Skateboarding", /\bskate\w*\b|سكيت/i],
    ["Cycling", /\b(cycl\w+|bike)\b|عجل/i],
    ["Motorbike", /\b(motorbike|motorcycle)\b|موتوسيكل/i],
  ],
  categories: [
    ["Model", /\bmodel(s|ing)?\b|موديل/i],
    ["Voice actor", /\b(voice[- ]?over|vo artist|voice actor)\b|فويس اوفر|تعليق صوتي/i],
    ["Extra", /\b(extras?|background|crowd)\b|كومبارس/i],
    ["Presenter", /\b(presenter|host|anchor)\b|مذيع|مقدم/i],
    ["Dancer", /\b(dancers?|danc(e|ing)|choreograph\w*)\b|راقص|يرقص|ترقص|بيرقص|بترقص|رقص/i],
    ["Influencer", /\b(influencer|content creator)\b|انفلونسر/i],
    ["Actor", /\b(actor|actress|acting)\b|ممثل/i],
  ],
};

function vocabPatterns(list) {
  return list.map((v) => {
    const en = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const ar = AR_OPT[v] ? normalize(AR_OPT[v]) : null;
    return [v, (text) => en.test(text) || (ar && ar.length > 2 && text.includes(ar))];
  });
}

const VOCAB = {
  categories: vocabPatterns(CATEGORIES),
  skills: vocabPatterns(SKILLS),
  languages: vocabPatterns(LANGUAGES),
  accents: vocabPatterns(ACCENTS),
  build: vocabPatterns(BUILDS.filter((b) => b !== "Average")),
};

function ageRange(text) {
  const t = text.toLowerCase();
  let m = t.match(/(\d{1,2})\s*(?:-|–|—|to|الى|لـ|ل)\s*(\d{1,2})\s*(?:years|yrs|yo|y\.o|سنة|سنه|عام)?/);
  if (m && +m[1] < +m[2] && +m[2] <= 90 && /age|years|yrs|yo|y\.o|playing|سن|عمر|سنة|سنه|عام/.test(t)) return { min: +m[1], max: +m[2] };
  if (m && +m[1] >= 3 && +m[1] < +m[2] && +m[2] <= 90 && +m[2] - +m[1] <= 25) return { min: +m[1], max: +m[2] };
  m = t.match(/\b(early|mid|late)[- ]?(\d)0s\b/);
  if (m) {
    const base = +m[2] * 10;
    return m[1] === "early" ? { min: base, max: base + 4 } : m[1] === "mid" ? { min: base + 3, max: base + 7 } : { min: base + 5, max: base + 9 };
  }
  m = t.match(/\b(\d)0s\b/);
  if (m) return { min: +m[1] * 10, max: +m[1] * 10 + 9 };
  const decades = [["عشرين", 20], ["تلاتين", 30], ["ثلاثين", 30], ["اربعين", 40], ["خمسين", 50], ["ستين", 60]];
  for (const [w, base] of decades) if (t.includes(w + "ات")) return { min: base, max: base + 9 };
  m = t.match(/(?:age|aged|عمره|عمرها|سنه|سنها|سن)\s*[:\-]?\s*(\d{1,2})\b/) || t.match(/\b(\d{1,2})\s*(?:years? old|yo|y\.o|سنة|سنه)\b/);
  if (m) return { min: Math.max(1, +m[1] - 2), max: +m[1] + 2 };
  if (/\b(teen|teenager)\b|مراهق/.test(t)) return { min: 13, max: 19 };
  if (/\b(kid|child)\b|طفل/.test(t)) return { min: 6, max: 12 };
  return null;
}

function height(text) {
  let m = text.match(/(1)[.,](\d{2})\s*m\b/i);
  if (m) return +`${m[1]}${m[2]}`;
  m = text.match(/\b(1[4-9]\d|2[0-2]\d)\s*(?:cm|سم)/i);
  if (m) return +m[1];
  if (/\b(tall|very tall)\b|طويل/i.test(text)) return { min: 180, max: 200 };
  if (/\b(short)\b|قصير/i.test(text)) return { min: 150, max: 168 };
  return null;
}

// Traits in one block of brief text.
export function readTraits(block) {
  const text = normalize(block);
  const traits = [];
  const add = (type, value) => {
    if (!traits.some((t) => t.type === type && JSON.stringify(t.value) === JSON.stringify(value))) traits.push({ type, value });
  };

  // Gender: only when one side is clearly meant.
  const female = SYNONYMS.gender[0][1].test(text);
  const male = SYNONYMS.gender[1][1].test(text);
  if (female !== male) add("gender", female ? "Female" : "Male");

  const age = ageRange(text);
  if (age) add("age", age);
  const h = height(text);
  if (h) add("height", typeof h === "number" ? { min: h - 3, max: h + 3 } : h);

  for (const type of ["build", "hair", "eyes", "languages", "accents", "skills", "categories"]) {
    for (const [value, re] of SYNONYMS[type] || []) if (re.test(text)) add(type, value);
    for (const [value, test] of VOCAB[type] || []) if (test(text)) add(type, value);
  }
  // A city, unless it's only naming an accent ("Cairo accent", "قاهري").
  for (const city of CITIES) {
    const ar = AR_OPT[city] ? normalize(AR_OPT[city]) : null;
    const en = new RegExp(`\\b${city}\\b(?!\\s*(?:accent|dialect))`, "i");
    if (en.test(text) || (ar && new RegExp(AR(ar)).test(text))) add("city", city);
  }

  // "Actor" is the default kind of role; keep it only if nothing more specific is there.
  const specific = traits.some((t) => t.type === "categories" && t.value !== "Actor");
  return specific ? traits.filter((t) => !(t.type === "categories" && t.value === "Actor")) : traits;
}

export function readBrief(text) {
  const blocks = splitRoles(tidy(text));
  const roles = blocks.map((b, i) => ({
    id: crypto.randomUUID(),
    name: b.name || `Role ${i + 1}`,
    notes: b.lines.slice(1).join(" ").slice(0, 600),
    traits: readTraits(b.lines.join("\n")),
    picks: [],
  }));
  if (roles.length) return roles;
  return [{ id: crypto.randomUUID(), name: "Main role", notes: tidy(text).slice(0, 600), traits: readTraits(text), picks: [] }];
}

export function briefTitle(text, fallback) {
  const first = tidy(text)
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 3 && l.length < 90 && !ROLE_HEAD.test(l));
  return (first || fallback || "New board").slice(0, 120);
}
