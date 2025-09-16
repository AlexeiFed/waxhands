/**
 * @file: AboutSection.tsx
 * @description: Секция "О нас" для лендинга
 * @dependencies: Card, useAboutContent, useAboutMedia
 * @created: 2024-12-25
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand, Star, Users, Clock, Shield, Award, Play, X } from 'lucide-react';
import { useAboutContentContext } from '@/contexts/AboutContentContext';
import { useAboutMedia } from '@/hooks/use-about-api';

export const AboutSection: React.FC = () => {
    const { content, isLoading: contentLoading } = useAboutContentContext();
    const { media, loading: mediaLoading } = useAboutMedia();
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // Fallback контент
    const displayContent = content || {
        title: 'Восковые Ручки',
        subtitle: '✨ Магия творчества ✨',
        description: 'Создай свою уникальную 3D копию руки в восковом исполнении!',
        studio_title: 'О нашей студии',
        studio_description: 'Студия «МК Восковые ручки» — это место, где рождается магия творчества! Мы создаем уникальные 3D копии рук в восковом исполнении, которые станут незабываемым сувениром на память.',
        advantages_title: 'Наши преимущества',
        advantages_list: [
            'Быстрое создание (30-45 минут)',
            'Выездные мастер-классы',
            'Уникальные сувениры на память',
            'Безопасные материалы для детей',
            'Опытные мастера',
            'Индивидуальный подход'
        ],
        process_title: 'Как проходит мастер-класс',
        process_steps: [
            { title: 'Подготовка', description: 'Настройка оборудования и подготовка материалов' },
            { title: 'Создание', description: 'Работа с воском и создание отпечатка' },
            { title: 'Обработка', description: 'Финализация и упаковка сувенира' },
            { title: 'Готово!', description: 'Уникальный сувенир готов!' }
        ],
        safety_title: 'Безопасность и качество',
        safety_description: 'Используем только сертифицированные и безопасные материалы, подходящие для детей всех возрастов. Все наши мастера имеют опыт работы с детьми.'
    };

    const displayMedia = media || [];

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
    const images = displayMedia.filter(item => item.type === 'image');
    const videos = displayMedia.filter(item => item.type === 'video');

    if (contentLoading || mediaLoading) {
        return (
            <section id="about" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-700">Загружаем информацию о студии...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="about" className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        {displayContent.studio_title}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        {displayContent.studio_description}
                    </p>
                </div>

                {/* Основная информация */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Текстовая информация */}
                    <div className="space-y-8">
                        <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 shadow-xl">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Hand className="w-8 h-8 text-orange-600 mr-3" />
                                    Что мы делаем
                                </h3>
                                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                                    Создаем уникальные 3D копии рук в восковом исполнении.
                                    Каждый мастер-класс — это увлекательное путешествие в мир творчества,
                                    где дети и взрослые могут создать неповторимый сувенир на память.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                        <Star className="w-4 h-4 mr-1" />
                                        Уникально
                                    </Badge>
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                                        <Users className="w-4 h-4 mr-1" />
                                        Для всей семьи
                                    </Badge>
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                        <Clock className="w-4 h-4 mr-1" />
                                        Быстро
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Преимущества */}
                        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 shadow-xl">
                            <CardContent className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                    <Award className="w-8 h-8 text-purple-600 mr-3" />
                                    {displayContent.advantages_title}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(displayContent.advantages_list || []).map((advantage, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                            <span className="text-gray-700">{advantage}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Медиа контент */}
                    <div className="space-y-6">
                        {/* Изображения */}
                        {images.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Наши работы</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {images.slice(0, 4).map((item, index) => (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                        >
                                            <img
                                                src={getMediaUrl(item.file_path)}
                                                alt={`Работа ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Видео */}
                        {videos.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">Видео о нас</h3>
                                <div className="space-y-4">
                                    {videos.slice(0, 2).map((item, index) => (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                            onClick={() => setSelectedVideo(getMediaUrl(item.file_path))}
                                        >
                                            <video
                                                className="w-full h-48 object-cover"
                                                poster={getMediaUrl(item.thumbnail_path || '')}
                                            >
                                                <source src={getMediaUrl(item.file_path)} type="video/mp4" />
                                            </video>
                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <Play className="w-8 h-8 text-orange-600 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                {/* Безопасность */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                {displayContent.safety_title}
                            </h3>
                        </div>
                        <div className="text-justify leading-relaxed">
                            <p className="text-lg text-gray-700 mb-4 px-4">
                                {displayContent.safety_description}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                                <div className="bg-white/50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">🛡️ Безопасные материалы</h4>
                                    <p className="text-gray-700 text-sm">Используем только сертифицированные и гипоаллергенные материалы, подходящие для детей всех возрастов</p>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">👨‍🏫 Опытные мастера</h4>
                                    <p className="text-gray-700 text-sm">Все наши мастера имеют опыт работы с детьми и прошли специальную подготовку</p>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">🔬 Контроль качества</h4>
                                    <p className="text-gray-700 text-sm">Каждый материал проходит проверку на соответствие стандартам безопасности</p>
                                </div>
                                <div className="bg-white/50 rounded-lg p-4 border border-green-200">
                                    <h4 className="font-semibold text-green-800 mb-2">📋 Инструктаж</h4>
                                    <p className="text-gray-700 text-sm">Перед началом мастер-класса проводится подробный инструктаж по технике безопасности</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Модальное окно для видео */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl w-full">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVideo(null)}
                            className="absolute -top-12 right-0 text-white hover:bg-white/20"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                        <video
                            className="w-full rounded-lg"
                            controls
                            autoPlay
                        >
                            <source src={selectedVideo} type="video/mp4" />
                        </video>
                    </div>
                </div>
            )}
        </section>
    );
};
