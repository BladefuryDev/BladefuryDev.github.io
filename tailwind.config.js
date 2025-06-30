/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./assets/htmlAssets/navbar.html", "./index.html", "./assets/htmlAssets/footer.html"], // Scan all HTML and JS files for Tailwind classes
  theme: {
    extend: {},
  },
  plugins: [],
}