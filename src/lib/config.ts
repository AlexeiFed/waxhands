/**
 * @file: config.ts
 * @description: Конфигурация приложения для development и production
 * @created: 2024-12-19
 */

// Определяем окружение
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// API URL в зависимости от окружения
export const API_BASE_URL = isProduction
    ? import.meta.env.VITE_API_URL || 'https://your-domain.com/api'
    : 'http://localhost:3001';

// WebSocket URL в зависимости от окружения
export const WS_BASE_URL = isProduction
    ? import.meta.env.VITE_WS_URL || 'wss://your-domain.com/api/chat/ws'
    : 'ws://localhost:3001/api/chat/ws';

// Функция для получения полного URL файла
export const getFileUrl = (filePath: string): string => {
    if (!filePath) return '';

    // Если путь уже полный URL, возвращаем как есть
    if (filePath.startsWith('http')) {
        return filePath;
    }

    // Если путь начинается с /uploads, добавляем базовый URL
    if (filePath.startsWith('/uploads')) {
        return `${API_BASE_URL}${filePath}`;
    }

    // Если это blob URL или data URL, возвращаем как есть
    if (filePath.startsWith('blob:') || filePath.startsWith('data:')) {
        return filePath;
    }

    // Иначе считаем что это относительный путь
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

// Конфигурация приложения
export const APP_CONFIG = {
    name: import.meta.env.VITE_APP_NAME || 'Wax Hands PWA',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Детские услуги и мастер-классы',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isProduction,
    apiUrl: API_BASE_URL,
    wsUrl: WS_BASE_URL
};