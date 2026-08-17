# CLAUDE.md

## Design System Architecture

Before generating any UI component (HTML, JSX, CSS, or Tailwind classes), always:

1. Check `D:\Aboustate Design System` for existing tokens, components, and guidelines — colors, typography, spacing, radii, component `.jsx`/`.prompt.md` files, and `guidelines/*.html` pages.
2. Check [tailwind.config.js](tailwind.config.js) and [globals.css](globals.css) in this project root — both are generated from that design system and hold the canonical brand tokens (green/mint/beige color scale, Funnel Display + DM Sans + IBM Plex Mono fonts, 4px-based spacing scale, radius scale).
3. Never hardcode hex colors, font names, spacing values, or radii — use the existing token names (`--green-900`, `--space-4`, `text-accent`, etc.) or their Tailwind equivalents.
4. If a needed token or pattern is missing from both sources, flag it instead of inventing one.
