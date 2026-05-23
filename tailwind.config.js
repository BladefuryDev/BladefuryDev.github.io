/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/*.html",
    "./src/Pages/**/*.html",
    "./src/js/**/*.js",
    "./assets/htmlAssets/*.html",
    "./index.html"
  ], // Scan HTML and JS files (excluding TTMP subproject) for Tailwind classes
  theme: {
    extend: {},
  },
  plugins: [],
}