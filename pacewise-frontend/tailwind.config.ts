import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080810",
        surface: "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
        "glow-primary": "#FC4C02",
        "glow-secondary": "#6366f1",
        "text-primary": "#f1f5f9",
        "text-muted": "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 0 40px rgba(252, 76, 2, 0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-hover": "0 0 60px rgba(252, 76, 2, 0.15)",
        "glow-orange": "0 0 20px rgba(252, 76, 2, 0.8)",
        "glow-orange-soft": "0 0 40px rgba(252, 76, 2, 0.2)",
        "glow-indigo": "0 0 20px rgba(99, 102, 241, 0.6)",
        "glow-red": "0 0 20px rgba(244, 63, 94, 0.5)",
      },
      backgroundImage: {
        "holographic":
          "linear-gradient(135deg, #FC4C02, #f43f5e, #a855f7, #6366f1, #06b6d4)",
        "holographic-subtle":
          "linear-gradient(135deg, rgba(252,76,2,0.15), rgba(99,102,241,0.15))",
      },
      animation: {
        "holographic-shift": "holographic-shift 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "holographic-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
    },
  },
  plugins: [],
};

export default config;
