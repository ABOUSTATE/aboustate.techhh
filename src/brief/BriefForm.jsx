import { useEffect, useState } from "react";
import { Field } from "./Field.jsx";
import { getRandomLoadingLine } from "../data/quoteJokes.js";
import {
  SERVICE_OPTIONS,
  CONTACT_SECTION,
  OVERVIEW_SECTION,
  SERVICE_SECTIONS,
  ASSETS_SECTION,
  TIMELINE_SECTION,
  BUDGET_SECTION,
  LEGAL_SECTION,
  FINAL_SECTION,
} from "./briefSchema.js";

function Section({ section, values, onFieldChange }) {
  return (
    <section className="mb-10">
      <h2 className="mb-5 border-b border-border-subtle pb-3 font-display text-h3 font-bold text-text-primary">
        {section.title}
      </h2>
      <div className="flex flex-col gap-5">
        {section.rows.map((row, i) => (
          <div
            key={i}
            className={row.length > 1 ? `grid grid-cols-1 gap-5 sm:grid-cols-${row.length}` : ""}
          >
            {row.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(v) => onFieldChange(field.name, v)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function BriefForm({ code, clientName, onSubmitted }) {
  const [values, setValues] = useState({ service: [] });
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [error, setError] = useState("");
  const [loadingLine, setLoadingLine] = useState("Submitting…");

  useEffect(() => {
    if (status !== "submitting") return;
    setLoadingLine(getRandomLoadingLine());
    const interval = setInterval(() => setLoadingLine(getRandomLoadingLine()), 1200);
    return () => clearInterval(interval);
  }, [status]);

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function toggleService(value) {
    setValues((prev) => {
      const current = Array.isArray(prev.service) ? prev.service : [];
      return {
        ...prev,
        service: current.includes(value) ? current.filter((s) => s !== value) : [...current, value],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!values.consent_contact) {
      setError("Please check the consent box to continue.");
      return;
    }
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/brief/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, data: values }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "submit_failed");
      onSubmitted(result.referenceNumber, values);
    } catch {
      setError("Couldn't submit the brief. Check your connection and try again.");
      setStatus("idle");
    }
  }

  const selectedServices = Array.isArray(values.service) ? values.service : [];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[820px] px-4 py-12 sm:px-6">
      <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-accent">
        Project brief
      </div>
      <h1 className="mb-2 font-display text-h1 font-bold tracking-tight text-text-primary">
        {clientName ? `Welcome, ${clientName}.` : "Tell us about your project."}
      </h1>
      <p className="mb-10 font-body text-body-l text-text-secondary">
        The more detail you give us here, the fewer follow-up rounds we'll need before we start.
      </p>

      <Section section={CONTACT_SECTION} values={values} onFieldChange={setField} />
      <Section section={OVERVIEW_SECTION} values={values} onFieldChange={setField} />

      <section className="mb-10">
        <h2 className="mb-2 border-b border-border-subtle pb-3 font-display text-h3 font-bold text-text-primary">
          3. Services needed
        </h2>
        <p className="mb-4 font-body text-small text-text-secondary">
          Select all that apply. Each selection reveals its own detailed section below.
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          {SERVICE_OPTIONS.map((opt) => {
            const isSelected = selectedServices.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleService(opt.value)}
                aria-pressed={isSelected}
                className={[
                  "rounded-sm border px-4 py-2.5 font-body text-small font-semibold transition-colors duration-150",
                  isSelected
                    ? "border-accent bg-accent text-green-950"
                    : "border-border-subtle text-text-primary hover:border-accent hover:text-text-accent",
                ].join(" ")}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {SERVICE_SECTIONS.filter((s) => selectedServices.includes(s.serviceKey)).map((section) => (
        <div key={section.id} className="mb-10 border-l-2 border-accent pl-5">
          <Section section={section} values={values} onFieldChange={setField} />
        </div>
      ))}

      <Section section={ASSETS_SECTION} values={values} onFieldChange={setField} />
      <Section section={TIMELINE_SECTION} values={values} onFieldChange={setField} />
      <Section section={BUDGET_SECTION} values={values} onFieldChange={setField} />
      <Section section={LEGAL_SECTION} values={values} onFieldChange={setField} />
      <Section section={FINAL_SECTION} values={values} onFieldChange={setField} />

      <label className="mb-6 flex items-start gap-3 rounded-sm border border-border-subtle bg-surface-card p-4">
        <input
          type="checkbox"
          checked={Boolean(values.consent_contact)}
          onChange={(e) => setField("consent_contact", e.target.checked)}
          className="mt-1 h-4 w-4 accent-accent"
        />
        <span className="font-body text-small text-text-primary">
          I agree to be contacted about this project and understand this information will be shared
          with the aboustate.tech team. <span className="text-mint-700">*</span>
        </span>
      </label>

      {error && (
        <div className="mb-6 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-sm bg-accent px-6 py-3.5 font-body text-body font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? loadingLine : "Submit brief"}
      </button>
    </form>
  );
}
