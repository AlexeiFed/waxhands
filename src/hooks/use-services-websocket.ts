/**
 * @file: use-services-websocket.ts
 * @description: WebSocket хук для автоматических обновлений услуг
 * @dependencies: useWebSocketChat
 * @created: 2025-01-25
 */

import { useEffect, useRef } from 'react';
import { useWebSocketChat } from './use-websocket-chat';

interface ServicesWebSocketMessage {
    type: 'service_created' | 'service_updated' | 'service_deleted' | 'service_style_updated' | 'service_option_updated';
    data: {
        serviceId?: string;
        styleId?: string;
        optionId?: string;
        message?: string;
    };
}

interface UseServicesWebSocketProps {
    userId?: string;
    enabled?: boolean;
    onServiceUpdate?: () => void;
}

export const useServicesWebSocket = ({
    userId,
    enabled = true,
    onServiceUpdate
}: UseServicesWebSocketProps) => {
    const onUpdateRef = useRef(onServiceUpdate);

    // Обновляем ref при изменении callback
    useEffect(() => {
        onUpdateRef.current = onServiceUpdate;
    }, [onServiceUpdate]);

    // Используем существующий WebSocket хук
    const { isConnected, sendMessage } = useWebSocketChat(
        'services', // Используем специальный ID для услуг
        userId,
        enabled,
        (message: ServicesWebSocketMessage) => {
            if (message.type === 'service_created' ||
                message.type === 'service_updated' ||
                message.type === 'service_deleted' ||
                message.type === 'service_style_updated' ||
                message.type === 'service_option_updated') {
                console.log('🔄 WebSocket: Обновление услуг:', message.type);
                onUpdateRef.current?.();
            }
        }
    );

    // Функция для отправки сообщений
    const sendServiceMessage = (type: string, data: any) => {
        if (isConnected) {
            sendMessage({
                type,
                data
            });
        }
    };

    return {
        isConnected,
        sendServiceMessage
    };
};

