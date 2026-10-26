import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { tr } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth.jsx";
import { Button, Card, Label, Wordmark } from "./ui.jsx";
import { Icon } from "./icons.jsx";

// Chrome/Android fires `beforeinstallprompt` once, often before React has
// mounted, so it's caught at module load and kept for whoever asks.
let deferred = null;
const listeners = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

const DISMISS_KEY = "on:install-dismissed";
const DISMISS_DAYS = 14;

export function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return {
    installed: isInstalled(),
    canPrompt: !!deferred,
    ios: isIOS(),
    prompt: async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      listeners.forEach((fn) => fn());
    },
  };
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

function IOSSteps() {
  return (
    <p className="m-0 flex flex-wrap items-center gap-1 font-body text-small text-text-secondary">
      {tr("On iPhone: tap")}
      <span className="inline-flex items-center rounded-sm border border-border-subtle px-1 text-text-primary">
        <Icon name="share" size={16} />
      </span>
      {tr("then “Add to Home Screen”.")}
    </p>
  );
}

// Bottom sheet on phones, shown a few seconds into a visit. Never on pages
// that have their own bottom bar (the profile editor's save bar).
export function InstallPrompt() {
  const { installed, canPrompt, ios, prompt } = useInstall();
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(recentlyDismissed);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const blocked = pathname.startsWith("/me/edit") || pathname.startsWith("/edit/") || pathname.startsWith("/welcome");
  if (installed || hidden || !ready || blocked || !(canPrompt || ios)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* shown again next visit */
    }
    setHidden(true);
  };

  return (
    <div
      className={`fixed inset-x-0 z-40 px-4 md:bottom-5 ${profile ? "bottom-[calc(72px+env(safe-area-inset-bottom))]" : "bottom-[calc(16px+env(safe-area-inset-bottom))]"}`} role="dialog" aria-label={tr("Get the ON app")}>
      <div className="mx-auto flex max-w-[480px] items-start gap-3 rounded-lg border border-border-subtle bg-surface-card p-4 shadow-lg">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-green-950">
          <Wordmark light className="!text-small" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-body text-body font-semibold text-text-primary">{tr("Get the ON app")}</div>
          {canPrompt ? (
            <p className="m-0 font-body text-small text-text-secondary">
              {tr("Add ON to your home screen. It opens full screen, like any app, and takes almost no space.")}
            </p>
          ) : (
            <IOSSteps />
          )}
          <div className="mt-3 flex gap-2">
            {canPrompt && (
              <Button size="sm" onClick={prompt}>
                {tr("Install")}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {tr("Not now")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Always-available version for the Settings page.
export function InstallCard() {
  const { installed, canPrompt, ios, prompt } = useInstall();
  return (
    <Card className="grid gap-3 p-5">
      <Label>{tr("Install app")}</Label>
      {installed ? (
        <p className="m-0 font-body text-small text-text-secondary">{tr("Already installed on this device.")}</p>
      ) : canPrompt ? (
        <div>
          <Button size="sm" onClick={prompt}>
            {tr("Install")}
          </Button>
        </div>
      ) : ios ? (
        <IOSSteps />
      ) : (
        <p className="m-0 font-body text-small text-text-secondary">{tr("Open this site in Chrome on Android or Safari on iPhone to install it.")}</p>
      )}
    </Card>
  );
}
