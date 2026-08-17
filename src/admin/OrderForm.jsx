import { useState } from "react";
import { SERVICES } from "../data/services.js";

const TIMELINE_OPTIONS = ["ASAP", "1–3 months", "3–6 months", "Flexible"];
const STATUS_OPTIONS = ["New", "Contacted", "Won", "Lost"];

export function OrderForm({ userId, userEmail, onCreated, onCancel }) {
  const [type, setType] = useState("appointment");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [phone, setPhone] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [timeline, setTimeline] = useState(TIMELINE_OPTIONS[0]);
  const [isStudentProject, setIsStudentProject] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleService(name) {
    setSelectedServices((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          email,
          phone,
          projectDescription,
          timeline,
          isStudentProject,
          services: type === "quotation" ? selectedServices : [],
          status,
          notes,
          userId: userId || null,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      onCreated();
    } catch {
      setError("Couldn't create that order. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-md border border-border-subtle bg-surface-card p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-h3 font-bold text-text-primary">
          {userEmail ? `New order for ${userEmail}` : "New order"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="font-body text-small text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            <option value="appointment">Appointment</option>
            <option value="quotation">Quotation</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
          Project description
        </label>
        <textarea
          rows={3}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          className="w-full resize-none rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">Timeline</label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            {TIMELINE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2.5">
          <input
            type="checkbox"
            checked={isStudentProject}
            onChange={(e) => setIsStudentProject(e.target.checked)}
            className="h-4 w-4 rounded-xs border border-border-subtle accent-accent"
          />
          <span className="font-body text-small text-text-primary">Student project</span>
        </label>
      </div>

      {type === "quotation" && (
        <div className="mb-4">
          <label className="mb-2 block font-body text-small font-semibold text-text-primary">Services</label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((service) => {
              const isSelected = selectedServices.includes(service.name);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.name)}
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
        </div>
      )}

      <div className="mb-5">
        <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
          Internal notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-sm bg-accent px-6 py-2.5 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Creating…" : "Create order"}
      </button>
    </form>
  );
}
