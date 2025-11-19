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
// WebSocket теперь работает на том же порту что и backend (3001)
export const WS_BASE_URL = isProduction
    ? import.meta.env.VITE_WS_URL || 'wss://waxhands.ru/ws'
    : import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

// Функция для получения полного URL файла
export const getFileUrl = (filePath: string): string => {
    if (!filePath) return '';

    // Если путь уже полный URL, возвращаем как есть
    if (filePath.startsWith('http')) {
        return filePath;
    }

    // Если это blob URL или data URL, возвращаем как есть
    if (filePath.startsWith('blob:') || filePath.startsWith('data:')) {
        return filePath;
    }

    // Если путь начинается с /uploads, используем основной домен
    if (filePath.startsWith('/uploads')) {
        const baseUrl = API_BASE_URL.replace('/api', '');
        return `${baseUrl}${filePath}`;
    }

    // Иначе считаем что это относительный путь
    return `${API_BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

// Функция для получения первого изображения с fallback
export const getFirstImageUrl = (images: string[] | undefined, type: 'style' | 'option'): string => {
    if (!images || images.length === 0) {
        // Fallback изображения встроены прямо в функцию
        return type === 'style'
            ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9InVybCgjc3R5bGVHcmFkaWVudCkiLz4KPGRlZnM+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJzdHlsZUdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4QjVDRjY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQzQ4OTk7c3RvcC1vcGFjaXR5OjEiIC8+CiAgPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8cGF0aCBkPSJNMjAgMzBDMjAgMjUuNTgxNyAyMy41ODE3IDIyIDI4IDIySDUyQzU2LjQxODMgMjIgNjAgMjUuNTgxNyA2MCAzMFY1MEM2MCA1NC40MTgzIDU2LjQxODMgNTggNTIgNThIMjhDMjMuNTgxNyA1OCAyMCA1NC40MTgzIDIwIDUwVjMwWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMiIvPgo8cGF0aCBkPSJNMjUgMzVDMjUgMzIuNzkwOSAyNi43OTA5IDMxIDI5IDMxSDUxQzUzLjIwOTEgMzEgNTUgMzIuNzkwOSA1NSAzNVY0NUM1NSA0Ny4yMDkxIDUzLjIwOTEgNDkgNTEgNDlIMjlDMjYuNzkwOSA0OSAyNSA0Ny4yMDkxIDI1IDQ1VjM1WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMzUiIGN5PSI0MCIgcj0iMyIgZmlsbD0iIzhCNUNGNiIvPgo8Y2lyY2xlIGN4PSI0NSIgY3k9IjQwIiByPSIzIiBmaWxsPSIjRUM0ODk5Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI2NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZm9udC13ZWlnaHQ9ImJvbGQiPlNUWUxMPC90ZXh0Pgo8L3N2Zz4K'
            : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9InVybCgjb3B0aW9uR3JhZGllbnQpIi8+CjxkZWZzPgogIDxsaW5lYXJHcmFkaWVudCBpZD0ib3B0aW9uR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzNCODJGNjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzA2QjZENjtzdG9wLW9wYWNpdHk6MSIgLz4KICA8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMCAyNUMyMCAyMC41ODE3IDIzLjU4MTcgMTcgMjggMTdINjJDNjYuNDE4MyAxNyA3MCAyMC41ODE3IDcwIDI1VjU1QzcwIDU5LjQxODMgNjYuNDE4MyA2MyA2MiA2M0gyOEMyMy41ODE3IDYzIDIwIDU5LjQxODMgMjAgNTVWMjVaIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC4yIi8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iMzUiIHI9IjgiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0zNSAzNUwzOCAzOEw0NSAzMSIgc3Ryb2tlPSIjM0I4MkY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cmVjdCB4PSIzMCIgeT0iNDUiIHdpZHRoPSIyMCIgaGVpZ2h0PSI4IiByeD0iNCIgZmlsbD0id2hpdGUiLz4KPHRleHQgeD0iNDAiIHk9IjY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCI+T1BUSU9OPC90ZXh0Pgo8L3N2Zz4K';
    }
    return getFileUrl(images[0]);
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