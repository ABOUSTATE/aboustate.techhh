import { useEffect, useState } from "react";
import { PasscodeGate } from "./PasscodeGate.jsx";
import { BriefForm } from "./BriefForm.jsx";

export default function BriefPage() {
  const [session, setSession] = useState(null); // { code, clientName } | null
  const [referenceNumber, setReferenceNumber] = useState(null);

  useEffect(() => {
    document.title = "Project brief — aboustate.tech";
  }, []);

  if (!session) {
    return <PasscodeGate onUnlocked={(code, clientName) => setSession({ code, clientName })} />;
  }

  if (referenceNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-page px-4">
        <div className="w-full max-w-[440px] rounded-md border border-border-subtle bg-surface-card p-8 text-center">
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
          <h1 className="font-display text-h2 font-bold tracking-tight text-text-primary">
            Brief received.
          </h1>
          <p className="mt-3 font-body text-body text-text-secondary">
            Your reference number is
          </p>
          <p className="mt-1 font-mono text-h3 font-bold text-text-accent">{referenceNumber}</p>
          <p className="mt-4 font-body text-small text-text-secondary">
            Quote this in any follow-up emails. Our team will review and reach out with next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <BriefForm
        code={session.code}
        clientName={session.clientName}
        onSubmitted={(ref) => setReferenceNumber(ref)}
      />
    </div>
  );
}
