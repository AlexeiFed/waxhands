/**
 * @file: parent-header.tsx
 * @description: Шапка родительского дашборда с логотипом и названием студии
 * @dependencies: logo.png, Menu icon, Share icon
 * @created: 2024-12-19
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Share2, Bell } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import ParentChat from '@/components/ui/parent-chat';
import { PWAInstallButton } from '@/components/ui/pwa-install-button';
import { useChat } from '@/hooks/use-chat';

interface ParentHeaderProps {
    showBackButton?: boolean;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({ showBackButton = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Получаем количество непрочитанных сообщений
    const chatData = useChat(user?.id);
    const { unreadCount, refetchUnread } = chatData;

    // Логируем изменения счетчика для отладки
    useEffect(() => {
        console.log('📊 ParentHeader: ПОЛНЫЕ ДАННЫЕ useChat:', chatData);
        console.log('📊 ParentHeader: unreadCount:', unreadCount, 'тип:', typeof unreadCount);
        console.log('📊 ParentHeader: user?.id:', user?.id);
        console.log('📊 ParentHeader: unreadCount > 0:', unreadCount > 0);
        if (unreadCount > 0) {
            console.log('✅ ParentHeader: Показываем Badge и зеленый кружок');
        } else {
            console.log('⚠️ ParentHeader: unreadCount = 0, Badge и кружок скрыты');
        }
    }, [unreadCount, chatData, user?.id]);

    // Принудительно обновляем счетчик при монтировании и фокусировке
    useEffect(() => {
        // Обновляем сразу при монтировании
        if (user?.id) {
            console.log('🔄 ParentHeader: Обновляем счетчик при монтировании');
            refetchUnread();
        }

        const handleFocus = () => {
            console.log('👁️ ParentHeader: Окно получило фокус - обновляем счетчик');
            refetchUnread();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refetchUnread, user?.id]);

    // Обновляем счетчик каждые 10 секунд для надежности
    useEffect(() => {
        if (!user?.id) return;

        const interval = setInterval(() => {
            console.log('⏰ ParentHeader: Периодическое обновление счетчика');
            refetchUnread();
        }, 10000); // каждые 10 секунд

        return () => clearInterval(interval);
    }, [refetchUnread, user?.id]);

    const menuItems = [
        { label: 'Главная', href: '/parent', icon: '🏠' },
        { label: 'Мой профиль', href: '/parent/profile', icon: '👤' },
        { label: 'Написать в поддержку', href: '#support', icon: '💬' },
        { label: 'О нас', href: '/about', icon: 'ℹ️' },
        { label: 'Оферта', href: '/parent/offer', icon: '📄' },
        { label: 'Политика конфиденциальности', href: '/policy', icon: '🔒' },
        { label: 'Контакты', href: '/parent/contacts', icon: '📞' },
        { label: 'Поделиться', href: '#share', icon: '📤' },
        { label: 'Выйти', href: '#logout', icon: '🚪' }
    ];

    const handleShare = () => {
        const url = window.location.origin;
        const text = 'Отличный творческий мастер-класс для детей! 🎨✨';
        const shareText = `${text}\n\n${url}`;

        // Пытаемся использовать нативный Web Share API
        if (navigator.share) {
            navigator.share({
                title: 'Студия МК Восковые ручки',
                //  text: shareText,
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
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-wax-hands shadow-lg border-b border-orange-200">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between min-w-0">
                        {/* Логотип и название */}
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            {/* Кнопка назад */}
                            {showBackButton && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(-1)}
                                    className="text-gray-700 hover:bg-orange-100 hover:text-orange-700 mr-1 sm:mr-2 flex-shrink-0"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>
                            )}

                            {/* Логотип */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex-shrink-0">
                                <img
                                    src={logoImage}
                                    alt="Логотип студии"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Название - адаптивное */}
                            <div className="min-w-0 flex-1">
                                {/* Для больших экранов */}
                                <div className="hidden sm:block">
                                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                                        Студия «МК Восковые ручки»
                                    </h1>
                                    <p className="text-xs sm:text-sm lg:text-base text-white/90 truncate">
                                        Творческие мастер-классы
                                    </p>
                                </div>

                                {/* Для мобильных */}
                                <div className="sm:hidden">
                                    <h1 className="text-sm sm:text-base font-bold text-white truncate">
                                        МК Восковые ручки
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                            {/* Кнопка уведомлений */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsChatOpen(true)}
                                className="text-white hover:bg-white/20 hover:text-white w-8 h-8 sm:w-10 sm:h-10 relative"
                                title="Сообщения"
                            >
                                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                                {unreadCount > 0 && (
                                    <>
                                        {/* Зеленый индикатор непрочитанных */}
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse z-10" />
                                        {/* Счетчик непрочитанных */}
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-1 -right-1 h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center p-0 text-xs sm:text-sm font-bold animate-pulse bg-red-600 border-2 border-white shadow-lg z-20"
                                        >
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </Badge>
                                    </>
                                )}
                            </Button>

                            {/* Кнопка поделиться */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleShare}
                                className="text-white hover:bg-white/20 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                                title="Поделиться"
                            >
                                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Button>

                            {/* Гамбургер-меню */}
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20 hover:text-white w-8 h-8 sm:w-10 sm:h-10"
                                    >
                                        <div className="flex flex-col space-y-1">
                                            <div className="w-4 sm:w-6 h-0.5 bg-current rounded-full"></div>
                                            <div className="w-3 sm:w-4 h-0.5 bg-current rounded-full ml-auto"></div>
                                        </div>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-80 bg-gradient-wax-hands">
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
                                                <h1 className="text-xl sm:text-2xl font-bold text-white">
                                                    Студия «МК Восковые ручки»
                                                </h1>
                                                <p className="text-sm sm:text-base text-white/90">
                                                    Творческие мастер-классы
                                                </p>
                                            </div>
                                        </div>
                                    </SheetHeader>
                                    <nav className="mt-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                        {menuItems.map((item) => (
                                            <button
                                                key={item.href}
                                                onClick={() => handleMenuClick(item.href)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/20 hover:text-white transition-colors duration-200 text-white font-medium text-sm"
                                            >
                                                <span className="mr-2 text-base">{item.icon}</span>
                                                {item.label}
                                            </button>
                                        ))}

                                        {/* Кнопка установки PWA */}
                                        <div className="pt-4 border-t border-white/20">
                                            <PWAInstallButton
                                                variant="ghost"
                                                className="w-full justify-start text-white hover:bg-white/20 hover:text-white"
                                            >
                                                📱 Установить приложение
                                            </PWAInstallButton>
                                        </div>
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

