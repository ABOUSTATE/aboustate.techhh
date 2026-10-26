import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Avatar, Button, Wordmark } from "./ui.jsx";
import { Icon } from "./icons.jsx";

function useNavItems() {
  const { profile } = useAuth();
  if (!profile) return [];
  const items = [
    { to: "/", label: "Home", icon: "home", end: true },
    { to: "/explore", label: "Explore", icon: "search" },
  ];
  if (profile.role === "talent") items.push({ to: `/@${profile.handle}`, label: "Profile", icon: "user" });
  if (profile.role === "guardian") items.push({ to: "/family", label: "Family", icon: "shield" });
  if (profile.role === "director") items.push({ to: "/studio", label: "Studio", icon: "film" });
  if (profile.is_admin) items.push({ to: "/admin", label: "Admin", icon: "lock" });
  items.push({ to: "/settings", label: "Settings", icon: "settings" });
  return items;
}

function AccountMenu() {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-pill" aria-label="Account menu" aria-expanded={open}>
        <Avatar profile={profile} size={34} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-md">
          <div className="border-b border-border-subtle px-4 py-3">
            <div className="truncate font-body text-small font-semibold text-text-primary">{profile.display_name}</div>
            <div className="truncate font-mono text-micro text-text-secondary">@{profile.handle}</div>
          </div>
          {profile.role === "talent" && (
            <MenuLink to="/me/edit" onClick={() => setOpen(false)} icon="edit">
              Edit profile
            </MenuLink>
          )}
          <MenuLink to="/settings" onClick={() => setOpen(false)} icon="settings">
            Settings
          </MenuLink>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left font-body text-small text-text-primary hover:bg-beige-100"
          >
            <Icon name="logout" size={18} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 px-4 py-3 font-body text-small text-text-primary hover:bg-beige-100">
      <Icon name={icon} size={18} /> {children}
    </Link>
  );
}

export function Shell() {
  const { user, profile, loading } = useAuth();
  const items = useNavItems();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-surface-page pb-[72px] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-page/90 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-container items-center gap-5 px-4 sm:px-6">
          <Link to="/" aria-label="ON home">
            <Wordmark />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {items
              .filter((i) => i.icon !== "settings")
              .map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.end}
                  className={({ isActive }) =>
                    `rounded-pill px-3 py-1 font-body text-small font-medium transition-colors duration-150 ${
                      isActive ? "bg-green-900 text-beige-100" : "text-text-secondary hover:text-text-primary"
                    }`
                  }
                >
                  {i.label}
                </NavLink>
              ))}
            {!profile && (
              <NavLink to="/explore" className="rounded-pill px-3 py-1 font-body text-small font-medium text-text-secondary hover:text-text-primary">
                Explore talent
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {loading ? null : profile ? (
              <AccountMenu />
            ) : user ? (
              <Button to="/welcome" size="sm">
                Finish setting up
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  Log in
                </Button>
                <Button to="/join" size="sm">
                  Join ON
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <Outlet />

      {items.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-card md:hidden" aria-label="Main">
          <div className="mx-auto flex max-w-[520px] justify-around">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={({ isActive }) =>
                  `flex min-w-[64px] flex-col items-center gap-1 px-2 pb-3 pt-2 font-body text-[11px] font-medium ${
                    isActive ? "text-text-primary" : "text-text-secondary"
                  }`
                }
              >
                <Icon name={i.icon} size={22} />
                {i.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function Page({ children, narrow = false, className = "" }) {
  return <main className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 ${narrow ? "max-w-[640px]" : "max-w-container"} ${className}`}>{children}</main>;
}

export function Footer() {
  return (
    <footer className="border-t border-border-subtle px-4 py-7 sm:px-6">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span className="font-body text-small text-text-secondary">Casting, online. Made in Egypt.</span>
        </div>
        <div className="flex flex-wrap gap-5 font-body text-small text-text-secondary">
          <Link to="/safety" className="hover:text-text-primary">Safety & minors</Link>
          <Link to="/privacy" className="hover:text-text-primary">Privacy</Link>
          <a href="https://www.aboustate.tech" className="hover:text-text-primary">by aboustate.tech</a>
        </div>
      </div>
    </footer>
  );
}
