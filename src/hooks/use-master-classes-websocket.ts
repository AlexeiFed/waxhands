/**
 * @file: use-master-classes-websocket.ts
 * @description: WebSocket хук для автоматических обновлений мастер-классов
 * @dependencies: useWebSocketChat
 * @created: 2025-01-12
 */

import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface MasterClassesWebSocketMessage {
    type: 'master_class_created' | 'master_class_updated' | 'master_class_deleted' | 'payment_status_updated';
    data: {
        masterClassId?: string;
        schoolId?: string;
        date?: string;
        message?: string;
    };
}

interface UseMasterClassesWebSocketProps {
    userId?: string;
    enabled?: boolean;
    onMasterClassUpdate?: () => void;
}

export const useMasterClassesWebSocket = ({
    userId,
    enabled = true,
    onMasterClassUpdate
}: UseMasterClassesWebSocketProps) => {
    const onUpdateRef = useRef(onMasterClassUpdate);

    // Обновляем ref при изменении callback
    useEffect(() => {
        onUpdateRef.current = onMasterClassUpdate;
    }, [onMasterClassUpdate]);

    // Используем WebSocket контекст напрямую для подписки на системные каналы
    const { isConnected, subscribe, unsubscribe, sendMessage } = useWebSocketContext();
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!isConnected || !enabled) return;

        // Подписываемся на системные каналы для мастер-классов
        const channels = ['admin:all', 'system:all'];

        unsubscribeRef.current = subscribe(channels, (message: any) => {
            // Обрабатываем сообщения типа master_class_update
            if (message.type === 'master_class_update') {
                const action = message.data?.action;
                if (
                    action === 'created' ||
                    action === 'updated' ||
                    action === 'deleted' ||
                    action === 'payment_status_updated' ||
                    action === 'cash_payment_confirmed' ||
                    action === 'participant_removed' ||
                    action === 'user_created' ||
                    action === 'payment_settings_changed'
                ) {
                    console.log('📡 WebSocket: получено обновление мастер-класса:', action);
                    onUpdateRef.current?.();
                }
            }
        });

        // Отправляем сообщение о подписке
        sendMessage({
            type: 'subscribe',
            channels,
            userId,
            timestamp: Date.now()
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [isConnected, enabled, userId, subscribe, unsubscribe, sendMessage]);

    // Функция для отправки сообщений
    const sendMasterClassMessage = (type: string, data: any) => {
        if (isConnected) {
            sendMessage({
                type,
                data
            });
        }
    };

    return {
        isConnected,
        sendMasterClassMessage
    };
};
