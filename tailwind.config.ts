import type { Config } from "tailwindcss";

const config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./tests/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "var(--color-black)",
        line: "var(--color-line)",
        muted: "var(--color-muted)",
        paper: "var(--color-paper)",
        "red-accent": "var(--color-red)",
        white: "var(--color-white)",
      },
      fontFamily: {
        code: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
        sans: ["Prompt", "Trebuchet MS", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
