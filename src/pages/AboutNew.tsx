/**
 * @file: AboutNew.tsx
 * @description: Обновленная страница "О нас" с загрузкой из БД
 * @dependencies: use-about-api.ts, ParentHeader
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { ParentHeader } from '@/components/ui/parent-header';
import { useAboutContent, useAboutMedia, useAboutWebSocket } from '@/hooks/use-about-api';
import { useServices } from '@/hooks/use-services';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileImage, FileVideo, Play, Sparkles, Star, Palette, Gift, Users, X } from 'lucide-react';

// CSS для скрытия скроллбара на мобильных
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

const AboutNew: React.FC = () => {
    const { content, loading: contentLoading } = useAboutContent();
    const { media, loading: mediaLoading } = useAboutMedia();
    const { lastUpdate } = useAboutWebSocket();
    const { services, loading: servicesLoading } = useServices();

    // Состояние для галереи
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryType, setGalleryType] = useState<'images' | 'videos'>('images');
    const [galleryItems, setGalleryItems] = useState<string[]>([]);
    const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);

    // Автоматическое обновление при получении WebSocket уведомлений
    React.useEffect(() => {
        if (lastUpdate > 0) {
            console.log('🔄 Получено обновление about через WebSocket');
            // Данные автоматически обновятся через хуки
        }
    }, [lastUpdate]);

    // Отладочная информация для услуг
    React.useEffect(() => {
        if (services.length > 0) {
            console.log('🔍 AboutNew: Полученные услуги:', services);
            services.forEach((service, serviceIndex) => {
                console.log(`🔍 Услуга ${serviceIndex + 1}:`, {
                    name: service.name,
                    stylesCount: service.styles?.length || 0,
                    optionsCount: service.options?.length || 0
                });

                if (service.styles) {
                    service.styles.forEach((style, styleIndex) => {
                        console.log(`  🎨 Стиль ${styleIndex + 1}:`, {
                            name: style.name,
                            avatar: style.avatar,
                            images: style.images,
                            videos: style.videos
                        });
                    });
                }

                if (service.options) {
                    service.options.forEach((option, optionIndex) => {
                        console.log(`  ✨ Опция ${optionIndex + 1}:`, {
                            name: option.name,
                            avatar: option.avatar,
                            images: option.images,
                            videos: option.videos
                        });
                    });
                }
            });
        }
    }, [services]);

    const getMediaUrl = (filePath: string) => {
        console.log('🔗 getMediaUrl вызван с:', filePath);

        // Преобразуем путь из БД в URL для отображения
        if (filePath.startsWith('/src/assets/')) {
            // Путь уже правильный для Vite dev server
            console.log('  → Vite assets путь:', filePath);
            return filePath;
        }

        // Обработка путей из папки uploads
        if (filePath.startsWith('@uploads/')) {
            // Заменяем @uploads/ на правильный URL к backend
            const result = filePath.replace('@uploads/', '/uploads/');
            console.log('  → @uploads путь преобразован:', result);
            return result;
        }

        // Если путь начинается с /uploads/ (как в backend)
        if (filePath.startsWith('/uploads/')) {
            // Путь уже правильный для backend
            console.log('  → Backend uploads путь:', filePath);
            return filePath;
        }

        // Если путь начинается с uploads/ (без слеша)
        if (filePath.startsWith('uploads/')) {
            const result = `/${filePath}`;
            console.log('  → uploads путь преобразован:', result);
            return result;
        }

        console.log('  → Неизвестный формат пути:', filePath);
        return filePath;
    };

    // Функция для открытия галереи
    const handleOpenGallery = (type: 'images' | 'videos', items: string[]) => {
        // Преобразуем пути в полные URL для корректного отображения
        const fullUrls = items.map(item => `http://localhost:3001${item}`);
        setGalleryType(type);
        setGalleryItems(fullUrls);
        setCurrentGalleryIndex(0);
        setGalleryOpen(true);
    };

    // Функция для закрытия галереи
    const handleCloseGallery = () => {
        setGalleryOpen(false);
        setGalleryItems([]);
        setCurrentGalleryIndex(0);
    };

    // Функция для навигации по галерее
    const handleNextGallery = () => {
        setCurrentGalleryIndex((prev) => (prev + 1) % galleryItems.length);
    };

    const handlePrevGallery = () => {
        setCurrentGalleryIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
    };

    if (contentLoading || mediaLoading || servicesLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
                <ParentHeader />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                            <p>Загрузка контента...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
                <ParentHeader />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-8">
                        <p className="text-red-500">Ошибка загрузки контента</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 relative overflow-hidden">
            <style>{scrollbarHideStyles}</style>

            {/* Animated Background Stars */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 2 + 2}s`,
                        }}
                    >
                        <Star
                            className="text-yellow-400/40 w-4 h-4"
                            fill="currentColor"
                        />
                    </div>
                ))}
            </div>

            {/* Floating Elements */}
            <div className="absolute top-20 left-10 animate-bounce-gentle">
                <div className="bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full p-4 shadow-glow">
                    <Palette className="w-8 h-8 text-white" />
                </div>
            </div>

            <div className="absolute top-40 right-20 animate-float">
                <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-3 shadow-glow">
                    <Gift className="w-6 h-6 text-white" />
                </div>
            </div>

            <div className="absolute bottom-40 left-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}>
                <div className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full p-3 shadow-glow">
                    <Users className="w-6 h-6 text-white" />
                </div>
            </div>

            <ParentHeader />

            <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
                {/* Hero секция */}
                <div className="text-center space-y-8 mb-16">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-card border border-orange-200">
                            <Sparkles className="w-6 h-6 text-orange-600 animate-spin-slow" />
                            <span className="text-lg font-semibold text-gray-800">
                                🎨 Творческие мастер-классы для детей
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                            <span className="bg-gradient-to-r from-orange-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
                                {content.title}
                            </span>
                            <span className="text-3xl md:text-4xl text-gray-600 font-normal">
                                ✨ Магия творчества ✨
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            {content.subtitle}
                        </p>
                        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                            {content.description}
                        </p>
                    </div>
                </div>



                {/* Информационные блоки */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* О нашей студии */}
                    <Card className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-red-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-0">
                            <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center">
                                <span className="text-3xl mr-3">❤️</span>
                                {content.studio_title}
                            </h3>
                            <p className="text-red-700 text-lg leading-relaxed">
                                {content.studio_description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Наши преимущества */}
                    <Card className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-0">
                            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
                                <span className="text-3xl mr-3">🏆</span>
                                {content.advantages_title}
                            </h3>
                            <ul className="space-y-4">
                                {content.advantages_list.map((advantage, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                                        <p className="text-purple-700 text-lg">{advantage}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Как проходит мастер-класс */}
                    <Card className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-0">
                            <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                                <span className="text-3xl mr-3">⏰</span>
                                {content.process_title}
                            </h3>
                            <div className="space-y-6">
                                {content.process_steps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-blue-800 mb-2 text-lg">{step.title}</h4>
                                            <p className="text-blue-700 text-lg">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Безопасность и качество */}
                    <Card className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <CardContent className="p-0">
                            <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                                <span className="text-3xl mr-3">🛡️</span>
                                {content.safety_title}
                            </h3>
                            <p className="text-green-700 text-lg leading-relaxed">
                                {content.safety_description}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Медиа галерея - в конце страницы */}
                {media.length > 0 && (
                    <div className="mt-16">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                Наши работы и мастер-классы
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Посмотрите, как проходят наши мастер-классы и какие уникальные работы создают дети
                            </p>
                        </div>

                        {/* Мобильная версия - горизонтальное прокручивание */}
                        <div className="md:hidden">
                            <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 scrollbar-hide">
                                {media
                                    .sort((a, b) => a.order_index - b.order_index)
                                    .map((item, index) => (
                                        <Card key={item.id} className="min-w-[280px] flex-shrink-0 overflow-hidden group bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                            <CardContent className="p-0">
                                                <div className="relative">
                                                    {item.type === 'image' ? (
                                                        <div className="aspect-[4/3] overflow-hidden">
                                                            <img
                                                                src={getMediaUrl(item.file_path)}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = '/placeholder.svg';
                                                                    target.alt = 'Изображение недоступно';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="aspect-[4/3] relative bg-gray-100">
                                                            <video
                                                                src={getMediaUrl(item.file_path)}
                                                                className="w-full h-full object-cover"
                                                                poster="/placeholder.svg"
                                                                controls
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLVideoElement;
                                                                    target.poster = '/placeholder.svg';
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <div className="bg-black/50 rounded-full p-3">
                                                                    <Play className="w-8 h-8 text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="secondary" className="bg-white/80">
                                                            {item.type === 'image' ? (
                                                                <FileImage className="w-3 h-3 mr-1" />
                                                            ) : (
                                                                <FileVideo className="w-3 h-3 mr-1" />
                                                            )}
                                                            {item.type === 'image' ? 'Фото' : 'Видео'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                        {item.title}
                                                    </h3>
                                                    {item.description && (
                                                        <p className="text-gray-600 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <Badge variant="secondary" className="capitalize">
                                                            {item.type === 'image' ? 'Фото' : 'Видео'}
                                                        </Badge>
                                                        <span className="text-sm text-gray-500">
                                                            #{index + 1}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </div>

                        {/* Десктопная версия - вертикальная сетка */}
                        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {media
                                .sort((a, b) => a.order_index - b.order_index)
                                .map((item, index) => (
                                    <Card key={item.id} className="group relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-card border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                                        <CardContent className="p-0">
                                            <div className="relative">
                                                {item.type === 'image' ? (
                                                    <div className="aspect-[4/3] overflow-hidden">
                                                        <img
                                                            src={getMediaUrl(item.file_path)}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/placeholder.svg';
                                                                target.alt = 'Изображение недоступно';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-[4/3] relative bg-gray-100">
                                                        <video
                                                            src={getMediaUrl(item.file_path)}
                                                            className="w-full h-full object-cover"
                                                            poster="/placeholder.svg"
                                                            controls
                                                            onError={(e) => {
                                                                const target = e.target as HTMLVideoElement;
                                                                target.poster = '/placeholder.svg';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="bg-black/50 rounded-full p-3">
                                                                <Play className="w-8 h-8 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="secondary" className="bg-white/80">
                                                        {item.type === 'image' ? (
                                                            <FileImage className="w-3 h-3 mr-1" />
                                                        ) : (
                                                            <FileVideo className="w-3 h-3 mr-1" />
                                                        )}
                                                        {item.type === 'image' ? 'Фото' : 'Видео'}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                    {item.title}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-gray-600 leading-relaxed">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="mt-4 flex items-center justify-between">
                                                    <Badge variant="secondary" className="capitalize">
                                                        {item.type === 'image' ? 'Фото' : 'Видео'}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </div>
                )}

                {/* Секция "О нашем мастер-классе" - услуги и цены */}
                {services.length > 0 && (
                    <div className="mt-16">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                О наших ценах и вариантах ручек
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Узнайте о наших вариантах ручек и дополнительных услугах
                            </p>
                        </div>

                        <div className="space-y-8">
                            {services.map((service) => (
                                <Card key={service.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-orange-200 hover:shadow-xl transition-all duration-300">
                                    <CardContent className="p-8">
                                        <div className="text-center mb-8">
                                            <h3 className="text-3xl font-bold text-orange-800 mb-4">
                                                {service.name}
                                            </h3>
                                            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                                                {service.shortDescription}
                                            </p>
                                            {service.fullDescription && (
                                                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
                                                    {service.fullDescription}
                                                </p>
                                            )}
                                        </div>

                                        {/* Стили услуги */}
                                        {service.styles && service.styles.length > 0 && (
                                            <div className="mb-8">
                                                <h4 className="text-2xl font-bold text-purple-800 mb-6 text-center">
                                                    Варианты ручек
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {service.styles.map((style) => (
                                                        <Card key={style.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1">
                                                            <CardContent className="p-6 text-center">
                                                                {/* Аватар стиля */}
                                                                <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
                                                                    {style.avatar ? (
                                                                        <img
                                                                            src={`http://localhost:3001${style.avatar}`}
                                                                            alt={style.name}
                                                                            className="w-full h-full object-cover rounded-full"
                                                                            style={{ zIndex: 1 }}
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                                target.nextElementSibling?.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <span className={`text-3xl ${style.avatar ? 'hidden' : ''}`} style={{ zIndex: 0 }}>🎨</span>
                                                                </div>

                                                                <h5 className="text-xl font-bold text-purple-800 mb-3">
                                                                    {style.name}
                                                                </h5>

                                                                {/* Полное описание */}
                                                                {style.fullDescription && (
                                                                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                                                                        {style.fullDescription}
                                                                    </p>
                                                                )}

                                                                {/* Иконки медиа */}
                                                                <div className="flex items-center justify-center gap-3 mb-4">
                                                                    {style.images && style.images.length > 0 && (
                                                                        <button
                                                                            onClick={() => handleOpenGallery('images', style.images || [])}
                                                                            className="w-8 h-8 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                            title={`${style.images.length} фото`}
                                                                        >
                                                                            <FileImage className="w-5 h-5 text-white" />
                                                                        </button>
                                                                    )}
                                                                    {style.videos && style.videos.length > 0 && (
                                                                        <button
                                                                            onClick={() => handleOpenGallery('videos', style.videos || [])}
                                                                            className="w-8 h-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                            title={`${style.videos.length} видео`}
                                                                        >
                                                                            <FileVideo className="w-5 h-5 text-white" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-full px-6 py-3 inline-block shadow-lg">
                                                                    <span className="text-lg font-bold text-white">
                                                                        {style.price} ₽
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Опции услуги */}
                                        {service.options && service.options.length > 0 && (
                                            <div>
                                                <h4 className="text-2xl font-bold text-blue-800 mb-6 text-center">
                                                    Дополнительные услуги
                                                </h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {service.options.map((option) => (
                                                        <Card key={option.id} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
                                                            <CardContent className="p-6 text-center">
                                                                {/* Аватар опции */}
                                                                <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden relative">
                                                                    {option.avatar ? (
                                                                        <img
                                                                            src={`http://localhost:3001${option.avatar}`}
                                                                            alt={option.name}
                                                                            className="w-full h-full object-cover rounded-full"
                                                                            style={{ zIndex: 1 }}
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                                target.nextElementSibling?.classList.remove('hidden');
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <span className={`text-3xl ${option.avatar ? 'hidden' : ''}`} style={{ zIndex: 0 }}>✨</span>
                                                                </div>

                                                                <h5 className="text-xl font-bold text-blue-800 mb-3">
                                                                    {option.name}
                                                                </h5>

                                                                {/* Полное описание */}
                                                                {option.fullDescription && (
                                                                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                                                                        {option.fullDescription}
                                                                    </p>
                                                                )}

                                                                {/* Иконки медиа */}
                                                                <div className="flex items-center justify-center gap-3 mb-4">
                                                                    {option.images && option.images.length > 0 && (
                                                                        <button
                                                                            onClick={() => handleOpenGallery('images', option.images || [])}
                                                                            className="w-8 h-8 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                            title={`${option.images.length} фото`}
                                                                        >
                                                                            <FileImage className="w-5 h-5 text-white" />
                                                                        </button>
                                                                    )}
                                                                    {option.videos && option.videos.length > 0 && (
                                                                        <button
                                                                            onClick={() => handleOpenGallery('videos', option.videos || [])}
                                                                            className="w-8 h-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                            title={`${option.videos.length} видео`}
                                                                        >
                                                                            <FileVideo className="w-5 h-5 text-white" />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full px-6 py-3 inline-block shadow-lg">
                                                                    <span className="text-lg font-bold text-white">
                                                                        {option.price} ₽
                                                                    </span>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Модальное окно галереи */}
            {galleryOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
                        {/* Кнопка закрытия */}
                        <button
                            onClick={handleCloseGallery}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Навигация */}
                        {galleryItems.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevGallery}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <span className="text-white text-2xl">‹</span>
                                </button>
                                <button
                                    onClick={handleNextGallery}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                >
                                    <span className="text-white text-2xl">›</span>
                                </button>
                            </>
                        )}

                        {/* Контент галереи */}
                        <div className="w-full h-full flex items-center justify-center">
                            {galleryType === 'images' ? (
                                <img
                                    src={galleryItems[currentGalleryIndex]}
                                    alt={`Изображение ${currentGalleryIndex + 1}`}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            ) : (
                                <video
                                    src={galleryItems[currentGalleryIndex]}
                                    controls
                                    className="max-w-full max-h-full rounded-lg"
                                    poster="/placeholder.svg"
                                />
                            )}
                        </div>

                        {/* Индикатор текущего элемента */}
                        {galleryItems.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {galleryItems.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentGalleryIndex(index)}
                                        className={`w-3 h-3 rounded-full transition-colors ${index === currentGalleryIndex ? 'bg-white' : 'bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutNew;
