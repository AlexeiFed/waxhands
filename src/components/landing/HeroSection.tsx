/**
 * @file: HeroSection.tsx
 * @description: Главная секция лендинга с призывом к действию
 * @dependencies: Button, useNavigate
 * @created: 2024-12-25
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Hand, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Декоративные элементы - звездочки и игрушки */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Большие звезды - хаотичное расположение */}
                <div className="absolute top-16 left-16 w-16 h-16 text-yellow-300 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3.2s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-28 right-24 w-12 h-12 text-blue-300 animate-pulse" style={{ animationDelay: '1.3s', animationDuration: '2.8s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-28 left-24 w-14 h-14 text-pink-300 animate-bounce" style={{ animationDelay: '2.1s', animationDuration: '3.7s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-16 right-16 w-10 h-10 text-green-300 animate-pulse" style={{ animationDelay: '0.7s', animationDuration: '2.3s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>

                {/* Маленькие звездочки - хаотичное расположение */}
                <div className="absolute top-36 left-1/3 w-6 h-6 text-yellow-200 animate-ping" style={{ animationDelay: '0.5s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-52 right-1/4 w-4 h-4 text-pink-200 animate-ping" style={{ animationDelay: '1.8s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-36 left-1/4 w-5 h-5 text-blue-200 animate-ping" style={{ animationDelay: '2.5s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-52 right-1/3 w-3 h-3 text-green-200 animate-ping" style={{ animationDelay: '1.2s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-44 left-1/2 w-4 h-4 text-purple-200 animate-ping" style={{ animationDelay: '3.1s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-44 right-1/2 w-5 h-5 text-orange-200 animate-ping" style={{ animationDelay: '0.9s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>

                {/* Дополнительные маленькие звездочки */}
                <div className="absolute top-20 left-1/4 w-3 h-3 text-yellow-300 animate-ping" style={{ animationDelay: '1.5s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-32 right-1/3 w-4 h-4 text-pink-300 animate-ping" style={{ animationDelay: '2.2s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-32 left-1/3 w-3 h-3 text-cyan-300 animate-ping" style={{ animationDelay: '0.8s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-20 right-1/4 w-4 h-4 text-green-300 animate-ping" style={{ animationDelay: '3.3s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-40 left-1/2 w-3 h-3 text-purple-300 animate-ping" style={{ animationDelay: '1.8s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-40 right-1/2 w-4 h-4 text-orange-300 animate-ping" style={{ animationDelay: '2.7s' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>

                {/* Градиентные облака */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-300/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-300/30 to-green-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="max-w-4xl mx-auto">
                    {/* Главный заголовок */}
                    <div className="mb-8">
                        <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700">✨ Магия творчества ✨</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight drop-shadow-2xl">
                            <span className="block animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }}>МК «ВОСКОВЫЕ РУЧКИ»</span>
                            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mt-4 sm:mt-6 bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 bg-clip-text text-transparent animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                                3D КОПИЯ ВАШЕЙ РУКИ
                            </span>
                            <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mt-2 sm:mt-4 text-yellow-200 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                                (В ВАШЕЙ ШКОЛЕ)
                            </span>
                        </h1>

                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-lg px-4">
                            <span className="block text-yellow-300 font-bold mb-1 sm:mb-2 text-shadow-lg">ЗАХВАТЫВАЮЩИЙ, НЕОБЫЧНЫЙ ПРОЦЕСС • МОРЕ ПОЛОЖИТЕЛЬНЫХ ЭМОЦИЙ</span>
                            <span className="block text-pink-300 font-bold mb-1 sm:mb-2 text-shadow-lg">ПРИЯТНЫЕ ОЩУЩЕНИЯ ДЛЯ КОЖИ РУК • ОРИГИНАЛЬНЫЙ СУВЕНИР</span>
                            <span className="block text-cyan-300 font-bold text-shadow-lg">СДЕЛАННЫЙ СВОИМИ РУКАМИ</span>
                        </p>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 mt-6 sm:mt-8 px-4 max-w-md sm:max-w-none mx-auto">
                        <Button
                            onClick={() => navigate('/register')}
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                        >
                            <Hand className="w-4 h-4 sm:w-6 sm:h-6 mr-2" />
                            <span className="truncate">Записаться на мастер-класс</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                            className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl w-full sm:w-auto"
                        >
                            <Palette className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Узнать больше
                        </Button>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto px-4">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">500+</div>
                            <div className="text-sm sm:text-base text-gray-600">Довольных клиентов</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">50+</div>
                            <div className="text-sm sm:text-base text-gray-600">Проведенных мастер-классов</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">100%</div>
                            <div className="text-sm sm:text-base text-gray-600">Безопасные материалы</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Плавающие элементы - хаотично расположенные */}
            <div className="absolute top-24 left-16 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.2s' }}>
                <div className="w-16 h-16 bg-orange-200/30 rounded-full flex items-center justify-center">
                    <Hand className="w-8 h-8 text-orange-600" />
                </div>
            </div>

            <div className="absolute bottom-32 right-20 animate-bounce" style={{ animationDelay: '1.8s', animationDuration: '2.7s' }}>
                <div className="w-16 h-16 bg-purple-200/30 rounded-full flex items-center justify-center">
                    <Palette className="w-8 h-8 text-purple-600" />
                </div>
            </div>

            <div className="absolute top-40 right-32 animate-bounce" style={{ animationDelay: '2.3s', animationDuration: '4.1s' }}>
                <div className="w-12 h-12 bg-yellow-200/30 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-600" />
                </div>
            </div>

            <div className="absolute bottom-16 left-24 animate-bounce" style={{ animationDelay: '0.9s', animationDuration: '3.8s' }}>
                <div className="w-14 h-14 bg-cyan-200/30 rounded-full flex items-center justify-center">
                    <Hand className="w-7 h-7 text-cyan-600" />
                </div>
            </div>

            <div className="absolute top-16 right-12 animate-bounce" style={{ animationDelay: '3.1s', animationDuration: '2.9s' }}>
                <div className="w-10 h-10 bg-pink-200/30 rounded-full flex items-center justify-center">
                    <Palette className="w-5 h-5 text-pink-600" />
                </div>
            </div>
        </section>
    );
};
