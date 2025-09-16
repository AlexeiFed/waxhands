/**
 * @file: LandingPage.tsx
 * @description: Главная лендинг-страница для неавторизованных пользователей
 * @dependencies: LandingHeader, HeroSection, AboutSection, ServicesSection, GallerySection, CTASection
 * @created: 2024-12-25
 */

import React from 'react';
import { LandingHeader } from '@/components/ui/landing-header';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { GallerySection } from '@/components/landing/GallerySection';
import { CTASection } from '@/components/landing/CTASection';

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-wax-hands">
            <LandingHeader />
            <main>
                <HeroSection />
                <ProcessSection />
                <AboutSection />
                <ServicesSection />
                <GallerySection />
                <CTASection />
            </main>

            {/* Футер */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Логотип и описание */}
                        <div>
                            <h3 className="text-xl font-bold mb-4">Восковые Ручки</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Студия творчества, где создаются уникальные 3D копии рук
                                в восковом исполнении. Магия творчества для всей семьи!
                            </p>
                        </div>

                        {/* Быстрые ссылки */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Навигация</h4>
                            <ul className="space-y-2">
                                <li>
                                    <button
                                        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        О нас
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        Услуги
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        Галерея
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        Контакты
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Контакты */}
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Контакты</h4>
                            <div className="space-y-2 text-gray-400">
                                <p>+7 (914) 545-06-06</p>
                                <p>pavelt80@mail.ru</p>
                                <p>г. Хабаровск</p>
                            </div>
                            <div className="mt-4 space-y-2">
                                <button
                                    onClick={() => window.open('/offer', '_blank')}
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Публичная оферта
                                </button>
                                <br />
                                <button
                                    onClick={() => window.open('/policy', '_blank')}
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    Политика конфиденциальности
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Копирайт */}
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Восковые Ручки. Все права защищены.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
