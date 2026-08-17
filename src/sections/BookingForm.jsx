import { useState } from "react";
import { SERVICES } from "../data/services.js";
import { SuccessModal } from "../components/SuccessModal.tsx";

// Google Apps Script Web App /exec URL — see google-apps-script/README.md to deploy.
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyMC7Wj56Wc8XH2CQdlpo3wUQ0Jj9fDxuemeWMWTNPRZy1Gs3U6HTb3x9y-xxbPBA/exec";

const TIMELINE_OPTIONS = ["ASAP", "1–3 months", "3–6 months", "Flexible"];

const OTHER_SERVICE_ID = "other";
const SELECTABLE_SERVICES = [
  ...SERVICES,
  { id: OTHER_SERVICE_ID, name: "Other" },
];

export function BookingForm({ mode, setMode, selectedServiceIds, setSelectedServiceIds }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [otherServiceDescription, setOtherServiceDescription] = useState("");
  const [timeline, setTimeline] = useState(TIMELINE_OPTIONS[0]);
  const [isStudentProject, setIsStudentProject] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const isOtherSelected = selectedServiceIds.includes(OTHER_SERVICE_ID);

  function toggleService(id) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setProjectDescription("");
    setOtherServiceDescription("");
    setTimeline(TIMELINE_OPTIONS[0]);
    setIsStudentProject(false);
    setSelectedServiceIds([]);
    setStatus("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");

    const payload = {
      type: mode,
      name,
      email,
      phone,
      projectDescription,
      timeline,
      isStudentProject,
      services:
        mode === "quotation"
          ? SELECTABLE_SERVICES.filter((s) => selectedServiceIds.includes(s.id)).map(
              (s) => s.name
            )
          : [],
      otherServiceDescription:
        mode === "quotation" && isOtherSelected ? otherServiceDescription : "",
      submittedAt: new Date().toISOString(),
    };

    try {
      // Apps Script web apps don't send CORS headers, so the response is
      // opaque (mode: "no-cors") — a resolved fetch means the request went
      // out, not that the script's own logic succeeded. See
      // google-apps-script/README.md for the tradeoffs and an alternative.
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setStatus("success");
    } catch (error) {
      setStatus("error");
    }
  }

  return (
    <section id="quote-form" className="bg-surface-page px-4 py-14 sm:px-6 sm:py-20">
      <SuccessModal open={status === "success"} onClose={resetForm} />
      <div className="mx-auto max-w-[720px]">
        <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-accent">
          Start a project
        </div>
        <h2 className="mb-8 font-display text-h1 font-bold tracking-tight text-text-primary">
          Book a call or request a quote.
        </h2>

        <div className="mb-8 flex w-full rounded-sm border border-border-subtle bg-surface-card p-1 sm:inline-flex sm:w-auto">
          {[
            { key: "appointment", label: "Request Appointment" },
            { key: "quotation", label: "Get a Quotation" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              className={[
                "flex-1 rounded-sm px-3 py-2 font-body text-small font-semibold transition-colors duration-150 sm:flex-none sm:px-4",
                mode === option.key
                  ? "bg-accent text-green-950"
                  : "text-text-secondary hover:text-text-accent",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-border-subtle bg-surface-card p-5 sm:p-8"
        >
          {mode === "quotation" && (
            <div className="mb-6">
              <label className="mb-2 block font-body text-small font-semibold text-text-primary">
                Services needed
              </label>
              <div className="flex flex-wrap gap-2">
                {SELECTABLE_SERVICES.map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      aria-pressed={isSelected}
                      className={[
                        "rounded-pill border px-3 py-1.5 font-body text-small transition-colors duration-150",
                        isSelected
                          ? "border-accent bg-accent text-green-950"
                          : "border-border-subtle text-text-secondary hover:border-accent hover:text-text-accent",
                      ].join(" ")}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>

              {isOtherSelected && (
                <div className="mt-4">
                  <label
                    htmlFor="other-service"
                    className="mb-1.5 block font-body text-small font-semibold text-text-primary"
                  >
                    Describe the service you need
                  </label>
                  <textarea
                    id="other-service"
                    required
                    rows={3}
                    value={otherServiceDescription}
                    onChange={(e) => setOtherServiceDescription(e.target.value)}
                    className="w-full resize-none rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="name" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="description" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
              Project description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="w-full resize-none rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div className="mt-5">
            <label htmlFor="timeline" className="mb-1.5 block font-body text-small font-semibold text-text-primary">
              Timeline
            </label>
            <select
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2.5 font-body text-body text-text-primary outline-none focus:border-accent"
            >
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <label htmlFor="student-project" className="mt-5 flex cursor-pointer items-center gap-2.5">
            <input
              id="student-project"
              type="checkbox"
              checked={isStudentProject}
              onChange={(e) => setIsStudentProject(e.target.checked)}
              className="h-4 w-4 rounded-xs border border-border-subtle accent-accent"
            />
            <span className="font-body text-small text-text-primary">
              Is this a student project?
            </span>
          </label>

          {status === "error" && (
            <div className="mt-5 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
              Something went wrong sending your request. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 w-full rounded-sm bg-accent px-6 py-3 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading"
              ? "Sending..."
              : mode === "quotation"
              ? "Request Quotation"
              : "Request Appointment"}
          </button>
        </form>
      </div>
    </section>
  );
}
