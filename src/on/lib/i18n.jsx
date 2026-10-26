import { Fragment, createContext, useContext, useEffect, useState } from "react";
import { AR, AR_OPT } from "./ar.js";

// ON speaks Egyptian Arabic first (it's built for the Egyptian market) and
// English second. Strings are written in English in the code and looked up
// in ar.js; anything missing falls back to English rather than breaking.
// Values stored in the database (skills, cities, genders...) stay English
// so search and filters work the same in both languages; `opt` only
// changes how they're shown.

const KEY = "on:lang";
const TITLES = { ar: "ON | الكاستينج بقى أونلاين", en: "ON | Casting, online" };

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    /* storage blocked: use the default */
  }
  return "ar";
}

let current = initialLang();

function applyToDocument(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = TITLES[lang];
}
applyToDocument(current);

export function tr(text, vars) {
  let out = current === "ar" ? AR[text] ?? text : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  return out;
}

export function opt(value) {
  if (!value) return value;
  return current === "ar" ? AR_OPT[value] ?? value : value;
}

const LangContext = createContext({ lang: current, setLang: () => {} });

// Switching language remounts the app below this provider so every string
// is read again; the signed-in session (held above it) is kept.
export function LangProvider({ children }) {
  const [lang, setLangState] = useState(current);
  useEffect(() => applyToDocument(lang), [lang]);
  const setLang = (next) => {
    current = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* not remembered, still switches */
    }
    setLangState(next);
  };
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <Fragment key={lang}>{children}</Fragment>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
