export function Footer() {
  return (
    <footer className="border-t border-border-on-inverse bg-surface-inverse px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-container flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 font-mono text-micro uppercase tracking-mono text-text-on-inverse-muted">
          <span>aboustate.tech</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </span>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <span className="font-mono text-micro uppercase tracking-mono text-text-on-inverse-muted">
            Contact us
          </span>
          <a
            href="mailto:studio@aboustate.tech"
            className="font-body text-small text-text-on-inverse-muted transition-colors duration-150 hover:text-accent"
          >
            studio@aboustate.tech
          </a>
          <a
            href="tel:+201501538408"
            className="font-body text-small text-text-on-inverse-muted transition-colors duration-150 hover:text-accent"
          >
            +20 150 153 8408
          </a>
        </div>
      </div>
    </footer>
  );
}
