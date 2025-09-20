import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Проверяем, установлено ли уже приложение
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setIsInstallable(false);
        return true;
      }
      return false;
    };

    // Перехватываем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event triggered', e);
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      console.log('PWA: Setting deferred prompt', promptEvent);
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Обрабатываем успешную установку
    const handleAppInstalled = () => {
      console.log('PWA: App installed event triggered');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Проверяем текущий статус
    const isAlreadyInstalled = checkIfInstalled();

    if (!isAlreadyInstalled) {
      // Проверяем, можем ли мы установить приложение
      const checkInstallability = () => {
        // Проверяем наличие Service Worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
              console.log('PWA: Service Worker found, checking installability');
              // Если есть SW, но нет beforeinstallprompt, возможно приложение уже предлагалось
              // Устанавливаем isInstallable в true для ручной установки
              setTimeout(() => {
                console.log('PWA: No beforeinstallprompt event, enabling manual install');
                setIsInstallable(true);
              }, 2000);
            }
          });
        }
      };

      checkInstallability();
    }

    // Добавляем слушатели событий
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Убираем зависимость isInstallable

  // Функция для показа промпта установки
  const promptInstall = async (): Promise<boolean> => {
    console.log('PWA: promptInstall called, deferredPrompt:', deferredPrompt);

    // Если есть отложенный промпт - используем его
    if (deferredPrompt) {
      try {
        console.log('PWA: Calling deferredPrompt.prompt()');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('PWA: User choice outcome:', outcome);

        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          return true;
        }

        return false;
      } catch (error) {
        console.error('Ошибка при установке PWA через deferredPrompt:', error);
        return false;
      }
    }

    // Если нет отложенного промпта, возвращаем false
    console.log('PWA: No deferred prompt available');
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
};
