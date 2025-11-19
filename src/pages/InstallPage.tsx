/**
 * @file: InstallPage.tsx
 * @description: Страница установки PWA приложения
 * @dependencies: Button, Card, Download, Smartphone, Monitor
 * @created: 2025-09-22
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, CheckCircle, ArrowRight, Share } from 'lucide-react';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Проверяем, установлено ли уже приложение
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Слушаем событие beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // НЕ вызываем preventDefault() автоматически - это вызывает ошибку
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        // Слушаем событие appinstalled
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Показываем диалог установки
        deferredPrompt.prompt();

        // Ждем ответа пользователя
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Пользователь принял установку');
        } else {
            console.log('Пользователь отклонил установку');
        }

        setDeferredPrompt(null);
    };

    const handleShareClick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Восковые Ручки - PWA приложение',
                    text: 'Установите наше приложение для удобного доступа к мастер-классам!',
                    url: window.location.origin
                });
            } catch (err) {
                console.log('Ошибка при попытке поделиться:', err);
            }
        } else {
            // Fallback - копируем ссылку в буфер обмена
            navigator.clipboard.writeText(window.location.origin);
            alert('Ссылка скопирована в буфер обмена!');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="text-center pb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Download className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                            Установите наше приложение
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600">
                            Получите быстрый доступ к мастер-классам и удобный интерфейс
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8">
                        {isInstalled ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Приложение уже установлено!
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Вы можете найти его на главном экране вашего устройства
                                </p>
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                                >
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Перейти в приложение
                                </Button>
                            </div>
                        ) : isInstallable ? (
                            <div className="text-center py-8">
                                <Button
                                    onClick={handleInstallClick}
                                    size="lg"
                                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    <Download className="w-6 h-6 mr-3" />
                                    Установить приложение
                                </Button>
                                <p className="text-sm text-gray-500 mt-4">
                                    Нажмите кнопку выше для установки
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                    Инструкции по установке
                                </h3>
                                <div className="space-y-4 text-left">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-orange-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Откройте в браузере</p>
                                            <p className="text-gray-600 text-sm">Перейдите на сайт в мобильном браузере</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-orange-600 font-bold text-sm">2</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Найдите кнопку "Добавить на главный экран"</p>
                                            <p className="text-gray-600 text-sm">В меню браузера (три точки) или в адресной строке</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <span className="text-orange-600 font-bold text-sm">3</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Подтвердите установку</p>
                                            <p className="text-gray-600 text-sm">Нажмите "Добавить" в появившемся диалоге</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Преимущества установки */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Быстрый доступ</h4>
                                    <p className="text-sm text-gray-600">С главного экрана устройства</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <Monitor className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Полноэкранный режим</h4>
                                    <p className="text-sm text-gray-600">Без адресной строки браузера</p>
                                </div>
                            </div>
                        </div>

                        {/* QR-код для установки */}
                        <div className="pt-6 border-t border-gray-200">
                            <QRCodeGenerator
                                url={window.location.origin + '/install'}
                                size={150}
                            />
                        </div>

                        {/* Кнопка поделиться */}
                        <div className="text-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleShareClick}
                                className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                                <Share className="w-4 h-4 mr-2" />
                                Поделиться ссылкой
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InstallPage;
