export function AdminHeader({ activeTab, onTabChange, onLogout }) {
  return (
    <header className="border-b border-border-on-inverse bg-surface-inverse px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="font-display text-lg font-bold tracking-tight text-text-on-inverse">
            aboustate<span className="text-accent">.</span>tech
            <span className="ml-2 font-mono text-micro font-normal uppercase tracking-mono text-text-on-inverse-muted">
              Admin
            </span>
          </div>
          <nav className="flex gap-1 rounded-sm border border-border-on-inverse p-1">
            {[
              { key: "leads", label: "Orders" },
              { key: "users", label: "Users" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className={[
                  "rounded-sm px-4 py-1.5 font-body text-small font-semibold transition-colors duration-150",
                  activeTab === tab.key
                    ? "bg-accent text-green-950"
                    : "text-text-on-inverse-muted hover:text-text-on-inverse",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </nav>
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
  );
}
