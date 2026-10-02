const CACHE_NAME = 'broders-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Saat install, cache shell utama dan langsung paksa update (skipWaiting)
self.addEventListener('install', event => {
  self.skipWaiting(); // Sangat Canggih: Langsung update worker tanpa tunggu tab ditutup
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Bersihkan cache lama jika ada versi baru
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Langsung kendalikan semua client/tab
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Strategi: Network First, Fallback to Cache
// Artinya selalu coba ambil yang terbaru dari internet, kalau offline baru pakai cache
self.addEventListener('fetch', event => {
  // Hanya proses request GET (jangan cache request POST ke API Spreadsheet)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika online dan berhasil, simpan/update ke cache lalu kembalikan response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request);
      })
  );
});
