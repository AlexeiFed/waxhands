/**
 * @file: config.ts
 * @description: Конфигурация приложения для development и production
 * @created: 2024-12-19
 */

// Определяем окружение
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// API URL в зависимости от окружения
export const API_BASE_URL = isProduction
    ? import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'
    : 'http://localhost:3001';

// WebSocket URL в зависимости от окружения
export const WS_BASE_URL = isProduction
    ? import.meta.env.VITE_WS_URL || 'wss://waxhands.ru/ws'
    : 'ws://localhost:3002';

// Функция для получения полного URL файла
export const getFileUrl = (filePath: string): string => {
    if (!filePath) return '';

    // Если путь уже полный URL, возвращаем как есть
    if (filePath.startsWith('http')) {
        return filePath;
    }

    // Если путь начинается с /uploads, определяем тип uploads
    if (filePath.startsWith('/uploads')) {
        // Backend uploads (аватары, загруженные пользователями) - используем основной домен
        if (filePath.includes('/avatars/') || filePath.includes('/images/') || filePath.includes('/videos/')) {
            // Проверяем, это backend uploads или frontend uploads
            // Если путь содержит timestamp в имени файла (например, avatar-1756018943179-180166613.jpg)
            // то это backend uploads
            const fileName = filePath.split('/').pop() || '';
            if (fileName.match(/^\w+-\d+-\d+\.\w+$/)) {
                // Backend uploads - используем основной домен
                const baseUrl = API_BASE_URL.replace('/api', '');
                return `${baseUrl}${filePath}`;
            }
        }

        // Frontend uploads (стили, опции) - используем основной домен
        const baseUrl = API_BASE_URL.replace('/api', '');
        return `${baseUrl}${filePath}`;
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
    name: import.meta.env.VITE_APP_NAME || 'Студия МК "Восковые ручки"',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Мастер-классы по лепке из воска',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    isProduction,
    apiUrl: API_BASE_URL,
    wsUrl: WS_BASE_URL
};