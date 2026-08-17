import { useState } from "react";

const COLUMNS = ["New", "Contacted", "Won", "Lost"];

const COLUMN_ACCENT = {
  New: "border-t-mint-500",
  Contacted: "border-t-beige-700",
  Won: "border-t-green-900",
  Lost: "border-t-beige-500",
};

export function BoardView({ leads, onUpdate }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const byStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = leads.filter((l) => (l.Status || "New") === status);
    return acc;
  }, {});

  function handleDrop(status) {
    if (draggingId) {
      onUpdate(draggingId, { status });
    }
    setDraggingId(null);
    setDragOverColumn(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((status) => (
        <div
          key={status}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(status);
          }}
          onDragLeave={() => setDragOverColumn((prev) => (prev === status ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(status);
          }}
          className={[
            "flex min-h-[200px] flex-col gap-3 rounded-md border-t-4 bg-surface-page/60 p-3 transition-colors duration-150",
            COLUMN_ACCENT[status],
            dragOverColumn === status ? "bg-mint-100/60 ring-2 ring-accent" : "",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-micro uppercase tracking-mono text-text-accent">
              {status}
            </span>
            <span className="font-mono text-micro text-text-secondary">
              {byStatus[status].length}
            </span>
          </div>

          {byStatus[status].map((lead) => (
            <div
              key={lead.ID}
              draggable
              onDragStart={() => setDraggingId(lead.ID)}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverColumn(null);
              }}
              className={[
                "cursor-grab select-none rounded-md border border-border-subtle bg-surface-card p-3 shadow-sm transition-all duration-150 active:cursor-grabbing",
                draggingId === lead.ID ? "rotate-2 scale-105 opacity-60 shadow-lg" : "hover:-translate-y-0.5 hover:shadow-md",
              ].join(" ")}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-body text-small font-semibold text-text-primary">
                  {lead.Name || "(no name)"}
                </span>
                <span className="shrink-0 rounded-pill bg-surface-page px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-text-secondary">
                  {lead.Type}
                </span>
              </div>
              <div className="mb-2 truncate font-body text-small text-text-secondary">
                {lead.Email}
              </div>
              {lead.Services && (
                <div className="truncate font-body text-small text-text-accent">
                  {lead.Services}
                </div>
              )}
              {lead.Notes && (
                <div className="mt-2 rounded-sm bg-surface-page px-2 py-1 font-body text-small text-text-secondary">
                  {lead.Notes}
                </div>
              )}
            </div>
          ))}

          {byStatus[status].length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-sm border border-dashed border-border-subtle py-6 font-body text-small text-text-secondary">
              Drop here
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
