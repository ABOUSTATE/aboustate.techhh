export function Hero() {
  return (
    <section className="bg-surface-inverse px-4 py-16 text-text-on-inverse sm:px-6 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-container">
        <div className="mb-4 font-mono text-micro uppercase tracking-mono text-accent">
          Technical creative house
        </div>
        <h1 className="max-w-[16ch] font-display text-display-xl font-extrabold leading-tight tracking-tight">
          Narrative, compiled — for brands that build.
        </h1>
        <p className="mt-6 max-w-[560px] font-body text-body-l leading-body text-text-on-inverse-muted">
          Media production, post, and digital marketing run on one pipeline.
          One team, one spec, one delivery — from first frame to final report.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#quote-form"
            className="w-full rounded-sm bg-accent px-6 py-3 text-center font-body text-small font-semibold text-green-950 shadow-sm transition-colors duration-150 hover:bg-mint-700 sm:w-auto"
          >
            Get a Quote
          </a>
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
