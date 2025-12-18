const CACHE_NAME = 'jarvis-v2-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Ne pas mettre en cache les requêtes vers n8n
  if (event.request.url.includes('n8n.srv846378.hstgr.cloud')) {
    return event.respondWith(fetch(event.request));
  }

  // Pour index.html : stratégie Network First (toujours essayer le réseau d'abord)
  if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre à jour le cache avec la nouvelle version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si le réseau échoue, utiliser le cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Pour les autres ressources : stratégie Cache First (comme avant)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la ressource en cache si disponible
        if (response) {
          return response;
        }
        // Sinon, faire une requête réseau
        return fetch(event.request).then((response) => {
          // Ne pas mettre en cache les réponses non-OK
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
