/** @type {import('tailwindcss').Config} */
module.exports = {
  // Follow the site's theme toggle (html.dark / html.light) instead of the OS preference
  darkMode: 'class',
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