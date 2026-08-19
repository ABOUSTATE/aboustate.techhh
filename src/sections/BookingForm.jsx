import { useEffect, useState } from "react";
import { SERVICES } from "../data/services.js";
import { SuccessModal } from "../components/SuccessModal.tsx";
import { getRandomLoadingLine } from "../data/quoteJokes.js";

const REQUEST_SERVICE_URL = "/api/request-service";

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
  const [website, setWebsite] = useState(""); // honeypot — real users never see or fill this
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [loadingLine, setLoadingLine] = useState("Sending...");

  useEffect(() => {
    if (status !== "loading") return;
    setLoadingLine(getRandomLoadingLine());
    const interval = setInterval(() => setLoadingLine(getRandomLoadingLine()), 1200);
    return () => clearInterval(interval);
  }, [status]);

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
    setWebsite("");
    setSelectedServiceIds([]);
    setStatus("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Honeypot: real users never fill this out. Bots that fill every field
    // trip it — pretend success so they don't learn to skip it.
    if (website) {
      setStatus("success");
      return;
    }

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
      website, // honeypot, checked server-side too
    };

    try {
      // Optional: if the visitor is signed in, attach their session so the
      // request links to their account. Submitting without an account works
      // exactly the same either way. Supabase is loaded lazily here so its
      // SDK never ships in the main landing-page bundle.
      const { supabase } = await import("../lib/supabaseClient.js");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(REQUEST_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "request_failed");
      setStatus("success");
    } catch (error) {
      setStatus("error");
    }
  }

  return (
    <section id="quote-form" className="bg-surface-page px-4 py-14 sm:px-6 sm:py-20">
      <SuccessModal open={status === "success"} onClose={resetForm} />
      <div className="mx-auto max-w-[720px]">
        <div className="mb-2 font-mono text-micro uppercase tracking-mono text-text-secondary">
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
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

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
              ? loadingLine
              : mode === "quotation"
              ? "Request Quotation"
              : "Request Appointment"}
          </button>
        </form>
      </div>
    </section>
  );
}
