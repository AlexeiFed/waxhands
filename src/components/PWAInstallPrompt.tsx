import React, { useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
    const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
    const [showPrompt, setShowPrompt] = React.useState(false);
    const [dismissed, setDismissed] = React.useState(false);
    const isMobile = React.useMemo(() => {
        if (typeof navigator === 'undefined') {
            return false;
        }

        return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
    }, []);

    useEffect(() => {
        if (isInstallable && !isInstalled && !dismissed) {
            // Показываем промпт через 3 секунды
            const timer = setTimeout(() => {
                setShowPrompt(true);
                // НЕ вызываем автоматически - только по клику пользователя
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled, dismissed]);

    const handleInstall = async () => {
        const success = await promptInstall();
        if (success) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
    };

    if (!isMobile || !showPrompt || isInstalled || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Установить Студия МК 'Восковые ручки'
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Установите приложение для быстрого доступа и работы офлайн
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleInstall}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            Установить
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDismiss}
                            className="text-gray-600"
                        >
                            Позже
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
