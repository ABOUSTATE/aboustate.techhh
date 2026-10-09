// Company facts a visitor (or a verification reviewer) can check against other sources.
// Fill in REGISTRATION when available; the line stays hidden while it's null.
const REGISTRATION = null; // e.g. { label: "Commercial Register No.", value: "123456" }

const FACTS = [
  { label: "Founded", value: "March 2026" },
  { label: "Founder", value: "Mostafa Aboustate", href: "/portfolio" },
  { label: "Based in", value: "Cairo, Egypt" },
  { label: "Contact", value: "studio@aboustate.tech", href: "mailto:studio@aboustate.tech" },
];

export function Studio() {
  const facts = REGISTRATION ? [...FACTS, REGISTRATION] : FACTS;
  return (
    <section id="studio" className="border-t border-border-subtle bg-surface-page px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-container gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-secondary">The studio</div>
          <h2 className="mb-6 max-w-[20ch] font-display text-h1 font-bold tracking-tight text-text-primary">
            Founded in Cairo in March 2026.
          </h2>
          <p className="max-w-[56ch] font-body text-body-l leading-body text-text-secondary">
            aboustate.tech is a creative studio for media production, post-production, branding and digital
            marketing, run as one pipeline. Alongside client work we build our own tools: a client portal, a
            project brief system, automated quotations, and ON, a casting platform for talent profiles.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="https://www.linkedin.com/company/aboustate-tech/"
              target="_blank"
              rel="noopener"
              className="rounded-sm border border-border-subtle bg-surface-card px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
            >
              LinkedIn
            </a>
            <a
              href="/portfolio"
              className="rounded-sm border border-border-subtle bg-surface-card px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
            >
              Founder's work
            </a>
          </div>
        </div>

        <dl className="grid self-start content-start gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-surface-card p-5">
              <dt className="mb-1 font-mono text-micro uppercase tracking-mono text-text-secondary">{fact.label}</dt>
              <dd className="m-0 font-display text-h3 font-semibold tracking-tight text-text-primary">
                {fact.href ? (
                  <a href={fact.href} className="transition-colors duration-150 hover:text-text-accent">
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
