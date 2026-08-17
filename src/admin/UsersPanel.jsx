import { useEffect, useMemo, useState } from "react";
import { OrderForm } from "./OrderForm.jsx";

export function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
    } catch {
      setError("Couldn't load users. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }

  async function performAction(userId, action, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setBusyId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      await loadUsers();
    } catch {
      setError("That action failed. Nothing was changed.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveNotes(userId, notes) {
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateNotes", userId, notes }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, adminNotes: notes } : u)));
    } catch {
      setError("Couldn't save that note.");
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", email: newEmail, password: newPassword }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setNewEmail("");
      setNewPassword("");
      setShowCreate(false);
      await loadUsers();
    } catch {
      setError("Couldn't create that account. Check the email/password and try again.");
    } finally {
      setCreating(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();
      if (q && !user.email.toLowerCase().includes(q)) return false;
      if (statusFilter === "Active" && isBanned) return false;
      if (statusFilter === "Banned" && !isBanned) return false;
      if (statusFilter === "Unconfirmed" && user.emailConfirmedAt) return false;
      if (providerFilter !== "All" && user.provider !== providerFilter.toLowerCase()) return false;
      return true;
    });
  }, [users, search, statusFilter, providerFilter]);

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-sm border border-mint-700 bg-mint-100 px-4 py-3 font-body text-small text-green-950">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-h2 font-bold tracking-tight text-text-primary">
          Users
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={loadUsers}
            className="rounded-sm border border-border-subtle px-4 py-2 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((prev) => !prev)}
            className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700"
          >
            {showCreate ? "Cancel" : "+ Create user"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Banned">Banned</option>
          <option value="Unconfirmed">Unconfirmed</option>
        </select>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
        >
          <option value="All">All providers</option>
          <option value="Email">Email</option>
          <option value="Google">Google</option>
        </select>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-md border border-border-subtle bg-surface-card p-5"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
              Email
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block font-body text-small font-semibold text-text-primary">
              Password
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-2 font-body text-small text-text-primary outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-sm bg-accent px-4 py-2 font-body text-small font-semibold text-green-950 transition-colors duration-150 hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading users…</p>
      ) : filteredUsers.length === 0 ? (
        <p className="font-body text-small text-text-secondary">No users match.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              busy={busyId === user.id}
              expanded={expandedUserId === user.id}
              onToggleExpand={() =>
                setExpandedUserId((prev) => (prev === user.id ? null : user.id))
              }
              onAction={performAction}
              onSaveNotes={saveNotes}
              onOrdersChanged={loadUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, busy, expanded, onToggleExpand, onAction, onSaveNotes, onOrdersChanged }) {
  const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();
  const [notes, setNotes] = useState(user.adminNotes || "");

  return (
    <div className="rounded-md border border-border-subtle bg-surface-card">
      <div className="flex flex-wrap items-center gap-4 p-4">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className="font-body text-small font-semibold text-text-primary">
            {user.email}
          </span>
          {!user.emailConfirmedAt && (
            <span className="rounded-pill bg-beige-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-text-secondary">
              Unconfirmed
            </span>
          )}
          <span
            className={[
              "rounded-pill px-2.5 py-0.5 font-body text-small font-medium",
              isBanned ? "bg-beige-500 text-text-secondary" : "bg-mint-100 text-green-950",
            ].join(" ")}
          >
            {isBanned ? "Banned" : "Active"}
          </span>
          <span className="font-mono text-micro uppercase tracking-mono text-text-secondary">
            {user.provider} · {user.requestCount} order{user.requestCount === 1 ? "" : "s"}
          </span>
        </button>

        <div className="flex flex-wrap gap-2">
          {!user.emailConfirmedAt && (
            <ActionButton disabled={busy} onClick={() => onAction(user.id, "confirmEmail")}>
              Confirm email
            </ActionButton>
          )}
          <ActionButton disabled={busy} onClick={() => onAction(user.id, "sendPasswordReset")}>
            Reset password
          </ActionButton>
          {isBanned ? (
            <ActionButton disabled={busy} onClick={() => onAction(user.id, "unban")}>
              Unban
            </ActionButton>
          ) : (
            <ActionButton
              disabled={busy}
              onClick={() =>
                onAction(
                  user.id,
                  "ban",
                  `Ban ${user.email}? They won't be able to sign in until unbanned.`
                )
              }
            >
              Ban
            </ActionButton>
          )}
          <ActionButton
            disabled={busy}
            danger
            onClick={() =>
              onAction(
                user.id,
                "delete",
                `Permanently delete ${user.email}? This cannot be undone. Their past orders stay on record but will no longer be linked to an account.`
              )
            }
          >
            Delete
          </ActionButton>
        </div>
      </div>

      <div className="border-t border-border-subtle px-4 py-3">
        <label className="mb-1 block font-mono text-micro uppercase tracking-mono text-text-accent">
          Internal notes
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (user.adminNotes || "")) onSaveNotes(user.id, notes);
          }}
          placeholder="e.g. VIP client, chargeback risk, prefers email…"
          className="w-full rounded-sm border border-border-subtle bg-surface-page px-3 py-1.5 font-body text-small text-text-primary outline-none focus:border-accent"
        />
      </div>

      {expanded && (
        <UserOrders userId={user.id} userEmail={user.email} onOrdersChanged={onOrdersChanged} />
      )}
    </div>
  );
}

function UserOrders({ userId, userEmail, onOrdersChanged }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/leads");
      const data = await response.json();
      const mine = (data.leads || []).filter((l) => l.UserId === userId);
      setOrders(mine);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(id) {
    if (!window.confirm("Permanently delete this order? This cannot be undone.")) return;
    setOrders((prev) => prev.filter((o) => o.ID !== id));
    try {
      await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      onOrdersChanged();
    } catch {
      loadOrders();
    }
  }

  return (
    <div className="border-t border-border-subtle bg-surface-page px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-micro uppercase tracking-mono text-text-accent">
          Orders
        </span>
        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="rounded-sm border border-border-subtle bg-surface-card px-3 py-1.5 font-body text-small font-semibold text-text-primary transition-colors duration-150 hover:border-accent hover:text-text-accent"
        >
          {showAdd ? "Cancel" : "+ Add order"}
        </button>
      </div>

      {showAdd && (
        <OrderForm
          userId={userId}
          userEmail={userEmail}
          onCancel={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            loadOrders();
            onOrdersChanged();
          }}
        />
      )}

      {loading ? (
        <p className="font-body text-small text-text-secondary">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="font-body text-small text-text-secondary">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <div
              key={order.ID}
              className="flex items-center justify-between gap-3 rounded-sm border border-border-subtle bg-surface-card p-3"
            >
              <div>
                <div className="font-body text-small font-semibold capitalize text-text-primary">
                  {order.Type} — {order.Status || "New"}
                </div>
                {order.Services && (
                  <div className="font-body text-small text-text-accent">{order.Services}</div>
                )}
                <div className="font-mono text-micro uppercase tracking-mono text-text-secondary">
                  {formatDate(order.Timestamp)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteOrder(order.ID)}
                className="rounded-sm border border-mint-700 px-2.5 py-1 font-body text-small font-medium text-mint-700 transition-colors duration-150 hover:bg-mint-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({ children, onClick, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-sm border px-2.5 py-1 font-body text-small font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "border-mint-700 text-mint-700 hover:bg-mint-100"
          : "border-border-subtle text-text-primary hover:border-accent hover:text-text-accent",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
