/**
 * @file: WebSocketContext.tsx
 * @description: WebSocket контекст для централизованного управления подключениями
 * @dependencies: React, createContext, useContext, useEffect, useRef, useState, useCallback
 * @created: 2025-08-26
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL } from '@/lib/config';

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

        try {
            setIsConnecting(true);
            // Добавляем проверку на доступность WebSocket
            if (typeof WebSocket === 'undefined') {
                console.warn('⚠️ WebSocket не поддерживается в этом браузере');
                setIsConnecting(false);
                return;
            }

            // Проверяем валидность URL
            if (!WS_BASE_URL) {
                console.error('❌ WebSocket URL не определен');
                setIsConnecting(false);
                return;
            }
            const ws = new WebSocket(WS_BASE_URL);

            ws.onopen = () => {
                setIsConnected(true);
                setIsConnecting(false);
                reconnectAttemptsRef.current = 0;

                // Отправляем приветственное сообщение
                ws.send(JSON.stringify({ type: 'ping' }));
            };

            ws.onmessage = (event) => {
                try {
                    let data;

                    // Проверяем тип данных
                    if (event.data instanceof Blob) {
                        // Если это Blob, читаем как текст
                        event.data.text().then(text => {
                            try {
                                data = JSON.parse(text);
                                processMessage(data);
                            } catch (parseError) {
                                console.error('❌ Ошибка парсинга Blob данных:', parseError);
                            }
                        }).catch(blobError => {
                            console.error('❌ Ошибка чтения Blob:', blobError);
                        });
                        return;
                    } else if (typeof event.data === 'string') {
                        data = JSON.parse(event.data);
                    } else {
                        console.warn('⚠️ Неизвестный тип данных WebSocket:', typeof event.data);
                        return;
                    }

                    processMessage(data);
                } catch (error) {
                    console.error('❌ Ошибка обработки WebSocket сообщения:', error);
                }
            };

            const processMessage = (data: any) => {
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
            };

            ws.onclose = (event) => {
                setIsConnected(false);
                setIsConnecting(false);

                // Автоматическое переподключение
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
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
        } catch (error) {
            console.error('❌ Ошибка создания WebSocket соединения:', error);
            setIsConnecting(false);
            setIsConnected(false);
        }
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
        try {
            // Проверяем доступность WebSocket API
            if (typeof WebSocket === 'undefined') {
                console.warn('⚠️ WebSocket не поддерживается в этом браузере');
                return;
            }

            // Задержка подключения для избежания ошибок при инициализации
            const timeoutId = setTimeout(() => {
                try {
                    connect();
                } catch (error) {
                    console.error('❌ Ошибка подключения WebSocket:', error);
                }
            }, 1000);

            return () => {
                clearTimeout(timeoutId);
                try {
                    disconnect();
                } catch (error) {
                    console.error('❌ Ошибка отключения WebSocket:', error);
                }
            };
        } catch (error) {
            console.error('❌ Ошибка инициализации WebSocket:', error);
        }
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
        // Более информативная ошибка для отладки
        console.error('❌ useWebSocketContext hook called outside of WebSocketProvider');
        console.error('❌ Component stack:', new Error().stack);
        throw new Error('useWebSocketContext должен использоваться внутри WebSocketProvider. Check that your component is wrapped in <WebSocketProvider>');
    }
    return context;
};