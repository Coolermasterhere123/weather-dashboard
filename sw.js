const CACHE_NAME = 'weather-v1';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json', '/api/config'];
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c) { return c.addAll(urlsToCache); }));
});
self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); }));
});