/**
 * @file: ProcessSection.tsx
 * @description: Секция процесса мастер-класса с ярким дизайном
 * @dependencies: Card, useAboutContentContext
 * @created: 2024-12-25
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hand, Zap, Clock } from 'lucide-react';
import { useAboutContentContext } from '@/contexts/AboutContentContext';

export const ProcessSection: React.FC = () => {
    const { content, isLoading: contentLoading } = useAboutContentContext();

    // Fallback контент
    const displayContent = content || {
        process_title: 'Как проходит мастер-класс',
        process_steps: [
            { title: 'ПРИДУМАЙТЕ ЛЮБОЙ ЖЕСТ', description: 'Выберите любой жест или позу для своей руки' },
            { title: 'ПОГРУЖАЕМ В ВОСК', description: 'Аккуратно погружаем руку в теплый воск' },
            { title: 'ЧЕРЕЗ 5 МИНУТ ВАШ СУВЕНИР ГОТОВ', description: 'Быстрое создание уникального сувенира' }
        ]
    };

    if (contentLoading) {
        return (
            <section id="process" className="py-20">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-700">Загружаем процесс мастер-класса...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="process" className="py-20 relative overflow-hidden">
            {/* Декоративные элементы */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Плавающие звездочки */}
                <div className="absolute top-10 left-10 w-8 h-8 text-yellow-300 animate-bounce">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute top-20 right-20 w-6 h-6 text-pink-300 animate-pulse">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-20 left-20 w-10 h-10 text-purple-300 animate-bounce delay-1000">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-10 right-10 w-7 h-7 text-blue-300 animate-pulse delay-500">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
            </div>

            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Заголовок секции */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 animate-pulse">
                        {displayContent.process_title}
                    </h2>
                </div>

                {/* Процесс мастер-класса */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(displayContent.process_steps || []).map((step, index) => (
                        <Card
                            key={index}
                            className="relative overflow-hidden bg-gradient-to-br from-white to-pink-50 border-4 border-yellow-300 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-rotate-1"
                        >
                            {/* Декоративные элементы на карточке */}
                            <div className="absolute top-2 right-2 w-6 h-6 text-yellow-400 animate-spin">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <div className="absolute bottom-2 left-2 w-4 h-4 text-pink-400 animate-ping">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>

                            <CardContent className="p-8 text-center relative z-10">
                                {/* Номер шага */}
                                <div className={`w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg ${index === 0 ? 'animate-bounce' :
                                    index === 1 ? 'animate-pulse' :
                                        index === 2 ? 'animate-ping' : ''
                                    }`} style={{
                                        animationDelay: `${index * 1.5}s`,
                                        animationDuration: `${3 + index * 0.8}s`
                                    }}>
                                    {index + 1}
                                </div>

                                {/* Иконка */}
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    {index === 0 && <Hand className="w-8 h-8 text-white" />}
                                    {index === 1 && <Zap className="w-8 h-8 text-white" />}
                                    {index === 2 && <Clock className="w-8 h-8 text-white" />}
                                </div>

                                {/* Заголовок */}
                                <h3 className="text-xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                                    {step.title}
                                </h3>

                                {/* Описание */}
                                <p className="text-gray-700 leading-relaxed">
                                    {step.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Дополнительная информация */}
                <div className="mt-16 text-center">
                    <Card className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 border-4 border-yellow-400 shadow-2xl">
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 animate-pulse">
                                ✨ БЫСТРО • ВЕСЕЛО • БЕЗОПАСНО ✨
                            </h3>
                            <p className="text-lg text-gray-700">
                                Всего за 5 минут вы получите уникальный сувенир,
                                который будет радовать вас долгие годы!
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
};
