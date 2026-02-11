/**
 * @file: landing-header.tsx
 * @description: Шапка для лендинга с кнопками входа и регистрации
 * @dependencies: Button, useNavigate, logo.png
 * @created: 2024-12-25
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogIn } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { PWAInstallButton } from '@/components/ui/pwa-install-button';
import { useLandingSettings } from '@/hooks/use-landing-settings';

export const LandingHeader: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { registrationEnabled, isLoading: landingSettingsLoading } = useLandingSettings();

    const menuItems = [
        { label: 'Процесс', href: '#process' },
        { label: 'О нас', href: '#about' },
        { label: 'Услуги', href: '#services' },
        { label: 'Гарантии', href: '#guarantees' },
        { label: 'Оплата', href: '#payment' },
        { label: 'Галерея', href: '#gallery' },
        { label: 'Контакты', href: '#contacts' }
    ];

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId.replace('#', ''));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-200 shadow-sm">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Логотип */}
                    <div className="flex items-center space-x-3">
                        <img
                            src={logoImage}
                            alt="Восковые Ручки"
                            className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-900">Восковые Ручки</h1>
                            <p className="text-xs text-gray-600">Студия творчества</p>
                        </div>
                    </div>

                    {/* Десктопное меню */}
                    <nav className="hidden md:flex items-center space-x-8">
                        {menuItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => scrollToSection(item.href)}
                                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 font-medium"
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Кнопки действий */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {registrationEnabled && !landingSettingsLoading && (
                            <>
                                <PWAInstallButton
                                    variant="ghost"
                                    size="sm"
                                    className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                                >
                                    <span>Установить</span>
                                </PWAInstallButton>

                                <Button
                                    variant="ghost"
                                    onClick={() => navigate('/login')}
                                    className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Войти</span>
                                </Button>

                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                                >
                                    <User className="w-4 h-4 mr-1 sm:mr-2" />
                                    <span className="hidden xs:inline">Зарегистрироваться</span>
                                    <span className="xs:hidden">Регистрация</span>
                                </Button>
                            </>
                        )}

                        {/* Мобильное меню */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Мобильное меню */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-orange-200 bg-white/95 backdrop-blur-md">
                        <div className="px-4 pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => scrollToSection(item.href)}
                                    className="block w-full text-left px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors duration-200"
                                >
                                    {item.label}
                                </button>
                            ))}
                            {registrationEnabled && !landingSettingsLoading && (
                                <div className="pt-2 border-t border-orange-200 space-y-1">
                                    <PWAInstallButton
                                        variant="ghost"
                                        className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                                    >
                                        Установить приложение
                                    </PWAInstallButton>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            navigate('/login');
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full justify-start text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                                    >
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Войти
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
