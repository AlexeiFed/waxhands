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
      const promptEvent = e as BeforeInstallPromptEvent;

      // НЕ вызываем preventDefault() автоматически - это вызывает ошибку
      // Пользователь должен сам вызвать prompt() когда захочет установить
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // Обрабатываем успешную установку
    const handleAppInstalled = () => {

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

              // Если есть SW, но нет beforeinstallprompt, возможно приложение уже предлагалось
              // Устанавливаем isInstallable в true для ручной установки
              setTimeout(() => {

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

    // Если есть отложенный промпт - используем его
    if (deferredPrompt) {
      try {
        console.log('PWA: Calling deferredPrompt.prompt()');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

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

    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
};
