import { useState } from "react";

export function PasscodeGate({ onUnlocked }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | checking | invalid
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("checking");
    setError("");

    try {
      const response = await fetch("/api/brief/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!data.valid) {
        setError("That code isn't valid or has expired. Double-check it or reach out to your contact.");
        setStatus("invalid");
        return;
      }
      onUnlocked(code.trim().toUpperCase(), data.clientName);
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("invalid");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-inverse px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] rounded-md border border-border-on-inverse bg-green-950 p-8"
      >
        <div className="mb-1 font-mono text-micro uppercase tracking-mono text-accent">
          aboustate.tech
        </div>
        <h1 className="mb-2 font-display text-h2 font-bold text-text-on-inverse">
          Project brief
        </h1>
        <p className="mb-6 font-body text-small text-text-on-inverse-muted">
          Enter the access code you received after your briefing call.
        </p>

        <label
          htmlFor="brief-code"
          className="mb-1.5 block font-body text-small font-semibold text-text-on-inverse"
        >
          Access code
        </label>
        <input
          id="brief-code"
          type="text"
          autoFocus
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AB3X7QRT"
          className="w-full rounded-sm border border-border-on-inverse bg-surface-inverse px-3 py-2.5 font-mono text-body tracking-widest text-text-on-inverse outline-none focus:border-accent"
        />

        {error && <p className="mt-3 font-body text-small text-mint-300">{error}</p>}

        <button
          type="submit"
          disabled={status === "checking"}
          className="mt-6 w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "checking" ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
