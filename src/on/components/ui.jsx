import { Link } from "react-router-dom";
import { mediaUrl } from "../lib/media.js";
import { opt, tr } from "../lib/i18n.jsx";

// Shared building blocks for ON. Variants follow the design system's
// Button / Badge / Input specs (D:\Aboustate Design System\components).

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border font-body font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45";
const BUTTON_SIZES = { sm: "px-3 py-1 text-micro", md: "px-5 py-2 text-small", lg: "px-6 py-3 text-body" };
const BUTTON_VARIANTS = {
  primary: "border-transparent bg-accent text-green-950 hover:bg-mint-300",
  secondary: "border-border-subtle bg-transparent text-text-primary hover:border-green-950",
  ghost: "border-transparent bg-transparent text-text-accent hover:text-text-primary",
  inverse: "border-transparent bg-beige-100 text-green-950 hover:bg-white",
  dark: "border-transparent bg-green-900 text-beige-100 hover:bg-green-950",
  danger: "border-border-subtle bg-transparent text-text-primary hover:border-green-950 hover:bg-beige-300",
};

export function Button({ variant = "primary", size = "md", to, href, className = "", ...rest }) {
  const cls = `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest} />;
  if (href) return <a href={href} className={cls} {...rest} />;
  return <button type="button" className={cls} {...rest} />;
}

export function Badge({ tone = "neutral", children, className = "" }) {
  const tones = {
    neutral: "bg-beige-300 text-green-950",
    accent: "bg-accent text-green-950",
    inverse: "bg-green-700 text-beige-100",
    outline: "border border-border-subtle text-text-secondary",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-xs px-2 py-1 font-mono text-[10px] uppercase leading-none tracking-mono ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function Label({ children }) {
  return <span className="font-mono text-micro uppercase tracking-mono text-text-secondary">{children}</span>;
}

const FIELD = "w-full rounded-sm border border-border-subtle bg-surface-card px-3 py-2 font-body text-small text-text-primary outline-none transition-colors duration-150 placeholder:text-beige-700 focus:border-green-950";

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="font-body text-micro font-medium text-text-secondary">{tr(label)}</span>}
      {children}
      {hint && !error && <span className="font-body text-micro text-text-secondary">{tr(hint)}</span>}
      {error && <span className="font-body text-micro font-medium text-text-primary">{tr(error)}</span>}
    </label>
  );
}

export function Input({ label, hint, error, className, placeholder, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <input className={FIELD} placeholder={placeholder && tr(placeholder)} {...rest} />
    </Field>
  );
}

export function Textarea({ label, hint, className, placeholder, ...rest }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea className={`${FIELD} min-h-[110px] resize-y leading-body`} placeholder={placeholder && tr(placeholder)} {...rest} />
    </Field>
  );
}

export function Select({ label, hint, options, placeholder, className, ...rest }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className={`${FIELD} appearance-none`} {...rest}>
        <option value="">{tr(placeholder ?? "Choose")}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {opt(o)}
          </option>
        ))}
      </select>
    </Field>
  );
}

// Multi-select as tappable chips; feels native on phones.
export function Chips({ options, value = [], onChange, max }) {
  const toggle = (o) => {
    if (value.includes(o)) onChange(value.filter((v) => v !== o));
    else if (!max || value.length < max) onChange([...value, o]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            aria-pressed={on}
            className={`rounded-pill border px-3 py-1 font-body text-small transition-colors duration-150 ${
              on ? "border-green-900 bg-green-900 text-beige-100" : "border-border-subtle bg-surface-card text-text-primary hover:border-green-950"
            }`}
          >
            {opt(o)}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-body text-small font-medium text-text-primary">{tr(label)}</span>
        {hint && <span className="block font-body text-micro text-text-secondary">{tr(hint)}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-[20px] w-[36px] shrink-0 rounded-pill transition-colors duration-150 ${checked ? "bg-green-900" : "bg-beige-500"}`}
      >
        <span className={`absolute top-[2px] h-4 w-4 rounded-pill bg-white shadow-sm transition-all duration-150 ${checked ? "start-[18px]" : "start-[2px]"}`} />
      </button>
    </label>
  );
}

export function Avatar({ profile, size = 40, ring = false }) {
  const src = mediaUrl(profile?.avatar_path);
  const initials = (profile?.display_name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill bg-mint-300 font-display font-semibold text-green-900 ${
        ring ? "ring-4 ring-surface-card" : ""
      }`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials}
    </span>
  );
}

export function Verified({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label={tr("Verified")} role="img" className="inline-block shrink-0">
      <path
        fill="var(--mint-500)"
        d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.8-.9 3.1.9 3.1-2.7 1.8-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3-2.7-1.8.9-3.1-.9-3.1 2.7-1.8 1-3 3.2.2z"
      />
      <path fill="none" stroke="var(--green-950)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M7.8 12.3l2.8 2.8 5.6-5.8" />
    </svg>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-9 text-text-secondary" role="status">
      <span className="h-2 w-2 animate-pulse rounded-pill bg-accent" />
      <span className="font-mono text-micro uppercase tracking-mono">{tr(label)}</span>
    </div>
  );
}

export function Empty({ title, body, action }) {
  return (
    <div className="rounded-lg border border-dashed border-border-subtle bg-surface-card px-5 py-8 text-center">
      <p className="m-0 font-display text-h3 font-semibold tracking-tight text-text-primary">{tr(title)}</p>
      {body && <p className="mx-auto mt-2 max-w-[44ch] font-body text-small text-text-secondary">{tr(body)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`rounded-lg border border-border-subtle bg-surface-card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Notice({ tone = "neutral", children }) {
  const tones = {
    neutral: "border-border-subtle bg-surface-card text-text-primary",
    accent: "border-mint-500 bg-mint-100 text-green-950",
    dark: "border-green-700 bg-green-900 text-beige-100",
  };
  return <div className={`rounded-md border px-4 py-3 font-body text-small ${tones[tone]}`}>{children}</div>;
}

export function Wordmark({ light = false, className = "" }) {
  return (
    <span dir="ltr" className={`inline-flex items-baseline gap-1 font-display text-h3 font-extrabold tracking-tight ${light ? "text-beige-100" : "text-text-primary"} ${className}`}>
      ON
      <span className="relative top-[-2px] inline-block h-2 w-2 rounded-pill bg-accent" aria-hidden="true">
        <span className="absolute inset-0 animate-ping rounded-pill bg-accent opacity-60" />
      </span>
    </span>
  );
}
