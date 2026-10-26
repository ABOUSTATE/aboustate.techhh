import { useEffect, useRef, useState } from "react";
import { hasChosenLang, useLang } from "../lib/i18n.jsx";
import { Wordmark } from "./ui.jsx";

const CHOICES = [
  { lang: "ar", slate: "01 / AR", name: "عربي", note: "مصري، زي ما بنتكلم", dir: "rtl" },
  { lang: "en", slate: "02 / EN", name: "English", note: "Everything in English", dir: "ltr" },
];

// First visit only: a full-screen "slate" asking which language to use.
// Written in both languages on purpose, since we don't know which one the
// visitor reads yet. Escape or the corner link keeps Arabic.
export function LangPicker() {
  const { setLang } = useLang();
  const [open, setOpen] = useState(() => !hasChosenLang());
  const [leaving, setLeaving] = useState(null);
  const first = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    first.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === "Escape" && choose("ar");
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function choose(lang) {
    if (leaving) return;
    setLeaving(lang);
    // Let the exit animation play, then switch (switching remounts the app).
    setTimeout(() => {
      setOpen(false);
      setLang(lang);
    }, 380);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="on-lang-title"
      className={`on-lang fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-green-950 px-4 py-8 ${leaving ? "on-lang--out" : ""}`}
    >
      <div className="bg-pattern-dots-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="on-lang__glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-[640px] text-center">
        <div className="on-rise flex justify-center" style={{ animationDelay: "60ms" }}>
          <Wordmark light className="!text-display-l" />
        </div>

        <div className="on-rise mt-5 inline-flex items-center gap-2 rounded-pill border border-green-700 px-3 py-1" style={{ animationDelay: "160ms" }}>
          <span className="h-2 w-2 animate-pulse rounded-pill bg-accent" />
          <span className="font-mono text-micro uppercase tracking-mono text-mint-300" dir="ltr">
            Casting · كاستينج
          </span>
        </div>

        <h2 id="on-lang-title" className="on-rise m-0 mt-5 font-display text-h1 font-bold text-beige-100" style={{ animationDelay: "240ms" }}>
          <span lang="ar" dir="rtl" className="block">
            أهلًا بيك
          </span>
          <span lang="en" dir="ltr" className="block text-h2 font-semibold text-mint-300">
            Welcome
          </span>
        </h2>
        <p className="on-rise mb-0 mt-3 font-body text-body text-green-300" style={{ animationDelay: "300ms" }}>
          <span lang="ar">اختار اللغة</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span lang="en">Choose your language</span>
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2" dir="rtl">
          {CHOICES.map((c, i) => (
            <button
              key={c.lang}
              ref={i === 0 ? first : undefined}
              type="button"
              lang={c.lang}
              dir={c.dir}
              onClick={() => choose(c.lang)}
              className={`on-rise on-lang__card group relative overflow-hidden rounded-lg border p-5 text-start transition-all duration-200 ${
                leaving === c.lang ? "border-accent bg-green-900" : "border-green-700 bg-green-900/60 hover:-translate-y-1 hover:border-accent hover:bg-green-900"
              }`}
              style={{ animationDelay: `${380 + i * 90}ms` }}
            >
              <span className="flex items-center justify-between">
                <span className="font-mono text-micro uppercase tracking-mono text-green-300" dir="ltr">
                  {c.slate}
                </span>
                <span
                  className={`h-3 w-3 rounded-pill border transition-colors duration-200 ${
                    leaving === c.lang ? "border-accent bg-accent" : "border-green-500 group-hover:border-accent group-hover:bg-accent"
                  }`}
                />
              </span>
              <span className="mt-6 block font-display text-display-l font-bold leading-tight text-beige-100">{c.name}</span>
              <span className="mt-1 block font-body text-small text-mint-300">{c.note}</span>
              <span className="on-lang__sweep pointer-events-none absolute inset-y-0 w-1/3" aria-hidden="true" />
            </button>
          ))}
        </div>

        <p className="on-rise mb-0 mt-6 font-body text-micro text-green-300" style={{ animationDelay: "620ms" }}>
          <span lang="ar">تقدر تغيّرها في أي وقت من فوق</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span lang="en">You can switch any time from the top bar</span>
        </p>
      </div>
    </div>
  );
}
