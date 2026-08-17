export function ServiceCard({ service, selected, onSelectForQuote }) {
  return (
    <div className="group relative mb-4 break-inside-avoid overflow-hidden rounded-md border border-border-subtle bg-surface-card p-5 transition-shadow duration-150 sm:p-6 sm:hover:shadow-md">
      <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-accent">
        {service.category}
      </div>
      <h3 className="font-display text-h3 font-semibold tracking-tight text-text-primary">
        {service.name}
      </h3>
      <p className="mt-2 font-body text-small leading-body text-text-secondary">
        {service.description}
      </p>

      {/* Touch devices: no hover, so the action is always reachable. */}
      <button
        type="button"
        onClick={() => onSelectForQuote(service.id)}
        className="mt-4 w-full rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 sm:hidden"
      >
        {selected ? "Added to quote ✓" : "Select for Quote"}
      </button>

      {/* Pointer devices: reveal-on-hover overlay. */}
      <div
        className={[
          "absolute inset-0 hidden items-end justify-start bg-surface-inverse/90 p-6 opacity-0 transition-opacity duration-150 sm:flex",
          "group-hover:opacity-100 group-focus-within:opacity-100",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => onSelectForQuote(service.id)}
          className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
        >
          {selected ? "Added to quote ✓" : "Select for Quote"}
        </button>
      </div>
    </div>
  );
}
