import { useRef } from "react";
import { getHeroEyebrow } from "../lib/seasonalCopy.js";

export function Hero({ onGetQuoteClick }) {
  const sectionRef = useRef(null);
  const eyebrow = getHeroEyebrow();

  function handleMouseMove(event) {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    section.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
    section.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden bg-surface-inverse px-4 py-16 text-text-on-inverse sm:px-6 sm:py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 motion-reduce:hidden hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(144,180,149,0.14), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-container">
        <div className="mb-4 font-mono text-micro uppercase tracking-mono text-accent">
          {eyebrow}
        </div>
        <h1 className="max-w-[16ch] font-display text-display-xl font-extrabold leading-tight tracking-tight">
          Narrative, compiled — for brands that build.
        </h1>
        <p className="mt-6 max-w-[560px] font-body text-body-l leading-body text-text-on-inverse-muted">
          Media production, post, and digital marketing run on one pipeline.
          One team, one spec, one delivery — from first frame to final report.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onGetQuoteClick}
            className="w-full rounded-sm bg-accent px-6 py-3 text-center font-body text-small font-semibold text-green-950 shadow-sm transition-colors duration-150 hover:bg-mint-700 sm:w-auto"
          >
            Get a Quote
          </button>
          <a
            href="#services"
            className="w-full rounded-sm border border-border-on-inverse px-6 py-3 text-center font-body text-small font-semibold text-text-on-inverse transition-colors duration-150 hover:border-accent hover:text-accent sm:w-auto"
          >
            See our services
          </a>
        </div>
      </div>
    </section>
  );
}
