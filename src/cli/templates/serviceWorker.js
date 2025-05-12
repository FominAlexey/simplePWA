const CACHE_NAME = 'pwa-cache-v1';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Добавь сюда и другие необходимые ресурсы (CSS, JS и т.д.)
];

// Кешируем статические ресурсы при установке
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Удаляем старые кеши при активации
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    ))
  );
  self.clients.claim();
});

// Отвечаем на запросы: сначала пробуем сеть, если нет — ищем в кеше, если нет — offline.html
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Можно кешировать новые данные из сети
      const respClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
      return response;
    }).catch(() =>
      caches.match(event.request).then(cachedResponse =>
        cachedResponse || (event.request.mode === 'navigate'
          ? caches.match(OFFLINE_URL)
          : undefined)
      )
    )
  );
});
