import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["New", "Contacted", "Matched", "Closed"];

export function OnPanel() {
  const [innerTab, setInnerTab] = useState("talent");
  const [talent, setTalent] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/on");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTalent(data.talent || []);
      setDirectors(data.directors || []);
    } catch {
      setError("Couldn't load ON submissions.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(table, id, status) {
    const setList = table === "on_talent_signups" ? setTalent : setDirectors;
    setList((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    try {
      await fetch("/api/on", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, status }),
      });
    } catch {
      // best-effort — the row already updated optimistically
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-h2 font-bold tracking-tight text-text-primary">ON</h1>
        <div className="flex rounded-sm border border-border-subtle bg-surface-card p-1">
          {[
            { key: "talent", label: `Talent (${talent.length})` },
            { key: "directors", label: `Directors (${directors.length})` },
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

      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading…</p>
      ) : innerTab === "talent" ? (
        <TalentTable rows={talent} onStatusChange={(id, status) => updateStatus("on_talent_signups", id, status)} />
      ) : (
        <DirectorsTable
          rows={directors}
          onStatusChange={(id, status) => updateStatus("on_director_briefs", id, status)}
        />
      )}
    </div>
  );
}

function StatusSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-sm border border-border-subtle bg-surface-page px-2 py-1 font-body text-small text-text-primary outline-none focus:border-accent"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function TalentTable({ rows, onStatusChange }) {
  if (!rows.length) {
    return <p className="font-body text-small text-text-secondary">No talent signups yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-subtle text-left font-mono text-micro uppercase tracking-mono text-text-secondary">
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Role type</th>
            <th className="px-4 py-3">Links</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle font-body text-small text-text-primary">
              <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">
                <div>{row.email}</div>
                {row.phone && <div className="text-text-secondary">{row.phone}</div>}
              </td>
              <td className="px-4 py-3">{row.role_type || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  {row.reel_url && (
                    <a href={row.reel_url} target="_blank" rel="noopener" className="text-text-accent hover:underline">
                      Reel
                    </a>
                  )}
                  {row.portfolio_url && (
                    <a
                      href={row.portfolio_url}
                      target="_blank"
                      rel="noopener"
                      className="text-text-accent hover:underline"
                    >
                      Portfolio
                    </a>
                  )}
                  {!row.reel_url && !row.portfolio_url && "—"}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusSelect value={row.status} onChange={(status) => onStatusChange(row.id, status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DirectorsTable({ rows, onStatusChange }) {
  if (!rows.length) {
    return <p className="font-body text-small text-text-secondary">No director briefs yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-subtle text-left font-mono text-micro uppercase tracking-mono text-text-secondary">
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Production</th>
            <th className="px-4 py-3">Role needed</th>
            <th className="px-4 py-3">Brief</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border-subtle align-top font-body text-small text-text-primary">
              <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div>{row.name}</div>
                {row.company && <div className="text-text-secondary">{row.company}</div>}
              </td>
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3">{row.production_name || "—"}</td>
              <td className="px-4 py-3">{row.role_needed}</td>
              <td className="max-w-[280px] px-4 py-3 text-text-secondary">{row.brief_description}</td>
              <td className="px-4 py-3">
                <StatusSelect value={row.status} onChange={(status) => onStatusChange(row.id, status)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
