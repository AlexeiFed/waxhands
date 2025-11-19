/**
 * @file: ServicesSection.tsx
 * @description: Секция услуг для лендинга
 * @dependencies: Card, useServices
 * @created: 2024-12-25
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand, MapPin, Users, Clock, Star, ArrowRight, FileImage, FileVideo, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useServices } from '@/hooks/use-services';
import { useNavigate } from 'react-router-dom';
import { ExpandableText } from '@/components/ui/expandable-text';
import { useAuth } from '@/contexts/AuthContext';
import { isStyleVisibleForUser, isOptionVisibleForUser } from '@/types/services';
import { AvatarDisplay } from '@/components/ui/avatar-display';

export const ServicesSection: React.FC = () => {
    const { user } = useAuth();
    const { services, loading: servicesLoading } = useServices();
    const navigate = useNavigate();
    const [selectedMedia, setSelectedMedia] = useState<{ type: 'image' | 'video', src: string, title?: string } | null>(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [currentMediaList, setCurrentMediaList] = useState<Array<{ type: 'image' | 'video', src: string, title?: string }>>([]);

    // Используем данные из БД или fallback
    const displayServices = services || [];

    // Данные пользователя для фильтрации
    const userData = {
        surname: user?.surname,
        phone: user?.phone,
        userId: user?.id
    };

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

    // Функция для открытия галереи
    const openGallery = (mediaList: Array<{ type: 'image' | 'video', src: string, title?: string }>, index: number) => {
        setCurrentMediaList(mediaList);
        setCurrentMediaIndex(index);
        setSelectedMedia(mediaList[index]);
    };

    // Функция для закрытия галереи
    const closeGallery = () => {
        setSelectedMedia(null);
        setCurrentMediaList([]);
        setCurrentMediaIndex(0);
    };

    // Функция для навигации по галерее
    const nextMedia = () => {
        const nextIndex = (currentMediaIndex + 1) % currentMediaList.length;
        setCurrentMediaIndex(nextIndex);
        setSelectedMedia(currentMediaList[nextIndex]);
    };

    const prevMedia = () => {
        const prevIndex = currentMediaIndex === 0 ? currentMediaList.length - 1 : currentMediaIndex - 1;
        setCurrentMediaIndex(prevIndex);
        setSelectedMedia(currentMediaList[prevIndex]);
    };

    if (servicesLoading) {
        return (
            <section id="services" className="py-20">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-700">Загружаем услуги...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="services" className="py-20">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        О наших ценах и вариантах ручек
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Узнайте о наших вариантах ручек и дополнительных услугах
                    </p>
                </div>

                {/* Сетка услуг */}
                {displayServices.length > 0 ? (
                    <div className="space-y-8 mb-16">
                        {displayServices.map((service, index) => (
                            <Card
                                key={service.id || index}
                                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-card border border-orange-200 hover:shadow-xl transition-all duration-300"
                            >
                                <CardContent className="p-8">
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-bold text-orange-800 mb-4 text-center">
                                            {service.name}
                                        </h3>
                                        <div className="px-6">
                                            <ExpandableText
                                                text={service.shortDescription}
                                                maxLength={120}
                                                className="text-lg text-gray-700"
                                                buttonClassName="text-orange-600"
                                            />
                                            {service.fullDescription && (
                                                <ExpandableText
                                                    text={service.fullDescription}
                                                    maxLength={150}
                                                    className="text-lg text-gray-600 mt-4"
                                                    buttonClassName="text-orange-600"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Стили услуги */}
                                    {service.styles && Array.isArray(service.styles) && service.styles.length > 0 ? (
                                        <div className="mb-8">
                                            <h4 className="text-2xl font-bold text-purple-800 mb-6 text-center">
                                                Варианты ручек
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {(service.styles || []).filter(style => isStyleVisibleForUser(style, userData)).map((style) => (
                                                    <Card key={style.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1">
                                                        <CardContent className="p-6 text-center">
                                                            {/* Аватар стиля */}
                                                            <div className="w-20 h-20 mx-auto mb-4">
                                                                <AvatarDisplay
                                                                    images={style.images}
                                                                    type="style"
                                                                    alt={style.name}
                                                                    size="lg"
                                                                    className="w-20 h-20 rounded-full"
                                                                />
                                                            </div>

                                                            <h5 className="text-xl font-bold text-purple-800 mb-3">
                                                                {style.name}
                                                            </h5>

                                                            {/* Полное описание */}
                                                            {style.fullDescription && (
                                                                <ExpandableText
                                                                    text={style.fullDescription}
                                                                    maxLength={100}
                                                                    className="text-gray-600 mb-4 text-sm leading-relaxed"
                                                                    buttonClassName="text-purple-600 text-xs"
                                                                />
                                                            )}

                                                            {/* Цена стиля */}
                                                            {style.price && (
                                                                <div className="text-lg font-bold text-orange-600 mb-4">
                                                                    {style.price} ₽
                                                                </div>
                                                            )}

                                                            {/* Иконки медиа */}
                                                            <div className="flex items-center justify-center gap-3">
                                                                {style.images && Array.isArray(style.images) && style.images.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const mediaList = style.images.map((img: string | { file_path: string; title?: string }) => ({
                                                                                type: 'image' as const,
                                                                                src: getMediaUrl(typeof img === 'string' ? img : img.file_path),
                                                                                title: typeof img === 'string' ? style.name : (img.title || style.name)
                                                                            }));
                                                                            openGallery(mediaList, 0);
                                                                        }}
                                                                        className="w-8 h-8 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                        title={`${style.images.length} фото`}
                                                                    >
                                                                        <FileImage className="w-5 h-5 text-white" />
                                                                    </button>
                                                                )}
                                                                {style.videos && Array.isArray(style.videos) && style.videos.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const mediaList = style.videos.map((vid: string | { file_path: string; title?: string }) => ({
                                                                                type: 'video' as const,
                                                                                src: getMediaUrl(typeof vid === 'string' ? vid : vid.file_path),
                                                                                title: typeof vid === 'string' ? style.name : (vid.title || style.name)
                                                                            }));
                                                                            openGallery(mediaList, 0);
                                                                        }}
                                                                        className="w-8 h-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                        title={`${style.videos.length} видео`}
                                                                    >
                                                                        <FileVideo className="w-5 h-5 text-white" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Стили временно недоступны</p>
                                        </div>
                                    )}

                                    {/* Опции услуги */}
                                    {service.options && Array.isArray(service.options) && service.options.length > 0 ? (
                                        <div className="mb-8">
                                            <h4 className="text-2xl font-bold text-blue-800 mb-6 text-center">
                                                Дополнительные услуги
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {(service.options || []).filter(option => isOptionVisibleForUser(option, userData)).map((option) => (
                                                    <Card key={option.id} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
                                                        <CardContent className="p-6 text-center">
                                                            {/* Аватар опции */}
                                                            <div className="w-20 h-20 mx-auto mb-4">
                                                                <AvatarDisplay
                                                                    images={option.images}
                                                                    type="option"
                                                                    alt={option.name}
                                                                    size="lg"
                                                                    className="w-20 h-20 rounded-full"
                                                                />
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

                                                            {/* Цена опции */}
                                                            {option.price && (
                                                                <div className="text-lg font-bold text-orange-600 mb-4">
                                                                    {option.price} ₽
                                                                </div>
                                                            )}

                                                            {/* Иконки медиа */}
                                                            <div className="flex items-center justify-center gap-3">
                                                                {option.images && Array.isArray(option.images) && option.images.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const mediaList = option.images.map((img: string | { file_path: string; title?: string }) => ({
                                                                                type: 'image' as const,
                                                                                src: getMediaUrl(typeof img === 'string' ? img : img.file_path),
                                                                                title: typeof img === 'string' ? option.name : (img.title || option.name)
                                                                            }));
                                                                            openGallery(mediaList, 0);
                                                                        }}
                                                                        className="w-8 h-8 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                        title={`${option.images.length} фото`}
                                                                    >
                                                                        <FileImage className="w-5 h-5 text-white" />
                                                                    </button>
                                                                )}
                                                                {option.videos && Array.isArray(option.videos) && option.videos.length > 0 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const mediaList = option.videos.map((vid: string | { file_path: string; title?: string }) => ({
                                                                                type: 'video' as const,
                                                                                src: getMediaUrl(typeof vid === 'string' ? vid : vid.file_path),
                                                                                title: typeof vid === 'string' ? option.name : (vid.title || option.name)
                                                                            }));
                                                                            openGallery(mediaList, 0);
                                                                        }}
                                                                        className="w-8 h-8 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                        title={`${option.videos.length} видео`}
                                                                    >
                                                                        <FileVideo className="w-5 h-5 text-white" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Кнопка записи */}
                                    <div className="text-center px-4">
                                        <Button
                                            onClick={() => navigate('/register')}
                                            className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-lg font-semibold rounded-xl transition-all duration-300 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            <Hand className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                            <span className="truncate">Записаться на мастер-класс</span>
                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Hand className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Услуги временно недоступны</h3>
                        <p className="text-gray-600">Скоро здесь появятся наши мастер-классы</p>
                    </div>
                )}

                {/* Дополнительная информация */}
                <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl p-8 border-2 border-orange-200">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Не нашли подходящий вариант?
                        </h3>
                        <p className="text-lg text-gray-600 mb-6">
                            Свяжитесь с нами, и мы подберем индивидуальную программу
                            для вашего мероприятия
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                            <Button
                                onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base"
                            >
                                Связаться с нами
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 sm:px-8 py-3 text-sm sm:text-base"
                            >
                                Посмотреть контакты
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно для просмотра медиа */}
            {selectedMedia && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-6xl w-full max-h-[90vh]">
                        {/* Кнопка закрытия */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeGallery}
                            className="absolute -top-12 right-0 text-white hover:bg-white/20 z-10"
                        >
                            <X className="w-6 h-6" />
                        </Button>

                        {/* Навигация */}
                        {currentMediaList.length > 1 && (
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
                                    alt={selectedMedia.title || 'Галерея'}
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
                        {currentMediaList.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                {currentMediaIndex + 1} из {currentMediaList.length}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};
