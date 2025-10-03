/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      container: { center: true, padding: { DEFAULT: "1rem", lg: "2rem" } },
    },
  },
  plugins: [],
}
