import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: "hsl(var(--secondary-surface))",
        brand: {
          yellow: "#D6B452",
          green: "#018402",
          red: "#FB110A",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ["Inter", '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        "2xl": "calc(var(--radius-xl) + 0.25rem)",
      },
      boxShadow: {
        sm: "0 1px 2px rgb(17 24 39 / 0.04)",
        md: "0 6px 20px rgb(17 24 39 / 0.06)",
        lift: "0 16px 40px -12px rgb(17 24 39 / 0.12)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        base: "280ms",
        slow: "520ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "btn-scan": {
          "0%": { transform: "translateX(-150%)" },
          "100%": { transform: "translateX(600%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 520ms cubic-bezier(0.22,1,0.36,1) both",
        "btn-scan": "btn-scan 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
