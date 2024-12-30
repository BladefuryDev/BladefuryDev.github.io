document.addEventListener("DOMContentLoaded", () => {
  // Get all navigation links
  const navLinks = document.querySelectorAll("nav .nav-items a");

  // Set to keep track of already preloaded URLs
  const preloadedLinks = new Set();

  navLinks.forEach((link) => {
    const url = link.href;

    if (!preloadedLinks.has(url)) {
      preloadedLinks.add(url);

      const preload = document.createElement("link");
      preload.rel = "prefetch";
      preload.href = url;

      document.head.appendChild(preload);
    }
  });
});
