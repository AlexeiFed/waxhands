/**
 * @file: src/hooks/use-about-content.ts
 * @description: Хук для управления контентом страницы "О нас"
 * @dependencies: useState, useEffect
 * @created: 2024-12-19
 */

import { useState, useEffect } from 'react';
import { saveMediaFile, loadMediaFile, deleteMediaFile } from '@/lib/media-utils';

export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
    filename?: string; // имя файла в assets/about
    title: string;
    description?: string;
    order: number;
    file?: File;
}

export interface AboutContent {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    aboutTitle: string;
    aboutDescription: string;
    advantages: string[];
    processSteps: Array<{
        title: string;
        description: string;
    }>;
    safetyTitle: string;
    safetyDescription: string;
    contactTitle: string;
    contactDescription: string;
    media: MediaItem[];
}

const defaultContent: AboutContent = {
    heroTitle: 'Восковые Ручки',
    heroSubtitle: '✨ Магия творчества ✨',
    heroDescription: 'Создай свою уникальную 3D копию руки в восковом исполнении! Приезжаем в школы и детские сады. Незабываемые впечатления и уникальные сувениры за 5 минут! 🎉',
    aboutTitle: 'О нашей студии',
    aboutDescription: 'Студия «МК Восковые ручки» — это место, где рождается магия творчества! Мы специализируемся на создании уникальных 3D-копий рук детей в восковом исполнении.',
    advantages: [
        'Быстрое создание — всего 5 минут на одного ребенка',
        'Выездные мастер-классы в любые учреждения',
        'Уникальные 3D-сувениры ручной работы',
        'Безопасные материалы для детей'
    ],
    processSteps: [
        {
            title: 'Подготовка',
            description: 'Ребенок выбирает цвет воска и готовится к творческому процессу'
        },
        {
            title: 'Создание',
            description: 'Под руководством мастера ребенок создает 3D-копию своей руки'
        },
        {
            title: 'Готово!',
            description: 'Уникальный сувенир готов и может быть забран домой'
        }
    ],
    safetyTitle: 'Безопасность и качество',
    safetyDescription: 'Мы используем только высококачественные, безопасные для детей материалы. Все наши мастера имеют опыт работы с детьми и проходят специальное обучение.',
    contactTitle: 'Свяжитесь с нами',
    contactDescription: 'Готовы организовать незабываемый мастер-класс для ваших детей? Напишите нам, и мы обсудим все детали!',
    media: []
};

