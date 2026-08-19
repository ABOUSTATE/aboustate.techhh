import { useEffect } from "react";

const NOT_FOUND_LINES = [
  "This page got cut in the edit.",
  "404: scene missing from the final delivery.",
  "We checked the shot list. This page isn't on it.",
  "Looks like this link needs a round of revisions.",
  "This page is still in the treatment stage — never got greenlit.",
];

const line = NOT_FOUND_LINES[Math.floor(Math.random() * NOT_FOUND_LINES.length)];

export default function NotFound() {
  useEffect(() => {
    document.title = "404 — aboustate.tech";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-inverse px-4 text-center text-text-on-inverse">
      <div className="mb-4 font-mono text-micro uppercase tracking-mono text-accent">
        404
      </div>
      <h1 className="max-w-[20ch] font-display text-h1 font-bold tracking-tight">
        {line}
      </h1>
      <p className="mt-4 max-w-[440px] font-body text-body text-text-on-inverse-muted">
        The page you're looking for doesn't exist, or moved somewhere we haven't documented yet.
      </p>
      <a
        href="/"
        className="mt-8 rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
      >
        Back to the homepage
      </a>
    </div>
  );
}
