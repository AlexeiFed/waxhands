/**
 * @file: use-master-classes-websocket.ts
 * @description: WebSocket хук для автоматических обновлений мастер-классов
 * @dependencies: useWebSocketChat
 * @created: 2025-01-12
 */

import { useEffect, useRef } from 'react';
import { useWebSocketChat } from './use-websocket-chat';

interface MasterClassesWebSocketMessage {
    type: 'master_class_created' | 'master_class_updated' | 'master_class_deleted';
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

    // Используем существующий WebSocket хук
    const { isConnected, sendMessage } = useWebSocketChat(
        'master-classes', // Используем специальный ID для мастер-классов
        userId,
        enabled,
        (message: MasterClassesWebSocketMessage) => {
            console.log('🔔 WebSocket мастер-классов: получено сообщение:', message);

            if (message.type === 'master_class_created' ||
                message.type === 'master_class_updated' ||
                message.type === 'master_class_deleted') {

                console.log('🔄 Обновляем список мастер-классов...');
                onUpdateRef.current?.();
            }
        }
    );

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
