import { useEffect, useState } from "react";

export function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

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
      ) : users.length === 0 ? (
        <p className="font-body text-small text-text-secondary">No users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface-card">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                {["Email", "Provider", "Created", "Last sign-in", "Requests", "Status", "Actions"].map(
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
              {users.map((user) => {
                const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();
                const isBusy = busyId === user.id;
                return (
                  <tr key={user.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-3 font-body text-small text-text-primary">
                      {user.email}
                      {!user.emailConfirmedAt && (
                        <span className="ml-2 rounded-pill bg-beige-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-mono text-text-secondary">
                          Unconfirmed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-small capitalize text-text-secondary">
                      {user.provider}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-secondary">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-small text-text-secondary">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3 font-body text-small text-text-secondary">
                      {user.requestCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-pill px-2.5 py-1 font-body text-small font-medium",
                          isBanned ? "bg-beige-500 text-text-secondary" : "bg-mint-100 text-green-950",
                        ].join(" ")}
                      >
                        {isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {!user.emailConfirmedAt && (
                          <ActionButton
                            disabled={isBusy}
                            onClick={() => performAction(user.id, "confirmEmail")}
                          >
                            Confirm email
                          </ActionButton>
                        )}
                        <ActionButton
                          disabled={isBusy}
                          onClick={() => performAction(user.id, "sendPasswordReset")}
                        >
                          Reset password
                        </ActionButton>
                        {isBanned ? (
                          <ActionButton disabled={isBusy} onClick={() => performAction(user.id, "unban")}>
                            Unban
                          </ActionButton>
                        ) : (
                          <ActionButton
                            disabled={isBusy}
                            onClick={() =>
                              performAction(
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
                          disabled={isBusy}
                          danger
                          onClick={() =>
                            performAction(
                              user.id,
                              "delete",
                              `Permanently delete ${user.email}? This cannot be undone. Their past requests stay on record but will no longer be linked to an account.`
                            )
                          }
                        >
                          Delete
                        </ActionButton>
                      </div>
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
