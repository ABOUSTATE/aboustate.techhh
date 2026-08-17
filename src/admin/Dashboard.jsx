import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["New", "Contacted", "Won", "Lost"];

const STATUS_STYLES = {
  New: "bg-mint-100 text-green-950",
  Contacted: "bg-beige-300 text-green-950",
  Won: "bg-accent text-green-950",
  Lost: "bg-beige-500 text-text-secondary",
};

export function Dashboard({ onLogout }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/leads");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setLeads(data.leads || []);
    } catch {
      setError("Couldn't load leads. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  async function updateLead(id, patch) {
    setLeads((prev) => prev.map((l) => (l.ID === id ? { ...l, ...patch } : l)));

    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
    } catch {
      setError("A save failed — reload to check the sheet's actual state.");
    }
  }

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "All" && (lead.Status || "New") !== statusFilter) return false;
      if (typeFilter !== "All" && lead.Type !== typeFilter) return false;
      if (q) {
        const haystack = [lead.Name, lead.Email, lead["Project Description"], lead.Services]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, typeFilter, search]);

  const stats = useMemo(() => {
    const total = leads.length;
    const quotations = leads.filter((l) => l.Type === "quotation").length;
    const appointments = leads.filter((l) => l.Type === "appointment").length;
    const studentProjects = leads.filter((l) => l["Student Project"] === "Yes").length;

    const serviceCounts = {};
    leads.forEach((l) => {
      (l.Services || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => {
          serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        });
    });
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    return { total, quotations, appointments, studentProjects, topService };
  }, [leads]);

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="border-b border-border-on-inverse bg-surface-inverse px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="font-display text-lg font-bold tracking-tight text-text-on-inverse">
            aboustate<span className="text-accent">.</span>tech
            <span className="ml-2 font-mono text-micro font-normal uppercase tracking-mono text-text-on-inverse-muted">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-sm border border-border-on-inverse px-4 py-2 font-body text-small font-semibold text-text-on-inverse transition-colors duration-150 hover:border-accent hover:text-accent"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total leads" value={stats.total} />
          <StatCard label="Quotations" value={stats.quotations} />
          <StatCard label="Appointments" value={stats.appointments} />
          <StatCard label="Student projects" value={stats.studentProjects} />
          <StatCard
            label="Top service"
            value={stats.topService ? stats.topService[0] : "—"}
            sub={stats.topService ? `${stats.topService[1]} requests` : null}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            <option value="All">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          >
            <option value="All">All types</option>
            <option value="quotation">Quotation</option>
            <option value="appointment">Appointment</option>
          </select>
          <input
            type="text"
            placeholder="Search name, email, brief…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={loadLeads}
            className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="font-body text-small text-text-secondary">Loading leads…</p>
        ) : filteredLeads.length === 0 ? (
          <p className="font-body text-small text-text-secondary">No leads match.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-left">
                  {["Submitted", "Type", "Name", "Contact", "Services", "Student", "Status", "Notes"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-mono text-micro uppercase tracking-mono text-text-accent"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <LeadRow
                    key={lead.ID}
                    lead={lead}
                    expanded={expandedId === lead.ID}
                    onToggleExpand={() =>
                      setExpandedId((prev) => (prev === lead.ID ? null : lead.ID))
                    }
                    onUpdate={updateLead}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4">
      <div className="font-mono text-micro uppercase tracking-mono text-text-accent">{label}</div>
      <div className="mt-1 font-display text-h3 font-bold text-text-primary">{value}</div>
      {sub && <div className="mt-0.5 font-body text-small text-text-secondary">{sub}</div>}
    </div>
  );
}

function LeadRow({ lead, expanded, onToggleExpand, onUpdate }) {
  const [notes, setNotes] = useState(lead.Notes || "");

  return (
    <>
      <tr className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-surface-page" onClick={onToggleExpand}>
        <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-secondary">
          {formatDate(lead.Timestamp)}
        </td>
        <td className="px-4 py-3 font-body text-small capitalize text-text-primary">{lead.Type}</td>
        <td className="px-4 py-3 font-body text-small font-semibold text-text-primary">{lead.Name}</td>
        <td className="px-4 py-3 font-body text-small text-text-secondary">
          <div>{lead.Email}</div>
          <div>{lead.Phone}</div>
        </td>
        <td className="max-w-[220px] truncate px-4 py-3 font-body text-small text-text-secondary">
          {lead.Services || "—"}
        </td>
        <td className="px-4 py-3 font-body text-small text-text-secondary">
          {lead["Student Project"] === "Yes" ? "Yes" : "—"}
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={lead.Status || "New"}
            onChange={(e) => onUpdate(lead.ID, { status: e.target.value })}
            className={[
              "rounded-pill border-0 px-2.5 py-1 font-body text-small font-medium outline-none",
              STATUS_STYLES[lead.Status] || STATUS_STYLES.New,
            ].join(" ")}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (lead.Notes || "")) onUpdate(lead.ID, { notes });
            }}
            placeholder="Add a note…"
            className="w-40 rounded-sm border border-border-subtle bg-surface-page px-2 py-1 font-body text-small text-text-primary outline-none focus:border-accent"
          />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border-subtle bg-surface-page">
          <td colSpan={8} className="px-4 py-4">
            <div className="font-body text-small text-text-secondary">
              <p className="mb-1 font-semibold text-text-primary">Project description</p>
              <p className="mb-3">{lead["Project Description"] || "—"}</p>
              <p className="mb-1 font-semibold text-text-primary">Timeline</p>
              <p className="mb-3">{lead.Timeline || "—"}</p>
              {lead["Other Service Description"] && (
                <>
                  <p className="mb-1 font-semibold text-text-primary">Other service</p>
                  <p>{lead["Other Service Description"]}</p>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
