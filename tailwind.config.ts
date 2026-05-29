import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        success: "var(--success)",
        warn: "var(--warn)",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)",
        "card-dark": "0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.25)",
      },
      maxWidth: {
        content: "1100px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 120ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
