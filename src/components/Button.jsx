import React from "react";
import "./Button.css";

/**
 * Primary CTA button — mint-500 fill at rest, darkens to mint-700 on
 * hover/active, radius-sm corners per design-system radii rule (sm = 4px).
 */
export function Button({ size = "md", disabled = false, icon = null, children, onClick }) {
  const sizeClass = size === "lg" ? "btn-cta--lg" : size === "sm" ? "btn-cta--sm" : "";
  return (
    <button
      className={`btn-cta ${sizeClass}`.trim()}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
