// Service Worker для PWA
const CACHE_NAME = 'waxhands-pwa-v3.2.0-20250925-network-first';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72-white.png?v=3.0.0',
  '/icons/icon-96x96-white.png?v=3.0.0',
  '/icons/icon-128x128-white.png?v=3.0.0',
  '/icons/icon-144x144-white.png?v=3.0.0',
  '/icons/icon-152x152-white.png?v=3.0.0',
  '/icons/icon-180x180-white.png?v=3.0.0',
  '/icons/icon-192x192-white.png?v=3.0.0',
  '/icons/icon-192x192-maskable.png?v=3.0.0',
  '/icons/icon-384x384-white.png?v=3.0.0',
  '/icons/icon-512x512-white.png?v=3.0.0',
  '/icons/icon-512x512-maskable.png?v=3.0.0',
  '/icons/icon-1024x1024-white.png?v=3.0.0'
];

// Установка service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v3.1.0 with network-first strategy...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cached all files');
        // Принудительно активируем новый Service Worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Install failed:', error);
      })
  );
});

// Перехват запросов с network-first стратегией
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Для всех критически важных файлов используем network-first
    fetch(event.request)
      .then((networkResponse) => {
        // Если сетевой запрос успешен, кэшируем только статические ресурсы
        if (networkResponse.ok &&
          (event.request.url.includes('/icons/') ||
            event.request.url.includes('/manifest.json'))) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся получить из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Для HTML файлов возвращаем index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          // Для остальных запросов возвращаем ошибку
          throw new Error('Network error and no cached version available');
        });
      })
  );
});

// Активация service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v3.2.0 with network-first...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем ВСЕ старые кэши для принудительного обновления
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated v3.2.0 - All old caches cleared, network-first enabled');
      // Безопасно обновляем клиентов
      return self.clients.claim();
    }).catch((error) => {
      console.error('Service Worker: Activation failed:', error);
    })
  );
});

// Обработка сообщений от main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message, activating immediately');
    self.skipWaiting();
  }
});

// Push уведомления
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление',
    icon: '/icons/icon-192x192-white.png?v=3.0.0',
    badge: '/icons/icon-72x72-white.png?v=3.0.0',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть',
        icon: '/icons/icon-192x192-white.png?v=3.0.0'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon-192x192-white.png?v=3.0.0'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Студия МК "Восковые ручки"', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 