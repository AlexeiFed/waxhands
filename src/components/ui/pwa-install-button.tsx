/**
 * @file: pwa-install-button.tsx
 * @description: Переиспользуемая кнопка установки PWA приложения
 * @dependencies: usePWAInstall, Button, Download icon
 * @created: 2025-01-18
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { PWAInstallModal } from '@/components/ui/pwa-install-modal';

interface PWAInstallButtonProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    className?: string;
    showIcon?: boolean;
    children?: React.ReactNode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
    variant = 'default',
    size = 'default',
    className = '',
    showIcon = true,
    children
}) => {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
    const [showModal, setShowModal] = useState(false);

    // Не показываем кнопку только если приложение уже установлено
    if (isInstalled) {
        return null;
    }

    const handleInstall = async () => {
        // Проверяем, поддерживает ли браузер нативный промпт установки
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        // Для iOS Safari показываем инструкции
        if (isIOS || isSafari) {

            setShowModal(true);
            return;
        }

        // Для других браузеров пытаемся использовать нативный промпт

        try {
            const success = await promptInstall();
            if (success) {

                return;
            } else {

                // Показываем модальное окно с инструкциями вместо принудительного обновления
                setShowModal(true);
            }
        } catch (error) {
            console.error('Ошибка при нативной установке:', error);
            setShowModal(true);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleInstall}
                className={`${className}`}
            >
                {showIcon && <Download className="w-4 h-4 mr-2" />}
                {children || 'Установить приложение'}
            </Button>

            <PWAInstallModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
};
