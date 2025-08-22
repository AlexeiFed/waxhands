/**
 * @file: parent-header.tsx
 * @description: Шапка родительского дашборда с логотипом и названием студии
 * @dependencies: logo.png, Menu icon, Share icon
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Share2 } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ParentChat from '@/components/ui/parent-chat';

interface ParentHeaderProps {
    showBackButton?: boolean;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({ showBackButton = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Главная', href: '/parent', icon: '🏠' },
        { label: 'Мой профиль', href: '/parent/profile', icon: '👤' },
        { label: 'Написать в поддержку', href: '#support', icon: '💬' },
        { label: 'О нас', href: '/about', icon: 'ℹ️' },
        { label: 'Поделиться', href: '#share', icon: '📤' },
        { label: 'Выйти', href: '#logout', icon: '🚪' }
    ];

    const handleShare = () => {
        const url = 'https://waxhands.ru';
        const text = 'Отличные творческие мастер-классы для детей! 🎨✨';
        const shareText = `${text}\n\n${url}`;

        // Пытаемся использовать нативный Web Share API
        if (navigator.share) {
            navigator.share({
                title: 'Студия МК Восковые ручки',
                text: shareText,
                url: url
            }).catch(() => {
                // Если нативный шаринг не сработал, показываем выбор
                showShareOptions(url, shareText);
            });
        } else {
            // Для браузеров без Web Share API
            showShareOptions(url, shareText);
        }
    };

    const showShareOptions = (url: string, text: string) => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

        // Открываем в новом окне
        const choice = window.confirm(
            'Выберите способ поделиться:\n\n' +
            'OK - WhatsApp\n' +
            'Отмена - Telegram'
        );

        if (choice) {
            window.open(whatsappUrl, '_blank');
        } else {
            window.open(telegramUrl, '_blank');
        }
    };

    const handleMenuClick = (href: string) => {
        if (href.startsWith('/')) {
            // Для внутренних ссылок используем React Router
            navigate(href);
            setIsMenuOpen(false);
        } else if (href === '#logout') {
            // Для выхода используем logout из AuthContext
            logout();
            toast({
                title: "Выход выполнен",
                description: "Вы успешно вышли из системы",
            });
            setIsMenuOpen(false);
        } else if (href === '#support') {
            // Для поддержки открываем чат
            setIsChatOpen(true);
            setIsMenuOpen(false);
        } else if (href === '#share') {
            // Для шаринга
            handleShare();
            setIsMenuOpen(false);
        } else {
            // Для остальных пунктов просто закрываем меню
            setIsMenuOpen(false);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 shadow-lg border-b border-orange-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Логотип и название */}
                        <div className="flex items-center space-x-3">
                            {/* Кнопка назад */}
                            {showBackButton && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(-1)}
                                    className="text-gray-700 hover:bg-orange-100 hover:text-orange-700 mr-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>
                            )}
                            <div className="w-12 h-12">
                                <img
                                    src={logoImage}
                                    alt="Логотип студии"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                                    Студия «МК Восковые ручки»
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Творческие мастер-классы
                                </p>
                            </div>
                            <div className="sm:hidden">
                                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                                    МК Восковые ручки
                                </h1>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center space-x-2">
                            {/* Кнопка поделиться */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleShare}
                                className="text-gray-700 hover:bg-orange-100 hover:text-orange-700"
                                title="Поделиться"
                            >
                                <Share2 className="w-5 h-5" />
                            </Button>

                            {/* Гамбургер-меню */}
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-700 hover:bg-orange-100 hover:text-orange-700"
                                    >
                                        <div className="flex flex-col space-y-1">
                                            <div className="w-6 h-0.5 bg-current rounded-full"></div>
                                            <div className="w-4 h-0.5 bg-current rounded-full ml-auto"></div>
                                        </div>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-80 bg-gradient-to-b from-orange-50 to-purple-50">
                                    <SheetHeader className="border-b border-orange-200 pb-4">
                                        {/* Заголовок студии с логотипом */}
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12">
                                                <img
                                                    src={logoImage}
                                                    alt="Логотип студии"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div>
                                                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                                                    Студия «МК Восковые ручки»
                                                </h1>
                                                <p className="text-sm sm:text-base text-gray-600">
                                                    Творческие мастер-классы
                                                </p>
                                            </div>
                                        </div>
                                    </SheetHeader>
                                    <nav className="mt-6 space-y-4">
                                        {menuItems.map((item) => (
                                            <button
                                                key={item.href}
                                                onClick={() => handleMenuClick(item.href)}
                                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200 text-gray-700 font-medium"
                                            >
                                                <span className="mr-3">{item.icon}</span>
                                                {item.label}
                                            </button>
                                        ))}
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            {/* Компонент чата */}
            <ParentChat
                isOpen={isChatOpen}
                onOpenChange={setIsChatOpen}
            />
        </>
    );
};