export const useAboutContent = () => {
    const [content, setContent] = useState<AboutContent>(defaultContent);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Загрузка контента из localStorage или API
    useEffect(() => {
        const loadContent = async () => {
            try {
                setIsLoading(true);
                // Пока загружаем из localStorage, позже будет API
                const savedContent = localStorage.getItem('aboutContent');
                let parsedContent = savedContent ? JSON.parse(savedContent) : defaultContent;

                // Если медиа пустое, добавляем демо-файлы
                if (!parsedContent.media || parsedContent.media.length === 0) {
                    parsedContent.media = [
                        {
                            id: 'demo-1',
                            type: 'video',
                            url: '/src/assets/about/demo-video-1.mp4',
                            filename: 'demo-video-1.mp4',
                            title: 'Мастер-класс: Восковые ручки',
                            description: 'Демонстрация процесса создания 3D-копии руки из воска',
                            order: 0
                        },
                        {
                            id: 'demo-2',
                            type: 'video',
                            url: '/src/assets/about/demo-video-2.mp4',
                            filename: 'demo-video-2.mp4',
                            title: 'Двойные восковые ручки',
                            description: 'Создание парных восковых копий рук',
                            order: 1
                        }
                    ];
                }

                // Загружаем медиа-файлы из localStorage
                if (parsedContent.media && parsedContent.media.length > 0) {
                    const mediaWithUrls = await Promise.all(
                        parsedContent.media.map(async (item: MediaItem) => {
                            if (item.filename) {
                                try {
                                    // Для статических файлов в assets используем прямой путь
                                    if (item.filename.includes('demo-')) {
                                        return { ...item, url: `/src/assets/about/${item.filename}` };
                                    }

                                    // Для загруженных файлов загружаем из localStorage
                                    if (item.filename.startsWith('uploaded-')) {
                                        try {
                                            const url = await loadMediaFile(item.filename);
                                            return { ...item, url };
                                        } catch (error) {
                                            console.warn(`Failed to load media file: ${item.filename}`, error);
                                            return item;
                                        }
                                    }
                                } catch (error) {
                                    console.warn(`Failed to load media file: ${item.filename}`, error);
                                }
                            }
                            return item;
                        })
                    );
                    parsedContent.media = mediaWithUrls;
                }

                setContent(parsedContent);
                console.log('Content loaded successfully:', parsedContent);

                // Сохраняем обновленный контент если были добавлены демо-файлы
                if (!savedContent || !savedContent.includes('demo-')) {
                    localStorage.setItem('aboutContent', JSON.stringify({
                        ...parsedContent,
                        media: parsedContent.media.map((item: MediaItem) => ({
                            ...item,
                            url: item.filename?.includes('demo-') ? `/src/assets/about/${item.filename}` : ''
                        }))
                    }));
                    console.log('Demo content saved to localStorage');
                }
            } catch (err) {
                setError('Ошибка загрузки контента');
                console.error('Error loading about content:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, []);

    // Сохранение контента
    const saveContent = async (newContent: AboutContent) => {
        try {
            // Создаем копию контента для сохранения без blob URL
            const contentToSave = {
                ...newContent,
                media: newContent.media.map(item => ({
                    ...item,
                    // Сохраняем только metadata, URL будем восстанавливать при загрузке
                    url: item.filename?.includes('demo-') ? `/src/assets/about/${item.filename}` : ''
                }))
            };

            // Пока сохраняем в localStorage, позже будет API
            localStorage.setItem('aboutContent', JSON.stringify(contentToSave));
            setContent(newContent); // В состоянии оставляем с URL
            console.log('Content saved successfully to localStorage');
            return true;
        } catch (err) {
            setError('Ошибка сохранения контента');
            console.error('Error saving about content:', err);
            return false;
        }
    };

    // Обновление отдельного поля
    const updateField = async (field: keyof AboutContent, value: any) => {
        const newContent = { ...content, [field]: value };
        const success = await saveContent(newContent);
        if (success) {
            // Обновляем состояние немедленно для UI
            setContent(newContent);
            console.log('Field updated successfully:', field, value);
        }
        return success;
    };

    // Добавление медиа
    const addMedia = async (mediaItem: Omit<MediaItem, 'id' | 'order'>) => {
        try {
            let finalUrl = mediaItem.url;
            let filename = mediaItem.filename;

            // Если есть файл, сохраняем его и получаем URL
            if (mediaItem.file) {
                // Проверяем размер файла перед загрузкой
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (mediaItem.file.size > maxSize) {
                    throw new Error(`Файл слишком большой. Максимальный размер: ${maxSize / 1024 / 1024}MB`);
                }

                finalUrl = await saveMediaFile(mediaItem.file, mediaItem.type);
                filename = `uploaded-${Date.now()}-${mediaItem.file.name}`;
            } else if (mediaItem.filename) {
                // Если есть filename, используем его
                filename = mediaItem.filename;
            }

            const newMediaItem: MediaItem = {
                ...mediaItem,
                id: Date.now().toString(),
                order: content.media.length,
                url: finalUrl,
                filename: filename
            };

            const newContent = {
                ...content,
                media: [...content.media, newMediaItem]
            };

            const success = await saveContent(newContent);
            if (success) {
                // Обновляем состояние немедленно для UI
                setContent(newContent);
                console.log('Media added successfully:', newMediaItem);
            }
            return success;
        } catch (error) {
            console.error('Error adding media:', error);
            // Возвращаем детальную ошибку для отображения пользователю
            if (error instanceof Error) {
                throw new Error(error.message);
            }
            throw new Error('Не удалось добавить медиа-файл');
        }
    };

    // Удаление медиа
    const removeMedia = async (id: string) => {
        try {
            const mediaItem = content.media.find(item => item.id === id);

            // Удаляем файл из localStorage
            if (mediaItem?.filename && mediaItem.filename.startsWith('uploaded-')) {
                await deleteMediaFile(mediaItem.filename);
            }
            // Демо-файлы не удаляем, они статические

            const newContent = {
                ...content,
                media: content.media.filter(item => item.id !== id)
            };

            const success = await saveContent(newContent);
            if (success) {
                // Обновляем состояние немедленно для UI
                setContent(newContent);
                console.log('Media removed successfully:', id);
            }
            return success;
        } catch (error) {
            console.error('Error removing media:', error);
            return false;
        }
    };

    // Изменение порядка медиа
    const reorderMedia = async (mediaIds: string[]) => {
        const newMedia = mediaIds.map((id, index) => {
            const item = content.media.find(m => m.id === id);
            return item ? { ...item, order: index } : null;
        }).filter(Boolean) as MediaItem[];

        const newContent = {
            ...content,
            media: newMedia
        };

        // Сохраняем новый порядок
        const success = await saveContent(newContent);
        if (success) {
            // Обновляем состояние немедленно для UI
            setContent(newContent);
            console.log('Media reordered successfully:', newMedia);
        }
        return success;
    };

    // Сброс к значениям по умолчанию
    const resetToDefault = async () => {
        const success = await saveContent(defaultContent);
        if (success) {
            // Обновляем состояние немедленно для UI
            setContent(defaultContent);
        }
        return success;
    };

    return {
        content,
        isLoading,
        error,
        saveContent,
        updateField,
        addMedia,
        removeMedia,
        reorderMedia,
        resetToDefault
    };
};
