/**
 * @file: use-websocket.ts
 * @description: Хук для работы с WebSocket через контекст
 * @dependencies: useWebSocketContext
 * @created: 2025-08-26
 */

import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface UseWebSocketOptions {
    channel?: string;
    onMessage?: (data: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
    const { isConnected, isConnecting, subscribe, unsubscribe, sendMessage, reconnect } = useWebSocketContext();

    const subscribeToChannel = (callback: (data: any) => void) => {
        if (options.channel) {
            return subscribe(options.channel, callback);
        }
        return () => { };
    };

    return {
        isConnected,
        isConnecting,
        subscribe: subscribeToChannel,
        unsubscribe: () => options.channel && unsubscribe(options.channel),
        sendMessage,
        reconnect
    };
};

