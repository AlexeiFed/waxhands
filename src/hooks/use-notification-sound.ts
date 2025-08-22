/**
 * @file: src/hooks/use-notification-sound.ts
 * @description: Хук для воспроизведения звуковых уведомлений
 * @dependencies: HTML5 Audio API
 * @created: 2025-08-18
 */

import { useCallback, useRef } from 'react';

export const useNotificationSound = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playNotificationSound = useCallback(() => {
        try {
            // Создаем простой звук уведомления
            if (!audioRef.current) {
                audioRef.current = new Audio();

                // Создаем простой звук с помощью Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }

            // Альтернативный способ - простая вибрация на мобильных
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch (error) {
            console.warn('Не удалось воспроизвести звук уведомления:', error);
        }
    }, []);

    const playMessageSound = useCallback(() => {
        playNotificationSound();
    }, [playNotificationSound]);

    const playChatSound = useCallback(() => {
        playNotificationSound();
    }, [playNotificationSound]);

    return {
        playNotificationSound,
        playMessageSound,
        playChatSound
    };
};

