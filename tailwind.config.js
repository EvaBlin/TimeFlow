/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        textMain: "#1E293B",
        textMuted: "#64748B",
        priorityHigh: "#F43F5E",
        priorityMedium: "#F59E0B",
        priorityLow: "#3B82F6"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl: "12px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04)"
      }
    }
  },
  plugins: []
};

