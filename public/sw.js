// Service Worker для Wax Hands PWA
const CACHE_NAME = 'wax-hands-v1.5.0';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
    // Убираем bundle.js и main.css - они не существуют в dev режиме Vite
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // Кэшируем файлы по одному с обработкой ошибок
                return Promise.allSettled(
                    urlsToCache.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('Failed to cache:', url, err);
                            return null;
                        })
                    )
                );
            })
            .catch(err => {
                console.error('Failed to open cache:', err);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    // Пропускаем API запросы, Chrome extension, dev server
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('chrome-extension://') ||
        event.request.url.includes('localhost:') ||
        event.request.url.includes('127.0.0.1:')) {
        return; // Не перехватываем эти запросы
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем кэшированный ответ, если он есть
                if (response) {
                    return response;
                }

                // Иначе делаем запрос к сети
                return fetch(event.request).then(
                    (response) => {
                        // Проверяем, что ответ валидный
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Клонируем ответ только для кэшируемых ресурсов
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => {
                                console.warn('Failed to cache response:', err);
                            });

                        return response;
                    }
                ).catch((error) => {
                    console.warn('Fetch failed for:', event.request.url, error);
                    // Возвращаем базовую страницу для навигационных запросов
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    throw error;
                });
            })
            .catch((error) => {
                console.warn('Cache match failed:', error);
                // Fallback на сетевой запрос
                return fetch(event.request).catch(err => {
                    console.error('Both cache and network failed:', err);
                    throw err;
                });
            })
    );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление от Wax Hands',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть приложение',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icon-192x192.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Wax Hands PWA', options)
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