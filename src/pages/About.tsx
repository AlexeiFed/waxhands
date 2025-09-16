/**
 * @file: src/pages/About.tsx
 * @description: Страница "О нас" с информацией о студии
 * @dependencies: Navigation, HeroSection
 * @created: 2024-12-19
 */

import { Sparkles, Star, Palette, Gift, Users, Clock, MapPin, Hand, Award, Shield, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParentHeader } from "@/components/ui/parent-header";
import { ExpandableText } from "@/components/ui/expandable-text";
import { useNavigate } from "react-router-dom";
import { useAboutContentContext } from "@/contexts/AboutContentContext";
import { useAboutMedia } from "@/hooks/use-about-api";

const About = () => {
    const navigate = useNavigate();
    const { content, isLoading } = useAboutContentContext();
    const { media: aboutMedia, loading: aboutMediaLoading } = useAboutMedia();

    // Функция для получения URL медиа файлов
    const getMediaUrl = (filePath: string) => {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;
        return `${import.meta.env.VITE_API_URL || 'http://147.45.161.83:8080'}/uploads/${filePath}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-xl text-gray-700">Загружаем информацию о студии...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-wax-hands">
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

            <ParentHeader showBackButton={true} />

            <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">

                {/* Hero Section */}
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
                                {content?.title || 'Восковые Ручки'}
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                            {content?.subtitle || '✨ Магия творчества ✨'}
                        </p>

                        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            {content?.description || 'Создай свою уникальную 3D копию руки в восковом исполнении! Приезжаем в школы и детские сады. Незабываемые впечатления и уникальные сувениры за 5 минут! 🎉'}
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                onClick={() => navigate('/services')}
                            >
                                <Gift className="w-5 h-5 mr-2" />
                                Наши услуги
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                onClick={() => navigate('/contact')}
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Связаться с нами
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Основной контент */}
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Левая колонка - О нас */}
                    <div className="space-y-8">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-orange-200">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                                <Hand className="w-8 h-8 text-red-500 mr-3" />
                                {content?.title || 'О нашей студии'}
                            </h2>
                            <ExpandableText
                                text={content?.description || 'Студия «МК Восковые ручки» — это место, где рождается магия творчества! Мы специализируемся на создании уникальных 3D-копий рук детей в восковом исполнении.'}
                                className="space-y-4 text-gray-700 text-lg leading-relaxed"
                            />
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-purple-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Award className="w-7 h-7 text-purple-500 mr-3" />
                                {content?.advantages_title || 'Наши преимущества'}
                            </h3>
                            <div className="space-y-4">
                                {(content?.advantages_list || []).map((advantage, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                                        <ExpandableText
                                            text={advantage}
                                            className="text-gray-700"
                                        />
                                    </div>
                                ))}
                                {(!content?.advantages_list || content.advantages_list.length === 0) && (
                                    <div className="text-gray-500 italic">
                                        Преимущества не настроены
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Правая колонка - Как это работает */}
                    <div className="space-y-8">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-blue-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Clock className="w-7 h-7 text-blue-500 mr-3" />
                                {content?.process_title || 'Как проходит мастер-класс'}
                            </h3>
                            <div className="space-y-6">
                                {(content?.process_steps || []).map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                                            <ExpandableText
                                                text={step.description}
                                                className="text-gray-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!content?.process_steps || content.process_steps.length === 0) && (
                                    <div className="text-gray-500 italic">
                                        Шаги процесса не настроены
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-green-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Shield className="w-7 h-7 text-green-500 mr-3" />
                                {content?.safety_title || 'Безопасность и качество'}
                            </h3>
                            <ExpandableText
                                text={content?.safety_description || 'Мы используем только высококачественные, безопасные для детей материалы.'}
                                className="space-y-4 text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Наши работы и мастер-классы */}
                {aboutMedia && aboutMedia.length > 0 && (
                    <div className="mt-16">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-green-200">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                                <Sparkles className="w-8 h-8 text-green-600 mr-3" />
                                Наши работы и мастер-классы
                            </h2>
                            <p className="text-lg text-gray-600 mb-8">
                                Примеры наших мастер-классов и работ
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {aboutMedia.slice(0, 12).map((media, index) => (
                                    <div
                                        key={index}
                                        className="relative bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                                    >
                                        {media.type === 'image' ? (
                                            <div className="aspect-square">
                                                <img
                                                    src={getMediaUrl(media.file_path)}
                                                    alt={media.title || `Работа ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-square relative">
                                                <video
                                                    src={getMediaUrl(media.file_path)}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    preload="metadata"
                                                    muted
                                                    onClick={() => window.open(getMediaUrl(media.file_path), '_blank')}
                                                    onLoadedData={(e) => {
                                                        const video = e.target as HTMLVideoElement;
                                                        video.currentTime = 1; // Устанавливаем на 1 секунду для показа кадра
                                                    }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLVideoElement;
                                                        target.style.display = 'none';
                                                        target.parentElement!.innerHTML = `
                                                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                                <div class="text-center">
                                                                    <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M8 5v10l8-5-8-5z"/>
                                                                    </svg>
                                                                    <span class="text-xs text-gray-500 font-medium">Видео</span>
                                                                </div>
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                                                        <Play className="w-4 h-4 text-white ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {(media.title || media.description) && (
                                            <div className="p-2 bg-white">
                                                {media.title && (
                                                    <h4 className="text-xs font-medium text-gray-800 mb-1 line-clamp-1">
                                                        {media.title}
                                                    </h4>
                                                )}
                                                {media.description && (
                                                    <p className="text-xs text-gray-600 line-clamp-2">
                                                        {media.description}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {aboutMedia.length > 12 && (
                                <div className="text-center mt-6">
                                    <p className="text-sm text-gray-500">
                                        И еще {aboutMedia.length - 12} работ в полной галерее
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Контактная информация */}
                <div className="mt-16">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-orange-200 text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-orange-500 mr-3" />
                            Свяжитесь с нами
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            {content?.contact_info || 'Готовы организовать незабываемый мастер-класс для ваших детей? Напишите нам, и мы обсудим все детали!'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                onClick={() => navigate('/contact')}
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Написать нам
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                                onClick={() => navigate('/services')}
                            >
                                <Gift className="w-5 h-5 mr-2" />
                                Посмотреть услуги
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
