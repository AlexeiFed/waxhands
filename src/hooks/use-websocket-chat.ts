/**
 * @file: use-websocket-chat.ts
 * @description: Хук для работы с WebSocket чатом через контекст
 * @dependencies: useWebSocketContext, useEffect, useRef
 * @created: 2025-08-26
 */

import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface UseWebSocketChatOptions {
    chatId?: string;
    userId?: string;
    isAdmin?: boolean;
    onMessage?: (data: any) => void;
    onStatusChange?: (status: 'connected' | 'disconnected' | 'connecting') => void;
}

export const useWebSocketChat = (
    chatId?: string,
    userId?: string,
    isAdmin: boolean = false,
    options: UseWebSocketChatOptions = {}
) => {
    const { isConnected, isConnecting, subscribe, unsubscribe, sendMessage } = useWebSocketContext();
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!isConnected || !chatId) return;

        const channel = `chat:${chatId}`;

        // Подписываемся на канал чата
        unsubscribeRef.current = subscribe(channel, (data) => {
            console.log('📨 WebSocket сообщение получено:', data);
            options.onMessage?.(data);
        });

        // Отправляем сообщение о подписке с метаданными пользователя
        sendMessage({
            type: 'subscribe',
            channels: [channel],
            userId,
            isAdmin,
            timestamp: Date.now()
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }

            // Отписываемся от канала
            unsubscribe(channel);
        };
    }, [isConnected, chatId, userId, isAdmin, subscribe, unsubscribe, sendMessage, options.onMessage]);

    // Уведомляем о изменении статуса подключения
    useEffect(() => {
        if (isConnecting) {
            options.onStatusChange?.('connecting');
        } else if (isConnected) {
            options.onStatusChange?.('connected');
        } else {
            options.onStatusChange?.('disconnected');
        }
    }, [isConnected, isConnecting, options.onStatusChange]);

    const sendChatMessage = (message: any) => {
        if (chatId) {
            sendMessage({
                ...message,
                chatId,
                userId,
                isAdmin,
                timestamp: Date.now()
            });
        }
    };

    return {
        isConnected,
        isConnecting,
        sendMessage: sendChatMessage
    };
};
