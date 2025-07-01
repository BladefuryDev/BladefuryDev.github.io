// A new cache name is used to ensure the service worker updates correctly.
const CACHE_NAME = "tome-tales-cache-v3"; 
const urlsToCache = [
 "./",
  "./index.html",
  "./styles.css",
  "./src/output.css", // This path is correct based on your index.html
  "./app.js",
  "./manifest.json",
  "./favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icons8-settings-100.png",
  "./samples/sample_data.json"
];

// Install the service worker and cache all necessary assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      // Use no-cache to ensure we get the freshest files from the server during install
      const cachePromises = urlsToCache.map(url => {
        return fetch(new Request(url, {cache: 'no-cache'})).then(response => {
          if (!response.ok) {
            throw new TypeError('Bad response status ' + response.status);
          }
          return cache.put(url, response);
        });
      });
      return Promise.all(cachePromises);
    }).catch((error) => {
      console.error("Failed to cache:", error);
    })
  );
});

// Fetch assets from the cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch((error) => {
        console.error("Fetch failed; returning offline page instead.", error);
        // Optionally return a fallback page here if needed
      });
    })
  );
});

// Update the service worker and clear old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});
