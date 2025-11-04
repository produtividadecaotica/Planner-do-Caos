/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/planning/**/*.{js,jsx,ts,tsx}",
    "./src/ui/**/*.{js,jsx,ts,tsx}",
    "./src/contexts/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      /* Paleta baseada em CSS variables (defina os valores em :root e .dark no index.css) */
      colors: {
        border: "hsl(var(--pc-border))",
        input: "hsl(var(--pc-input))",
        ring: "hsl(var(--pc-ring))",
        background: "hsl(var(--pc-bg))",
        foreground: "hsl(var(--pc-fg))",

        primary: {
          DEFAULT: "hsl(var(--pc-primary))",     // roxo principal
          foreground: "hsl(var(--pc-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--pc-secondary))",   // dourado
          foreground: "hsl(var(--pc-secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--pc-muted))",
          foreground: "hsl(var(--pc-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--pc-accent))",
          foreground: "hsl(var(--pc-accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--pc-card))",
          foreground: "hsl(var(--pc-card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--pc-destructive))",
          foreground: "hsl(var(--pc-destructive-foreground))",
        },

        /* atalhos neutros usuais (mantém compatibilidade com utilitários do Tailwind) */
        zinc: require("tailwindcss/colors").zinc,
        amber: require("tailwindcss/colors").amber,
        emerald: require("tailwindcss/colors").emerald,
        purple: require("tailwindcss/colors").purple,
        yellow: require("tailwindcss/colors").yellow,
        blue: require("tailwindcss/colors").blue,
        red: require("tailwindcss/colors").red,
      },

      fontFamily: {
        // escolha minimalista/elegante (troque por tua fonte custom se quiser):
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"],
      },

      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
        "2xl": "1.25rem",
      },

      boxShadow: {
        // sombra suave e neutra pros cards/modais
        card: "0 6px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
        soft: "0 8px 30px rgba(0,0,0,0.08)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};