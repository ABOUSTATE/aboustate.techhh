import { useEffect } from "react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function SuccessModal({ open, onClose }: SuccessModalProps) {
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
        aria-labelledby="success-modal-heading"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[440px] rounded-md border border-border-subtle bg-surface-card p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-pill bg-mint-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12.5L10 17.5L19 7.5"
              stroke="var(--mint-700)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2
          id="success-modal-heading"
          className="font-display text-h2 font-bold tracking-tight text-text-primary"
        >
          Brief Received.
        </h2>
        <p className="mt-3 font-body text-body leading-body text-text-secondary">
          Your request has been confirmed. Check your inbox—we have sent you
          an email with the next steps.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
