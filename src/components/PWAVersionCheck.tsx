/**
 * @file: PWAVersionCheck.tsx
 * @description: Компонент для проверки версии PWA и обработки старых установок
 * @dependencies: React, useEffect
 * @created: 2024-12-25
 */

import React, { useEffect } from 'react';

export const PWAVersionCheck: React.FC = () => {
    useEffect(() => {
        // Отключаем автоматические проверки версий для предотвращения проблем
        console.log('PWAVersionCheck: отключен для предотвращения проблем с обновлениями');

        // Просто регистрируем Service Worker без принудительных обновлений
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            }).then((registration) => {
                console.log('Service Worker зарегистрирован:', registration);
            }).catch((error) => {
                console.error('Ошибка регистрации Service Worker:', error);
            });
        }
    }, []);

    return null; // Этот компонент не рендерит ничего
};
