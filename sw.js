const CACHE_NAME = 'fitforge-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/css/styles.css',
  './assets/js/app.js',
  './assets/js/modules/db.js',
  './assets/js/modules/sanitize.js',
  './assets/js/modules/metrics.js',
  './assets/js/modules/recommendation.js',
  './assets/js/modules/progression.js',
  './assets/js/modules/chart.js',
  './assets/js/modules/onboarding.js',
  './assets/js/modules/timer.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
