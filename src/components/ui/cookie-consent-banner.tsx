/**
 * @file: cookie-consent-banner.tsx
 * @description: Баннер согласия на обработку персональных данных и использование cookies
 * @dependencies: Button, Card, useAuth, useNavigate
 * @created: 2024-12-25
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CookieConsentBannerProps {
    onAccept?: () => void;
    onDecline?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
    onAccept,
    onDecline
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем, было ли уже дано согласие
        const consentGiven = localStorage.getItem('privacy-consent-given');
        const consentDate = localStorage.getItem('privacy-consent-date');

        // Показываем баннер только если согласие не было дано или прошло больше года
        if (!consentGiven || (consentDate && isConsentExpired(consentDate))) {
            // Небольшая задержка для плавного появления
            const timer = setTimeout(() => {
                setIsVisible(true);
                setIsAnimating(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, []);

    const isConsentExpired = (consentDate: string): boolean => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return new Date(consentDate) < oneYearAgo;
    };

    const handleAccept = () => {
        const now = new Date().toISOString();
        localStorage.setItem('privacy-consent-given', 'true');
        localStorage.setItem('privacy-consent-date', now);
        localStorage.setItem('privacy-consent-version', '1.0');

        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onAccept?.();
        }, 300);
    };

    const handleDecline = () => {
        localStorage.setItem('privacy-consent-given', 'false');
        localStorage.setItem('privacy-consent-date', new Date().toISOString());

        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            onDecline?.();
        }, 300);
    };

    const handleMoreInfo = () => {
        navigate('/parent/privacy-policy');
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
            <Card className="bg-white shadow-2xl border-2 border-orange-200 max-w-4xl mx-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="bg-gradient-to-r from-orange-500 to-purple-500 rounded-full p-3">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                🍪 Использование cookies и обработка персональных данных
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                Мы используем cookies и обрабатываем ваши персональные данные для обеспечения
                                работы приложения, улучшения пользовательского опыта и соблюдения требований
                                законодательства РФ. Продолжая использование приложения, вы соглашаетесь с
                                нашей <button
                                    onClick={handleMoreInfo}
                                    className="text-orange-600 hover:text-orange-700 underline font-medium"
                                >
                                    Политикой конфиденциальности
                                </button>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={handleAccept}
                                    className="bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white font-medium px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Принять и продолжить
                                </Button>

                                <Button
                                    onClick={handleMoreInfo}
                                    variant="outline"
                                    className="border-orange-300 text-orange-600 hover:bg-orange-50 font-medium px-6 py-2 rounded-lg transition-all duration-300"
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Подробнее
                                </Button>

                                <Button
                                    onClick={handleDecline}
                                    variant="ghost"
                                    className="text-gray-500 hover:text-gray-700 font-medium px-6 py-2 rounded-lg transition-all duration-300"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Отклонить
                                </Button>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            <Button
                                onClick={handleDecline}
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default CookieConsentBanner;
