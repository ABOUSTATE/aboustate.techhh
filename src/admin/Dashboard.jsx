import { useEffect, useMemo, useState } from "react";
import { BoardView } from "./BoardView.jsx";
import { exportLeadsToCsv } from "./csv.js";
import { OrderForm } from "./OrderForm.jsx";
import { QuoteBuilder } from "./QuoteBuilder.jsx";

const STATUS_OPTIONS = ["New", "Contacted", "Won", "Lost"];
const PAGE_SIZE = 15;

const STATUS_STYLES = {
  New: "bg-mint-100 text-green-950",
  Contacted: "bg-beige-300 text-green-950",
  Won: "bg-accent text-green-950",
  Lost: "bg-beige-500 text-text-secondary",
};

const SORTABLE_COLUMNS = {
  Submitted: "Timestamp",
  Type: "Type",
  Name: "Name",
  Status: "Status",
};

export function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState("table"); // table | board
  const [sortKey, setSortKey] = useState("Timestamp");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState(STATUS_OPTIONS[0]);
  const [showAddOrder, setShowAddOrder] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, typeFilter, search]);

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

  async function applyBulkStatus() {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => updateLead(id, { status: bulkStatus })));
    setSelectedIds(new Set());
  }

  async function deleteOrder(id) {
    if (!window.confirm("Permanently delete this order? This cannot be undone.")) return;

    setLeads((prev) => prev.filter((l) => l.ID !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    try {
      const response = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
    } catch {
      setError("Delete failed — reload to check the actual state.");
      loadLeads();
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

  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads].sort((a, b) => {
      const aVal = a[sortKey] || "";
      const bVal = b[sortKey] || "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredLeads, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / PAGE_SIZE));
  const pagedLeads = sortedLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(column) {
    const key = SORTABLE_COLUMNS[column];
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      const pageIds = pagedLeads.map((l) => l.ID);
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

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

  const allOnPageSelected =
    pagedLeads.length > 0 && pagedLeads.every((l) => selectedIds.has(l.ID));

  return (
    <div>
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

        <div className="mb-4 flex flex-wrap items-center gap-3">
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
            className="min-w-[200px] flex-1 rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={loadLeads}
            className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => exportLeadsToCsv(filteredLeads, "aboustate-leads.csv")}
            className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowAddOrder((prev) => !prev)}
            className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
          >
            {showAddOrder ? "Cancel" : "+ Add order"}
          </button>

          <div className="ml-auto flex rounded-sm border border-border-subtle bg-surface-card p-1">
            {["table", "board"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={[
                  "rounded-sm px-4 py-1.5 font-body text-small font-semibold capitalize transition-colors duration-150",
                  view === v ? "bg-accent text-green-950" : "text-text-secondary hover:text-text-accent",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {showAddOrder && (
          <OrderForm
            onCancel={() => setShowAddOrder(false)}
            onCreated={() => {
              setShowAddOrder(false);
              loadLeads();
            }}
          />
        )}

        {view === "table" && selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-accent bg-mint-100 px-4 py-2.5">
            <span className="font-body text-small font-semibold text-green-950">
              {selectedIds.size} selected
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-sm border border-border-subtle bg-surface-card px-2 py-1.5 font-body text-small text-text-primary outline-none focus:border-accent"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Set status: {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyBulkStatus}
              className="rounded-sm bg-accent px-3 py-1.5 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() =>
                exportLeadsToCsv(
                  leads.filter((l) => selectedIds.has(l.ID)),
                  "aboustate-leads-selected.csv"
                )
              }
              className="rounded-sm border border-border-subtle bg-surface-card px-3 py-1.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
            >
              Export selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto font-body text-small text-text-secondary hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <p className="font-body text-small text-text-secondary">Loading leads…</p>
        ) : filteredLeads.length === 0 ? (
          <p className="font-body text-small text-text-secondary">No leads match.</p>
        ) : view === "board" ? (
          <BoardView leads={filteredLeads} onUpdate={updateLead} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
              <table className="w-full min-w-[960px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle text-left">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAllOnPage}
                        className="h-4 w-4 rounded-xs border border-border-subtle accent-accent"
                      />
                    </th>
                    {["Submitted", "Type", "Name", "Contact", "Services", "Student", "Status", "Notes", ""].map(
                      (h) => (
                        <th
                          key={h}
                          onClick={() => SORTABLE_COLUMNS[h] && toggleSort(h)}
                          className={[
                            "px-4 py-3 font-mono text-micro uppercase tracking-mono text-text-accent",
                            SORTABLE_COLUMNS[h] ? "cursor-pointer select-none hover:text-mint-700" : "",
                          ].join(" ")}
                        >
                          {h}
                          {SORTABLE_COLUMNS[h] === sortKey && (sortDir === "asc" ? " ↑" : " ↓")}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedLeads.map((lead) => (
                    <LeadRow
                      key={lead.ID}
                      lead={lead}
                      selected={selectedIds.has(lead.ID)}
                      onToggleSelect={() => toggleSelect(lead.ID)}
                      expanded={expandedId === lead.ID}
                      onToggleExpand={() =>
                        setExpandedId((prev) => (prev === lead.ID ? null : lead.ID))
                      }
                      onUpdate={updateLead}
                      onDelete={deleteOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-border-subtle px-3 py-1.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="font-body text-small text-text-secondary">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-border-subtle px-3 py-1.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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

function LeadRow({ lead, selected, onToggleSelect, expanded, onToggleExpand, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(lead.Notes || "");
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border-subtle last:border-0 hover:bg-surface-page"
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded-xs border border-border-subtle accent-accent"
          />
        </td>
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
            key={lead.Status || "New"}
            defaultValue={lead.Status || "New"}
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
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onDelete(lead.ID)}
            className="rounded-sm border border-mint-700 px-2.5 py-1 font-body text-small font-medium text-mint-700 transition-colors duration-150 hover:bg-mint-100"
          >
            Delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border-subtle bg-surface-page">
          <td colSpan={10} className="px-4 py-4">
            <div className="font-body text-small text-text-secondary">
              <p className="mb-1 font-semibold text-text-primary">Project description</p>
              <p className="mb-3">{lead["Project Description"] || "—"}</p>
              <p className="mb-1 font-semibold text-text-primary">Timeline</p>
              <p className="mb-3">{lead.Timeline || "—"}</p>
              {lead["Other Service Description"] && (
                <>
                  <p className="mb-1 font-semibold text-text-primary">Other service</p>
                  <p className="mb-3">{lead["Other Service Description"]}</p>
                </>
              )}

              {!showQuoteBuilder ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuoteBuilder(true);
                  }}
                  className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
                >
                  Generate quote PDF
                </button>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <QuoteBuilder order={lead} onClose={() => setShowQuoteBuilder(false)} />
                </div>
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
