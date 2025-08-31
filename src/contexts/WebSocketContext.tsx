/**
 * @file: WebSocketContext.tsx
 * @description: WebSocket контекст для централизованного управления подключениями
 * @dependencies: React, createContext, useContext, useEffect, useRef, useState, useCallback
 * @created: 2025-08-26
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL } from '@/config/api';

interface WebSocketContextType {
    isConnected: boolean;
    isConnecting: boolean;
    subscribe: (channel: string, callback: (data: any) => void) => () => void;
    unsubscribe: (channel: string) => void;
    sendMessage: (message: any) => void;
    reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setIsConnecting(true);
        const ws = new WebSocket(WS_BASE_URL);

        ws.onopen = () => {
            console.log('🔌 WebSocket соединение установлено');
            setIsConnected(true);
            setIsConnecting(false);
            reconnectAttemptsRef.current = 0;

            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({ type: 'ping' }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Обрабатываем системные сообщения
                if (data.type === 'pong') {
                    return;
                }

                // Уведомляем подписчиков
                if (data.channel && subscribersRef.current.has(data.channel)) {
                    subscribersRef.current.get(data.channel)?.forEach(callback => {
                        callback(data);
                    });
                }

                // Broadcast всем подписчикам если канал не указан
                if (!data.channel) {
                    subscribersRef.current.forEach((callbacks) => {
                        callbacks.forEach(callback => callback(data));
                    });
                }
            } catch (error) {
                console.error('❌ Ошибка обработки WebSocket сообщения:', error);
            }
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket соединение закрыто:', event.code);
            setIsConnected(false);
            setIsConnecting(false);

            // Автоматическое переподключение
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                console.log(`🔄 Попытка переподключения ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts} через ${delay}ms`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttemptsRef.current++;
                    connect();
                }, delay);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
            setIsConnecting(false);
        };

        wsRef.current = ws;
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect, disconnect]);

    const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
        if (!subscribersRef.current.has(channel)) {
            subscribersRef.current.set(channel, new Set());
        }

        subscribersRef.current.get(channel)!.add(callback);

        // Отправляем сообщение о подписке на сервер
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'subscribe',
                channels: [channel]
            }));
        }

        // Возвращаем функцию для отписки
        return () => {
            const callbacks = subscribersRef.current.get(channel);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    subscribersRef.current.delete(channel);

                    // Отправляем сообщение об отписке на сервер
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            type: 'unsubscribe',
                            channels: [channel]
                        }));
                    }
                }
            }
        };
    }, []);

    const unsubscribe = useCallback((channel: string) => {
        subscribersRef.current.delete(channel);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'unsubscribe',
                channels: [channel]
            }));
        }
    }, []);

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn('⚠️ WebSocket не подключен, сообщение не отправлено');
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    const value: WebSocketContextType = {
        isConnected,
        isConnecting,
        subscribe,
        unsubscribe,
        sendMessage,
        reconnect
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext должен использоваться внутри WebSocketProvider');
    }
    return context;
};
