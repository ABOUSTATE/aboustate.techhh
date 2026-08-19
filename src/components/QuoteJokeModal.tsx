import { useEffect } from "react";

interface QuoteJokeModalProps {
  open: boolean;
  quote: string;
  onClose: () => void;
  onContinue: () => void;
}

export function QuoteJokeModal({ open, quote, onClose, onContinue }: QuoteJokeModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-green-950/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-joke-modal-heading"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[440px] rounded-md border border-border-subtle bg-surface-card p-8 text-center shadow-lg"
      >
        <div className="mb-1 font-mono text-micro uppercase tracking-mono text-text-accent">
          Your quote
        </div>
        <h2
          id="quote-joke-modal-heading"
          className="font-display text-h3 font-bold leading-heading tracking-tight text-text-primary"
        >
          {quote}
        </h2>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
        >
          JK — take me to the real form
        </button>
      </div>
    </div>
  );
}
