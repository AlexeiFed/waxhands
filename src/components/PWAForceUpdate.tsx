/**
 * @file: PWAForceUpdate.tsx
 * @description: Компонент для принудительного обновления PWA при изменении версии
 * @dependencies: React, useAuth
 * @created: 2024-12-25
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface SWUpdateMessage {
    type: string;
    version: string;
    message: string;
}

export const PWAForceUpdate: React.FC = () => {
    const [showUpdate, setShowUpdate] = useState(false);
    const [updateMessage, setUpdateMessage] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Проверяем, показывали ли мы уже обновление в этой сессии
        const hasShownUpdate = sessionStorage.getItem('pwa-update-shown') === 'true';
        if (hasShownUpdate) {
            return; // Не показываем повторно
        }

        // Проверяем версию в localStorage
        const currentVersion = localStorage.getItem('pwa-version') || '2.0.0';
        const latestVersion = '3.0.0';

        // Показываем обновление только если версия устарела
        if (currentVersion !== latestVersion) {
            setShowUpdate(true);
            setUpdateMessage('Доступна новая версия приложения с улучшениями!');
            sessionStorage.setItem('pwa-update-shown', 'true');
        }

        // Проверяем, нужно ли принудительное обновление
        const shouldForceUpdate = localStorage.getItem('force-update') === 'true';
        if (shouldForceUpdate) {
            setShowUpdate(true);
            setUpdateMessage('Требуется обновление для корректной работы приложения');
            sessionStorage.setItem('pwa-update-shown', 'true');
        }
    }, []);

    const handleUpdate = async () => {
        if (isUpdating) return; // Предотвращаем множественные нажатия

        setIsUpdating(true);

        try {

            // Обновляем версию в localStorage
            localStorage.setItem('pwa-version', '3.0.0');
            localStorage.removeItem('force-update');
            sessionStorage.removeItem('pwa-update-shown');

            // Очищаем кэш
            if ('caches' in window) {
                const cacheNames = await caches.keys();

                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }

            // Обновляем Service Worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {

                    await registration.update();
                }
            }

            // Небольшая задержка перед перезагрузкой
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error('Ошибка при обновлении:', error);
            setIsUpdating(false);

            // Принудительная перезагрузка
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleClose = () => {
        setShowUpdate(false);
        sessionStorage.setItem('pwa-update-shown', 'true');
    };

    if (!showUpdate) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Обновление приложения
                </h2>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    {updateMessage}
                </p>

                <p className="text-sm text-gray-500 mb-6">
                    Это займет всего несколько секунд и обеспечит корректную работу приложения.
                </p>

                <div className="flex gap-3">
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                        {isUpdating ? 'Обновляем...' : 'Обновить сейчас'}
                    </Button>
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        disabled={isUpdating}
                        className="px-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                        Позже
                    </Button>
                </div>
            </div>
        </div>
    );
};
