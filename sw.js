const CACHE_NAME = 'gym-app-v3';

// ኦፍላይን እንዲያዙ የሚፈለጉ የፕሮጀክቱ ፋይሎች
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. Install Event - ፋይሎቹን በሙሉ Cache ውስጥ ማስገባት
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 2. Activate Event - አሮጌ የነበሩ Cacheዎችን ማጽዳት
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - ኢንተርኔት በሌለበት ጊዜ ከ Cache ማቅረብ
self.addEventListener('fetch', event => {
  // የ Google Sheet API ጥሪዎችን ከ Cache ነፃ ማድረግ
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache ከተገኘ ከዛው ያቀርባል
        if (response) {
          return response;
        }
        // ካልተገኘ ከኢንተርኔት ወስዶ Cache ያደርገዋል
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          let responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
      .catch(() => {
        // ኢንተርኔት በሌለበት ሰዓት ዋናውን index.html እንዲከፍት
        return caches.match('./index.html');
      })
  );
});