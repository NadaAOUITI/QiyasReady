/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1E3A8A", 800: "#1E3A8A", 900: "#172554" },
        gold: { DEFAULT: "#F59E0B", 500: "#F59E0B" },
      },
      fontFamily: {
        sans: ['"Cairo"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
