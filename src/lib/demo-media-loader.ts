/**
 * @file: src/lib/demo-media-loader.ts
 * @description: Загрузчик демонстрационных медиа-файлов для страницы "О нас"
 * @dependencies: media-utils
 * @created: 2024-12-19
 */

import type { MediaItem } from '@/hooks/use-about-content';

// Статические демонстрационные медиа-файлы
export const demoMediaFiles: Omit<MediaItem, 'id' | 'order' | 'url'>[] = [
    {
        type: 'video',
        filename: 'demo-video-1.mp4',
        title: 'Мастер-класс: Восковые ручки',
        description: 'Демонстрация процесса создания 3D-копии руки из воска'
    },
    {
        type: 'video',
        filename: 'demo-video-2.mp4',
        title: 'Двойные восковые ручки',
        description: 'Создание парных восковых копий рук'
    }
];

// Загрузка демонстрационных медиа-файлов
export const loadDemoMedia = async (): Promise<MediaItem[]> => {
    const mediaItems: MediaItem[] = [];

    for (let i = 0; i < demoMediaFiles.length; i++) {
        const demoFile = demoMediaFiles[i];
        try {
            // Проверяем существование файла
            const response = await fetch(`/src/assets/about/${demoFile.filename}`);
            if (response.ok) {
                mediaItems.push({
                    id: `demo-${Date.now()}-${i}`,
                    type: demoFile.type,
                    url: `/src/assets/about/${demoFile.filename}`,
                    filename: demoFile.filename,
                    title: demoFile.title,
                    description: demoFile.description,
                    order: i
                });
            }
        } catch (error) {
            console.warn(`Failed to load demo media: ${demoFile.filename}`, error);
        }
    }

    return mediaItems;
};

// Проверка наличия демонстрационных медиа в контенте
export const hasDemoMedia = (content: any): boolean => {
    if (!content?.media || !Array.isArray(content.media)) {
        return false;
    }

    return content.media.some((item: MediaItem) =>
        item.id?.startsWith('demo-') ||
        item.filename?.includes('/demo-video-')
    );
};

// Инициализация демонстрационных медиа если контент пустой
export const initializeDemoMediaIfEmpty = async (currentContent: any) => {
    // Если медиа пустое или отсутствует, добавляем демонстрационные файлы
    if (!currentContent?.media || currentContent.media.length === 0) {
        const demoMedia = await loadDemoMedia();
        return {
            ...currentContent,
            media: demoMedia
        };
    }

    return currentContent;
};
