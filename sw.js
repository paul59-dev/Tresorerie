const CACHE_NAME = 'finance-app-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// 1. Installation : Mise en cache sécurisée
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force le Service Worker à s'activer immédiatement
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // On ajoute les ressources une par une pour éviter qu'une erreur 404 ne bloque tout le SW
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Impossible de mettre en cache : ${asset}`, err);
        }
      }
    })
  );
});

// 2. Activation : Prise de contrôle immédiate et nettoyage des anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interception des requêtes réseau (Cache avec fallback Réseau)
self.addEventListener('fetch', (e) => {
  // On ne met pas en cache les requêtes de l'API Supabase pour toujours avoir les données réelles
  if (e.request.url.includes('supabase.co')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Fallback en cas d'absence de réseau
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});