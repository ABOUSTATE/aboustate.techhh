export function Nav({ onGetQuoteClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border-on-inverse bg-surface-inverse/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-4 sm:px-6">
        <div className="font-display text-base font-bold tracking-tight text-text-on-inverse sm:text-lg">
          aboustate<span className="text-accent">.</span>tech
        </div>
        <nav className="flex items-center gap-4 sm:gap-8">
          <a
            href="#services"
            className="hidden font-body text-small text-text-on-inverse-muted hover:text-text-on-inverse sm:inline"
          >
            Services
          </a>
          <a
            href="/account"
            className="hidden font-body text-small text-text-on-inverse-muted hover:text-text-on-inverse sm:inline"
          >
            Sign in
          </a>
          <a
            href="/brief"
            className="hidden font-body text-small text-text-on-inverse-muted hover:text-text-on-inverse sm:inline"
          >
            Project brief
          </a>
          <button
            type="button"
            onClick={onGetQuoteClick}
            className="rounded-sm bg-accent px-3 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 sm:px-4"
          >
            Get a Quote
          </button>
        </nav>
      </div>
    </header>
  );
}
