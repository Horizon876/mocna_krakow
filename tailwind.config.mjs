/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    // ---------------------------------------------------------------
    //  MOCna! – ścisła paleta marki (z pliku logo / identyfikacji)
    //  Bez czystej czerni. Tekst = grafit. Tło = czysta biel.
    // ---------------------------------------------------------------
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#ffffff",
      // Grafit zamiast #000000
      graphite: {
        DEFAULT: "#333333",
        soft: "#4b4b4b",
        muted: "#6b6b6b",
        100: "#f4f4f3",
        200: "#e7e6e4",
      },
      // Akcenty marki – dokładne wartości z logo (zmapowane na niebieskie na życzenie użytkownika)
      orange: {
        DEFAULT: "#2c5ea9",
        soft: "#5b87cb",
        ink: "#244d8f",
      },
      red: {
        DEFAULT: "#de3c42",
        soft: "#ec6a6f",
      },
      yellow: {
        DEFAULT: "#ffde00",
        soft: "#ffe95c",
        cream: "#fff7d1",
      },
      blue: {
        DEFAULT: "#2c5ea9",
        soft: "#5b87cb",
      },
      green: {
        DEFAULT: "#00955e",
        soft: "#3cb98a",
      },
      pink: {
        DEFAULT: "#e8afcd",
        soft: "#f4d4e4",
      },
    },
    extend: {
      fontFamily: {
        // Nagłówki – geometryczny display
        display: ['"Clash Display"', "ui-sans-serif", "system-ui", "sans-serif"],
        // Treść / menu
        sans: ['"Satoshi"', '"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Fluid typography (od text-5xl ~ do text-8xl) sterowana clamp()
      fontSize: {
        "fluid-sm": "clamp(0.95rem, 0.9rem + 0.3vw, 1.1rem)",
        "fluid-lg": "clamp(1.15rem, 1rem + 0.7vw, 1.6rem)",
        "fluid-xl": "clamp(1.6rem, 1.2rem + 1.8vw, 2.6rem)",
        "fluid-2xl": "clamp(2.2rem, 1.4rem + 3.2vw, 3.8rem)",
        "fluid-hero": "clamp(2.2rem, 0.9rem + 4.5vw, 4.75rem)",
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      lineHeight: {
        tighter: "0.95",
      },
      borderRadius: {
        blob: "42% 58% 63% 37% / 41% 44% 56% 59%",
        "blob-2": "63% 37% 41% 59% / 47% 62% 38% 53%",
      },
      boxShadow: {
        soft: "0 24px 60px -28px rgba(51,51,51,0.28)",
        glass: "0 8px 40px -12px rgba(51,51,51,0.22), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glow-orange": "0 0 0 0 rgba(243,146,0,0.55)",
      },
      keyframes: {
        // Pulsujący ciepły blask dla karty „Kawa zawieszona”
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(243,146,0,0.0), 0 18px 50px -20px rgba(243,146,0,0.55)",
          },
          "50%": {
            boxShadow:
              "0 0 0 14px rgba(243,146,0,0.0), 0 22px 70px -18px rgba(243,146,0,0.85)",
          },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-18px) rotate(3deg)" },
        },
        "floaty-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(22px) rotate(-4deg)" },
        },
        "blob-morph": {
          "0%, 100%": { borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" },
          "50%": { borderRadius: "63% 37% 41% 59% / 47% 62% 38% 53%" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        glow: "glow 2.8s ease-in-out infinite",
        floaty: "floaty 9s ease-in-out infinite",
        "floaty-slow": "floaty-slow 13s ease-in-out infinite",
        "blob-morph": "blob-morph 14s ease-in-out infinite",
        marquee: "marquee 38s linear infinite",
        "rise-in": "rise-in 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
      transitionTimingFunction: {
        organic: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        400: "400ms",
      },
    },
  },
  plugins: [],
};
