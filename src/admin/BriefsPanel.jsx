import { useEffect, useState } from "react";
import {
  CONTACT_SECTION,
  OVERVIEW_SECTION,
  SERVICE_SECTIONS,
  ASSETS_SECTION,
  TIMELINE_SECTION,
  BUDGET_SECTION,
  LEGAL_SECTION,
  FINAL_SECTION,
} from "../brief/briefSchema.js";

const ALL_SECTIONS = [
  CONTACT_SECTION,
  OVERVIEW_SECTION,
  ...SERVICE_SECTIONS,
  ASSETS_SECTION,
  TIMELINE_SECTION,
  BUDGET_SECTION,
  LEGAL_SECTION,
  FINAL_SECTION,
];

const STATUS_OPTIONS = ["Submitted", "Reviewed", "Archived"];

export function BriefsPanel() {
  const [innerTab, setInnerTab] = useState("submissions");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-h2 font-bold tracking-tight text-text-primary">Briefs</h1>
        <div className="flex rounded-sm border border-border-subtle bg-surface-card p-1">
          {[
            { key: "submissions", label: "Submissions" },
            { key: "codes", label: "Access codes" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setInnerTab(t.key)}
              className={[
                "rounded-sm px-4 py-1.5 font-body text-small font-semibold transition-colors duration-150",
                innerTab === t.key ? "bg-accent text-green-950" : "text-text-secondary hover:text-text-accent",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {innerTab === "submissions" ? <SubmissionsList /> : <AccessCodesList />}
    </div>
  );
}

function AccessCodesList() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadCodes();
  }, []);

  async function loadCodes() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/brief-codes");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setCodes(data.codes || []);
    } catch {
      setError("Couldn't load access codes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/brief-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName || null,
          clientEmail: clientEmail || null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setJustCreated(data.accessCode);
      setClientName("");
      setClientEmail("");
      setExpiresAt("");
      await loadCodes();
    } catch {
      setError("Couldn't create that code.");
    } finally {
      setCreating(false);
    }
  }

  async function revokeCode(id) {
    if (!window.confirm("Revoke this code? The client will no longer be able to access the brief form with it."))
      return;
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, revoked: true } : c)));
    try {
      await fetch("/api/admin/brief-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, revoked: true }),
      });
    } catch {
      loadCodes();
    }
  }

  function copyCode(id, code) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={loadCodes}
          className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            setShowCreate((prev) => !prev);
            setJustCreated(null);
          }}
          className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
        >
          {showCreate ? "Cancel" : "+ Generate code"}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-md border border-border-subtle bg-surface-card p-5"
        >
          {justCreated ? (
            <div className="text-center">
              <p className="mb-1 font-body text-small text-text-secondary">Code generated</p>
              <p className="mb-4 font-mono text-h2 font-bold tracking-widest text-text-accent">
                {justCreated.code}
              </p>
              <p className="font-body text-small text-text-secondary">
                Send this to the client — they'll enter it at{" "}
                <span className="font-mono">aboustate.tech/brief</span>
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                    Client name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                    Client email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
                    Expires (optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="rounded-sm bg-accent px-6 py-2.5 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Generating…" : "Generate code"}
              </button>
            </>
          )}
        </form>
      )}

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="font-body text-small text-text-secondary">No access codes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                {["Code", "Client", "Created", "Expires", "Briefs", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-mono text-micro uppercase tracking-mono text-text-accent">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < new Date();
                const isRevoked = c.revoked;
                return (
                  <tr key={c.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copyCode(c.id, c.code)}
                        className="font-mono text-small font-semibold tracking-wider text-text-primary hover:text-text-accent"
                        title="Click to copy"
                      >
                        {copiedId === c.id ? "Copied!" : c.code}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-body text-small text-text-secondary">
                      {c.client_name || "—"}
                      {c.client_email && <div>{c.client_email}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-secondary">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-secondary">
                      {c.expires_at ? formatDate(c.expires_at) : "—"}
                    </td>
                    <td className="px-4 py-3 font-body text-small text-text-secondary">{c.briefCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-pill px-2.5 py-1 font-body text-small font-medium",
                          isRevoked || expired
                            ? "bg-beige-500 text-text-secondary"
                            : "bg-mint-100 text-green-950",
                        ].join(" ")}
                      >
                        {isRevoked ? "Revoked" : expired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!isRevoked && (
                        <button
                          type="button"
                          onClick={() => revokeCode(c.id)}
                          className="rounded-sm border border-mint-700 px-2.5 py-1 font-body text-small font-medium text-mint-700 transition-colors duration-150 hover:bg-mint-100"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionsList() {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadBriefs();
  }, []);

  async function loadBriefs() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/briefs");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setBriefs(data.briefs || []);
    } catch {
      setError("Couldn't load briefs.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setBriefs((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    try {
      await fetch("/api/admin/briefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      loadBriefs();
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={loadBriefs}
          className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading…</p>
      ) : briefs.length === 0 ? (
        <p className="font-body text-small text-text-secondary">No briefs submitted yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {briefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              expanded={expandedId === brief.id}
              onToggle={() => setExpandedId((prev) => (prev === brief.id ? null : brief.id))}
              onStatusChange={(status) => updateStatus(brief.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BriefCard({ brief, expanded, onToggle, onStatusChange }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card">
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-4 p-4 text-left">
        <span className="font-mono text-small font-semibold text-text-accent">{brief.reference_number}</span>
        <span className="font-body text-small font-semibold text-text-primary">{brief.contact_name}</span>
        <span className="font-body text-small text-text-secondary">{brief.contact_email}</span>
        {brief.company_name && (
          <span className="font-body text-small text-text-secondary">{brief.company_name}</span>
        )}
        <span className="font-body text-small text-text-accent">{(brief.services || []).join(", ")}</span>
        {brief.brief_access_codes?.client_name && (
          <span className="rounded-pill bg-beige-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-text-secondary">
            {brief.brief_access_codes.client_name}
          </span>
        )}
        <span className="ml-auto font-mono text-micro uppercase tracking-mono text-text-secondary">
          {formatDate(brief.created_at)}
        </span>
      </button>

      <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-micro uppercase tracking-mono text-text-accent">Status</span>
        <select
          value={brief.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-sm border border-border-subtle bg-surface-page px-2 py-1 font-body text-small text-text-primary outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {expanded && (
        <div className="border-t border-border-subtle bg-surface-page px-5 py-5">
          {ALL_SECTIONS.map((section) => {
            const fields = section.rows.flat().filter((f) => hasValue(brief.data[f.name]));
            if (fields.length === 0) return null;
            return (
              <div key={section.id} className="mb-5">
                <p className="mb-2 font-mono text-micro uppercase tracking-mono text-text-accent">
                  {section.title}
                </p>
                <div className="flex flex-col gap-2">
                  {fields.map((f) => (
                    <div key={f.name}>
                      <p className="font-body text-small font-semibold text-text-primary">{f.label}</p>
                      <p className="font-body text-small text-text-secondary">
                        {formatValue(brief.data[f.name])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hasValue(v) {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== "";
}

function formatValue(v) {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
