/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          950: "#011f1a",
          900: "#02362f",
          700: "#1b4943",
          500: "#4c706a",
          300: "#7e9792",
          100: "#d5dbd7",
        },
        mint: {
          700: "#65826b",
          500: "#90b495",
          300: "#bacfbb",
          100: "#e5eae2",
        },
        beige: {
          700: "#898780",
          500: "#c3bcb3",
          300: "#dfdad4",
          100: "#f2efeb",
        },
        black: "#020c0a",
        white: "#faf8f5",
        surface: {
          page: "#f2efeb",
          card: "#faf8f5",
          inverse: "#02362f",
          sunken: "#dfdad4",
        },
        text: {
          primary: "#011f1a",
          secondary: "#4c706a",
          "on-inverse": "#f2efeb",
          "on-inverse-muted": "#bacfbb",
          accent: "#65826b",
        },
        accent: {
          DEFAULT: "#90b495",
          strong: "#02362f",
        },
        border: {
          subtle: "#c3bcb3",
          "on-inverse": "#1b4943",
        },
        "focus-ring": "#90b495",
      },
      fontFamily: {
        display: ["Funnel Display", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "SF Mono", "ui-monospace", "Menlo", "monospace"],
      },
      fontSize: {
        "display-xl": "clamp(3.5rem, 6vw, 6.5rem)",
        "display-l": "clamp(2.75rem, 4.5vw, 4.5rem)",
        h1: "clamp(2rem, 3vw, 3rem)",
        h2: "1.75rem",
        h3: "1.375rem",
        "body-l": "1.125rem",
        body: "1rem",
        small: "0.875rem",
        micro: "0.75rem",
      },
      lineHeight: {
        tight: "1.02",
        heading: "1.12",
        body: "1.55",
      },
      letterSpacing: {
        tight: "-0.02em",
        mono: "0.08em",
      },
      fontWeight: {
        light: "300",
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        7: "48px",
        8: "64px",
        9: "96px",
        10: "128px",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "10px",
        pill: "999px",
      },
      borderWidth: {
        DEFAULT: "1px",
        thick: "1.5px",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};
