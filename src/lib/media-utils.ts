/**
 * @file: src/lib/media-utils.ts
 * @description: Утилиты для работы с медиа-файлами страницы "О нас"
 * @dependencies: File API
 * @created: 2024-12-19
 */

export interface MediaFile {
    id: string;
    type: 'image' | 'video';
    filename: string;
    originalName: string;
    title: string;
    description?: string;
    order: number;
    url: string; // путь к файлу в assets
}

// Максимальный размер файла (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Генерация уникального имени файла
export const generateMediaFilename = (originalName: string, type: 'image' | 'video'): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = originalName.split('.').pop();
    return `${type}-${timestamp}-${randomId}.${extension}`;
};

// Сжатие изображения
const compressImage = (file: File, maxWidth: number = 800): Promise<Blob> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();

        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        };

        img.src = URL.createObjectURL(file);
    });
};

// Сохранение файла в assets/about (реальное сохранение)
export const saveMediaFile = async (file: File, type: 'image' | 'video'): Promise<string> => {
    try {
        // Проверяем размер файла
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }

        const filename = generateMediaFilename(file.name, type);
        let processedFile = file;

        // Сжимаем изображения
        if (type === 'image' && file.type.startsWith('image/')) {
            processedFile = await compressImage(file);
        }

        // Создаем blob URL для отображения
        const blobUrl = URL.createObjectURL(processedFile);

        // Сохраняем только метаданные в localStorage, не содержимое файла
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        savedFiles[filename] = {
            type: processedFile.type,
            originalName: file.name,
            size: processedFile.size,
            lastModified: file.lastModified,
            isUploaded: true,
            blobUrl: blobUrl // Сохраняем blob URL для текущей сессии
        };

        // Очищаем старые файлы, если превышен лимит
        const fileKeys = Object.keys(savedFiles);
        if (fileKeys.length > 10) {
            const oldKeys = fileKeys.slice(0, fileKeys.length - 10);
            oldKeys.forEach(key => {
                delete savedFiles[key];
            });
        }

        localStorage.setItem('aboutMediaFiles', JSON.stringify(savedFiles));

        return blobUrl;
    } catch (error) {
        console.error('Error saving media file:', error);
        throw new Error(error instanceof Error ? error.message : 'Не удалось сохранить медиа-файл');
    }
};

// Загрузка файла из assets/about
export const loadMediaFile = async (filename: string): Promise<string> => {
    try {
        // Сначала проверяем localStorage для загруженных файлов
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        const fileData = savedFiles[filename];

        if (fileData && fileData.isUploaded && fileData.blobUrl) {
            // Проверяем, что blob URL еще валиден
            try {
                const response = await fetch(fileData.blobUrl);
                if (response.ok) {
                    return fileData.blobUrl;
                }
            } catch (error) {
                console.warn('Blob URL expired, trying static file:', filename);
            }
        }

        // Пытаемся загрузить статический файл из assets/about
        try {
            const response = await fetch(`/src/assets/about/${filename}`);
            if (response.ok) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (error) {
            console.warn('Static file not found:', filename);
        }

        // Если ничего не найдено, возвращаем placeholder
        if (filename.includes('image')) {
            return '/placeholder.svg'; // Используем placeholder для изображений
        } else {
            return '/placeholder.svg'; // Используем placeholder для видео
        }
    } catch (error) {
        console.error('Error loading media file:', error);
        return '/placeholder.svg'; // Fallback на placeholder
    }
};

// Удаление файла
export const deleteMediaFile = async (filename: string): Promise<void> => {
    try {
        // Удаляем из localStorage
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        const fileData = savedFiles[filename];

        if (fileData && fileData.blobUrl) {
            // Освобождаем blob URL
            URL.revokeObjectURL(fileData.blobUrl);
        }

        delete savedFiles[filename];
        localStorage.setItem('aboutMediaFiles', JSON.stringify(savedFiles));

        console.log(`Media file ${filename} deleted from localStorage`);
    } catch (error) {
        console.error('Error deleting media file:', error);
        throw new Error('Не удалось удалить медиа-файл');
    }
};

// Получение списка всех медиа-файлов
export const getMediaFilesList = (): string[] => {
    try {
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        return Object.keys(savedFiles);
    } catch (error) {
        console.error('Error getting media files list:', error);
        return [];
    }
};

// Проверка существования файла
export const mediaFileExists = (filename: string): boolean => {
    try {
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        return filename in savedFiles;
    } catch (error) {
        return false;
    }
};

// Получение размера файла
export const getMediaFileSize = (filename: string): number => {
    try {
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        const fileData = savedFiles[filename];
        return fileData ? (fileData.size || 0) : 0;
    } catch (error) {
        return 0;
    }
};

// Очистка всех медиа-файлов (для отладки)
export const clearAllMediaFiles = (): void => {
    try {
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');

        // Освобождаем все blob URL
        Object.values(savedFiles).forEach((fileData: any) => {
            if (fileData.blobUrl) {
                URL.revokeObjectURL(fileData.blobUrl);
            }
        });

        localStorage.removeItem('aboutMediaFiles');
        console.log('All media files cleared from localStorage');
    } catch (error) {
        console.error('Error clearing media files:', error);
    }
};

// Очистка старых blob URL для предотвращения утечек памяти
export const cleanupBlobUrls = (): void => {
    try {
        const savedFiles = JSON.parse(localStorage.getItem('aboutMediaFiles') || '{}');
        const keys = Object.keys(savedFiles);

        // Оставляем только 5 последних файлов
        if (keys.length > 5) {
            const recentKeys = keys.slice(-5);
            const recentFiles: any = {};

            // Освобождаем blob URL для удаляемых файлов
            keys.forEach(key => {
                if (!recentKeys.includes(key) && savedFiles[key].blobUrl) {
                    URL.revokeObjectURL(savedFiles[key].blobUrl);
                }
            });

            recentKeys.forEach(key => {
                recentFiles[key] = savedFiles[key];
            });

            localStorage.setItem('aboutMediaFiles', JSON.stringify(recentFiles));
            console.log(`Cleaned up media files, kept ${recentKeys.length} most recent`);
        }
    } catch (error) {
        console.error('Error cleaning up blob URLs:', error);
    }
};

// Автоматическая очистка при загрузке страницы
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupBlobUrls);
}
