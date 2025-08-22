/**
 * @file: src/lib/assets-scanner.ts
 * @description: Сканер файлов в папке assets/about
 * @dependencies: File API
 * @created: 2024-12-19
 */

import type { MediaItem } from '@/hooks/use-about-content';

// Список известных файлов в папке assets/about
const KNOWN_FILES = [
    'demo-video-1.mp4',
    'demo-video-2.mp4'
];

// Метаданные для известных файлов
const FILE_METADATA: Record<string, { title: string; description: string; type: 'image' | 'video' }> = {
    'demo-video-1.mp4': {
        title: 'Мастер-класс: Восковые ручки',
        description: 'Демонстрация процесса создания 3D-копии руки из воска',
        type: 'video'
    },
    'demo-video-2.mp4': {
        title: 'Двойные восковые ручки',
        description: 'Создание парных восковых копий рук',
        type: 'video'
    }
};

// Сканирование папки assets/about
export const scanAssetsFolder = async (): Promise<MediaItem[]> => {
    const mediaItems: MediaItem[] = [];

    for (let i = 0; i < KNOWN_FILES.length; i++) {
        const filename = KNOWN_FILES[i];
        const metadata = FILE_METADATA[filename];

        if (metadata) {
            try {
                // Проверяем существование файла
                const response = await fetch(`/src/assets/about/${filename}`);
                if (response.ok) {
                    mediaItems.push({
                        id: `asset-${Date.now()}-${i}`,
                        type: metadata.type,
                        url: `/src/assets/about/${filename}`,
                        filename: filename,
                        title: metadata.title,
                        description: metadata.description,
                        order: i
                    });
                }
            } catch (error) {
                console.warn(`Failed to scan file: ${filename}`, error);
            }
        }
    }

    return mediaItems;
};

// Добавление нового файла в список
export const addFileToAssets = (filename: string, metadata: { title: string; description: string; type: 'image' | 'video' }): void => {
    if (!KNOWN_FILES.includes(filename)) {
        KNOWN_FILES.push(filename);
        FILE_METADATA[filename] = metadata;
    }
};

// Удаление файла из списка
export const removeFileFromAssets = (filename: string): void => {
    const index = KNOWN_FILES.indexOf(filename);
    if (index > -1) {
        KNOWN_FILES.splice(index, 1);
        delete FILE_METADATA[filename];
    }
};

// Получение списка всех файлов
export const getAllAssetsFiles = (): string[] => {
    return [...KNOWN_FILES];
};

// Получение метаданных файла
export const getFileMetadata = (filename: string) => {
    return FILE_METADATA[filename] || null;
};
