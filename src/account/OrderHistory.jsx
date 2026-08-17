import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const STATUS_STYLES = {
  New: "bg-mint-100 text-green-950",
  Contacted: "bg-beige-300 text-green-950",
  Won: "bg-accent text-green-950",
  Lost: "bg-beige-500 text-text-secondary",
};

export function OrderHistory({ user, onSignOut }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("service_requests")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (fetchError) {
      setError("Couldn't load your requests.");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="font-mono text-micro uppercase tracking-mono text-text-accent">
            Signed in as
          </div>
          <div className="font-body text-small text-text-primary">{user.email}</div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
        >
          Sign out
        </button>
      </div>

      <h1 className="mb-6 font-display text-h2 font-bold tracking-tight text-text-primary">
        Your requests
      </h1>

      {error && (
        <div className="mb-4 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-md border border-border-subtle bg-surface-card p-8 text-center">
          <p className="font-body text-small text-text-secondary">
            No requests yet. Submissions you make while signed in will show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-md border border-border-subtle bg-surface-card p-5"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-body text-small font-semibold capitalize text-text-primary">
                  {request.type}
                </span>
                <span
                  className={[
                    "rounded-pill px-2.5 py-1 font-body text-small font-medium",
                    STATUS_STYLES[request.status] || STATUS_STYLES.New,
                  ].join(" ")}
                >
                  {request.status || "New"}
                </span>
              </div>
              {request.services?.length > 0 && (
                <p className="mb-1 font-body text-small text-text-accent">
                  {request.services.join(", ")}
                </p>
              )}
              {request.project_description && (
                <p className="mb-2 font-body text-small text-text-secondary">
                  {request.project_description}
                </p>
              )}
              <p className="font-mono text-micro uppercase tracking-mono text-text-secondary">
                {formatDate(request.submitted_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
