import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { Avatar, Button, Wordmark } from "./ui.jsx";
import { Icon } from "./icons.jsx";
import { tr, useLang } from "../lib/i18n.jsx";

function useNavItems() {
  const { profile } = useAuth();
  if (!profile) return [];
  const items = [
    { to: "/", label: tr("Home"), icon: "home", end: true },
    { to: "/explore", label: tr("Explore"), icon: "search" },
  ];
  if (profile.role === "talent") items.push({ to: `/@${profile.handle}`, label: tr("Profile"), icon: "user" });
  if (profile.role === "guardian") items.push({ to: "/family", label: tr("Family"), icon: "shield" });
  if (profile.role === "director") items.push({ to: "/studio", label: tr("Studio"), icon: "film" });
  if (profile.is_admin) items.push({ to: "/admin", label: tr("Admin"), icon: "lock" });
  items.push({ to: "/settings", label: tr("Settings"), icon: "settings" });
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
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-pill" aria-label={tr("Account menu")} aria-expanded={open}>
        <Avatar profile={profile} size={34} />
      </button>
      {open && (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-lg border border-border-subtle bg-surface-card shadow-md">
          <div className="border-b border-border-subtle px-4 py-3">
            <div className="truncate font-body text-small font-semibold text-text-primary"><bdi>{profile.display_name}</bdi></div>
            <div className="truncate font-mono text-micro text-text-secondary"><bdi dir="ltr">@{profile.handle}</bdi></div>
          </div>
          {profile.role === "talent" && (
            <MenuLink to="/me/edit" onClick={() => setOpen(false)} icon="edit">
              {tr("Edit profile")}
            </MenuLink>
          )}
          <MenuLink to="/settings" onClick={() => setOpen(false)} icon="settings">
            {tr("Settings")}
          </MenuLink>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-start font-body text-small text-text-primary hover:bg-beige-100"
          >
            <Icon name="logout" size={18} /> {tr("Sign out")}
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
    <div className="min-h-screen bg-surface-page pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-page/90 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-container items-center gap-5 px-4 sm:px-6">
          <Link to="/" aria-label={tr("ON home")}>
            <Wordmark />
          </Link>
          <nav className="ms-4 hidden items-center gap-1 md:flex">
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
                {tr("Explore talent")}
              </NavLink>
            )}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <LangSwitch />
            {loading ? null : profile ? (
              <AccountMenu />
            ) : user ? (
              <Button to="/welcome" size="sm">
                {tr("Finish setting up")}
              </Button>
            ) : (
              <>
                <Button to="/login" variant="ghost" size="sm">
                  {tr("Log in")}
                </Button>
                <Button to="/join" size="sm">
                  {tr("Join ON")}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <Outlet />

      {items.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-card pb-[env(safe-area-inset-bottom)] md:hidden" aria-label={tr("Main")}>
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

// Shows the other language's name in that language, the way bilingual
// Egyptian sites do it.
export function LangSwitch({ className = "" }) {
  const { lang, setLang } = useLang();
  const next = lang === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={tr(next === "en" ? "Switch to English" : "Switch to Arabic")}
      lang={next}
      className={`rounded-pill px-3 py-1 font-body text-small font-semibold text-text-secondary transition-colors duration-150 hover:text-text-primary ${className}`}
    >
      {next === "en" ? "English" : "عربي"}
    </button>
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
          <span className="font-body text-small text-text-secondary">{tr("Casting, online. Made in Egypt.")}</span>
        </div>
        <div className="flex flex-wrap gap-5 font-body text-small text-text-secondary">
          <Link to="/safety" className="hover:text-text-primary">{tr("Safety & minors")}</Link>
          <Link to="/privacy" className="hover:text-text-primary">{tr("Privacy")}</Link>
          <a href="https://www.aboustate.tech" className="hover:text-text-primary">{tr("by aboustate.tech")}</a>
        </div>
      </div>
    </footer>
  );
}
