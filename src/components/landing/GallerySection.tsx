/**
 * @file: GallerySection.tsx
 * @description: Секция галереи для лендинга
 * @dependencies: useAboutMedia
 * @created: 2024-12-25
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Play, Image as ImageIcon, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAboutMedia, AboutMedia } from '@/hooks/use-about-api';
import { useServices } from '@/hooks/use-services';

interface MediaItem {
    type: 'image' | 'video';
    file_path: string;
    thumbnail_path?: string;
    title?: string;
}

export const GallerySection: React.FC = () => {
    const { media, loading: mediaLoading } = useAboutMedia();
    const { services, loading: servicesLoading } = useServices();
    const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', src: string, thumbnail?: string } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos'>('videos');

    // Используем реальные медиа из БД
    const displayMedia = media || [];

    // Собираем медиа из услуг (стили и опции)
    const servicesMedia = (services || []).flatMap(service => {
        const stylesMedia = (service.styles || []).flatMap(style => {
            const media: MediaItem[] = [];
            if (style.images && Array.isArray(style.images)) {
                media.push(...style.images.map(img => ({
                    type: 'image' as const,
                    file_path: typeof img === 'string' ? img : (img as { file_path?: string }).file_path || String(img),
                    thumbnail_path: typeof img === 'string' ? undefined : (img as { thumbnail_path?: string }).thumbnail_path,
                    title: style.name
                })));
            }
            if (style.videos && Array.isArray(style.videos)) {
                media.push(...style.videos.map(vid => ({
                    type: 'video' as const,
                    file_path: typeof vid === 'string' ? vid : (vid as { file_path?: string }).file_path || String(vid),
                    thumbnail_path: typeof vid === 'string' ? undefined : (vid as { thumbnail_path?: string }).thumbnail_path,
                    title: style.name
                })));
            }
            return media;
        });
        const optionsMedia = (service.options || []).flatMap(option => {
            const media: MediaItem[] = [];
            if (option.images && Array.isArray(option.images)) {
                media.push(...option.images.map(img => ({
                    type: 'image' as const,
                    file_path: typeof img === 'string' ? img : (img as { file_path?: string }).file_path || String(img),
                    thumbnail_path: typeof img === 'string' ? undefined : (img as { thumbnail_path?: string }).thumbnail_path,
                    title: option.name
                })));
            }
            if (option.videos && Array.isArray(option.videos)) {
                media.push(...option.videos.map(vid => ({
                    type: 'video' as const,
                    file_path: typeof vid === 'string' ? vid : (vid as { file_path?: string }).file_path || String(vid),
                    thumbnail_path: typeof vid === 'string' ? undefined : (vid as { thumbnail_path?: string }).thumbnail_path,
                    title: option.name
                })));
            }
            return media;
        });
        return [...stylesMedia, ...optionsMedia];
    });

    // Объединяем все медиа и убираем дубликаты по file_path
    const allDisplayMedia = [...displayMedia, ...servicesMedia];

    // Улучшенная дедупликация: убираем дубликаты по file_path и группируем по содержимому
    const uniqueMedia = allDisplayMedia.reduce((acc, item) => {
        // Проверяем, есть ли уже элемент с таким же file_path
        const existingIndex = acc.findIndex(existing => existing.file_path === item.file_path);

        if (existingIndex === -1) {
            // Если нет, добавляем новый элемент
            acc.push(item);
        } else {
            // Если есть, объединяем названия стилей для лучшего отображения
            const existing = acc[existingIndex];
            if (existing.title !== item.title) {
                // Если названия стилей разные, объединяем их
                existing.title = `${existing.title}, ${item.title}`;
            }
        }

        return acc;
    }, [] as typeof allDisplayMedia);

    // Функция для получения URL медиа файлов
    const getMediaUrl = (filePath: string) => {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;
        // Если filePath уже содержит /uploads/, используем как есть
        if (filePath.startsWith('/uploads/')) {
            return `https://waxhands.ru${filePath}`;
        }
        // Иначе добавляем /uploads/
        return `https://waxhands.ru/uploads/${filePath}`;
    };

    // Фильтрация медиа по типам
    const images = uniqueMedia.filter(item => item.type === 'image');
    const videos = uniqueMedia.filter(item => item.type === 'video');
    const allMedia = [...videos, ...images]; // Сначала видео, потом фото

    // Фильтрация по активной вкладке
    const getFilteredMedia = () => {
        switch (activeTab) {
            case 'photos':
                return images;
            case 'videos':
                return videos;
            default:
                return allMedia;
        }
    };

    const filteredMedia = getFilteredMedia();

    const openMedia = (item: MediaItem | AboutMedia, index: number) => {
        setSelectedMedia({
            type: item.type,
            src: getMediaUrl(item.file_path),
            thumbnail: item.thumbnail_path ? getMediaUrl(item.thumbnail_path) : undefined
        });
        setCurrentIndex(index);
    };

    const nextMedia = () => {
        const nextIndex = (currentIndex + 1) % allMedia.length;
        openMedia(allMedia[nextIndex], nextIndex);
    };

    const prevMedia = () => {
        const prevIndex = currentIndex === 0 ? allMedia.length - 1 : currentIndex - 1;
        openMedia(allMedia[prevIndex], prevIndex);
    };

    if (mediaLoading) {
        return (
            <section id="gallery" className="py-20">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-700">Загружаем галерею...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="gallery" className="py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Наша галерея
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Посмотрите на работы наших мастеров и вдохновитесь творчеством
                    </p>
                </div>

                {/* Табы */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-orange-200">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'videos'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                            >
                                <Video className="w-5 h-5 inline mr-2" />
                                Видео ({videos.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'photos'
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                                    }`}
                            >
                                <ImageIcon className="w-5 h-5 inline mr-2" />
                                Фото ({images.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'all'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                            >
                                Все ({allMedia.length})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Галерея медиа */}
                {filteredMedia.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMedia.map((item, index) => (
                            <div
                                key={index}
                                className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                                onClick={() => openMedia(item, index)}
                            >
                                {item.type === 'image' ? (
                                    <img
                                        src={getMediaUrl(item.file_path)}
                                        alt={item.title || `Работа ${index + 1}`}
                                        className="w-full h-64 object-cover"
                                    />
                                ) : (
                                    <video
                                        className="w-full h-64 object-cover"
                                        poster={item.thumbnail_path ? getMediaUrl(item.thumbnail_path) : undefined}
                                    >
                                        <source src={getMediaUrl(item.file_path)} type="video/mp4" />
                                    </video>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {item.type === 'image' ? (
                                            <ImageIcon className="w-6 h-6 text-orange-600" />
                                        ) : (
                                            <Play className="w-6 h-6 text-orange-600 ml-1" />
                                        )}
                                    </div>
                                </div>
                                <Badge className="absolute top-3 left-3 bg-white/90 text-gray-700">
                                    {item.type === 'image' ? 'Фото' : 'Видео'} {index + 1}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            {activeTab === 'photos' ? (
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                            ) : activeTab === 'videos' ? (
                                <Video className="w-12 h-12 text-gray-400" />
                            ) : (
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {activeTab === 'photos' ? 'Фотографии не найдены' :
                                activeTab === 'videos' ? 'Видео не найдены' : 'Медиа не найдены'}
                        </h3>
                        <p className="text-gray-600">Скоро здесь появятся новые работы</p>
                    </div>
                )}

                {/* Сообщение если нет медиа */}
                {allMedia.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Галерея пуста</h3>
                        <p className="text-gray-600">Скоро здесь появятся наши работы</p>
                    </div>
                )}
            </div>

            {/* Модальное окно для просмотра медиа */}
            {selectedMedia && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-6xl w-full max-h-[90vh]">
                        {/* Кнопка закрытия */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMedia(null)}
                            className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        {/* Навигация */}
                        {allMedia.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevMedia}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={nextMedia}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </Button>
                            </>
                        )}

                        {/* Контент */}
                        <div className="w-full h-full flex items-center justify-center">
                            {selectedMedia.type === 'image' ? (
                                <img
                                    src={selectedMedia.src}
                                    alt="Галерея"
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    className="max-w-full max-h-full rounded-lg"
                                    controls
                                    autoPlay
                                >
                                    <source src={selectedMedia.src} type="video/mp4" />
                                </video>
                            )}
                        </div>

                        {/* Счетчик */}
                        {allMedia.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                {currentIndex + 1} из {allMedia.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
