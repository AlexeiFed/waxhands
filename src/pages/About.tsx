/**
 * @file: src/pages/About.tsx
 * @description: Страница "О нас" с информацией о студии
 * @dependencies: Navigation, HeroSection
 * @created: 2024-12-19
 */

import { Sparkles, Star, Palette, Gift, Users, Clock, MapPin, Heart, Award, Shield, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ParentHeader } from "@/components/ui/parent-header";
import { useNavigate } from "react-router-dom";
import { useAboutContentContext } from "@/contexts/AboutContentContext";

const About = () => {
    const navigate = useNavigate();
    const { content, isLoading } = useAboutContentContext();

    return (
        <div className="min-h-screen bg-gradient-hero">
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
                                Восковые
                            </span>
                            <br />
                            <span className="text-gray-800">Ручки</span>
                            <br />
                            <span className="text-3xl md:text-4xl text-gray-600 font-normal">
                                ✨ Магия творчества ✨
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Создай свою уникальную 3D копию руки в восковом исполнении!
                            Приезжаем в школы и детские сады. Незабываемые впечатления и
                            уникальные сувениры за 5 минут! 🎉
                        </p>
                    </div>
                </div>

                {/* Основной контент */}
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Левая колонка - О нас */}
                    <div className="space-y-8">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-orange-200">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
                                <Heart className="w-8 h-8 text-red-500 mr-3" />
                                {content.aboutTitle}
                            </h2>
                            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
                                <p>{content.aboutDescription}</p>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-purple-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Award className="w-7 h-7 text-purple-500 mr-3" />
                                Наши преимущества
                            </h3>
                            <div className="space-y-4">
                                {content.advantages.map((advantage, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
                                        <p className="text-gray-700">{advantage}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Правая колонка - Как это работает */}
                    <div className="space-y-8">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-blue-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Clock className="w-7 h-7 text-blue-500 mr-3" />
                                Как проходит мастер-класс
                            </h3>
                            <div className="space-y-6">
                                {content.processSteps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                                            <p className="text-gray-600">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-green-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Shield className="w-7 h-7 text-green-500 mr-3" />
                                {content.safetyTitle}
                            </h3>
                            <div className="space-y-4 text-gray-700">
                                <p>{content.safetyDescription}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Медиа-контент */}
                {content.media.length > 0 && (
                    <div className="mt-16">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                Наши работы и мастер-классы
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Посмотрите, как проходят наши мастер-классы и какие уникальные работы создают дети
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {content.media.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-card border border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    {item.type === 'image' ? (
                                        <div className="aspect-square overflow-hidden">
                                            <img
                                                src={item.url}
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
                                        <div className="aspect-square overflow-hidden relative">
                                            <video
                                                src={item.url}
                                                className="w-full h-full object-cover"
                                                muted
                                                loop
                                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                                onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                                                onError={(e) => {
                                                    const target = e.target as HTMLVideoElement;
                                                    target.style.display = 'none';
                                                    const placeholder = document.createElement('img');
                                                    placeholder.src = '/placeholder.svg';
                                                    placeholder.alt = 'Видео недоступно';
                                                    placeholder.className = 'w-full h-full object-cover';
                                                    target.parentNode?.appendChild(placeholder);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                <div className="bg-white/90 rounded-full p-4 shadow-lg">
                                                    <Play className="w-8 h-8 text-orange-600 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

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
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Контактная информация */}
                <div className="mt-16 text-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-card border border-orange-200 max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Свяжитесь с нами</h3>
                        <p className="text-gray-600 mb-6">
                            Готовы организовать незабываемый мастер-класс для ваших детей?
                            Напишите нам, и мы обсудим все детали!
                        </p>
                        <Button
                            variant="hero"
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white shadow-glow transform hover:scale-105 transition-all duration-300"
                            onClick={() => navigate('/parent')}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Написать в поддержку
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
