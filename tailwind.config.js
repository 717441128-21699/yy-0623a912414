/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        site: {
          bg: "#F8F5F0",
          orange: "#FF6B1A",
          orangeDark: "#E55A0E",
          dark: "#2C3E50",
          darkLight: "#425A72",
          pass: "#27AE60",
          passBg: "#E8F8EF",
          fail: "#E74C3C",
          failBg: "#FDECEA",
          warn: "#F39C12",
          warnBg: "#FEF5E7",
          card: "#FFFFFF",
          border: "#E5E0D8",
        },
      },
      fontSize: {
        "title-lg": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "title-md": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "btn-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "26px", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "500" }],
      },
      spacing: {
        "safe-bottom": "calc(80px + env(safe-area-inset-bottom))",
      },
      boxShadow: {
        card: "0 4px 16px rgba(44, 62, 80, 0.08)",
        btn: "0 4px 12px rgba(255, 107, 26, 0.35)",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
      },
    },
  },
  plugins: [],
};
