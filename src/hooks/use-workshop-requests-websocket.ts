/**
 * @file: src/hooks/use-workshop-requests-websocket.ts
 * @description: Хук для WebSocket уведомлений о заявках на мастер-классы
 * @dependencies: useCallback, useEffect, useRef, useState
 * @created: 2024-12-19
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkshopRequests } from './use-workshop-requests';
import { useToast } from './use-toast';
import { WS_BASE_URL } from '../lib/config';

interface WebSocketMessage {
    type: 'workshop_request_update' | 'workshop_request_created' | 'workshop_request_deleted' | 'workshop_request_status_change';
    data: Record<string, unknown>;
    timestamp: number;
    targetUsers?: string[];
    targetRoles?: string[];
}

interface WebSocketState {
    isConnected: boolean;
    isConnecting: boolean;
    connectionAttempts: number;
    lastError?: string;
}

export const useWorkshopRequestsWebSocket = (
    userId?: string,
    isAdmin: boolean = false,
    onMessage?: (message: WebSocketMessage) => void
) => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionAttemptsRef = useRef(0);
    const onMessageRef = useRef(onMessage);

    // Обновляем ref для onMessage при изменении
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const [wsState, setWsState] = useState<WebSocketState>({
        isConnected: false,
        isConnecting: false,
        connectionAttempts: 0
    });

    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000;

    // Функция для создания WebSocket соединения
    const connect = useCallback(() => {

        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        if (wsState.isConnecting) {
            return;
        }

        setWsState(prev => ({ ...prev, isConnecting: true }));

        try {
            const wsUrl = `${WS_BASE_URL}?userId=${userId}&isAdmin=${isAdmin}`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                setWsState({
                    isConnected: true,
                    isConnecting: false,
                    connectionAttempts: 0
                });
                connectionAttemptsRef.current = 0;

                // Отправляем ping каждые 60 секунд
                pingIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 60000);

                // Подписываемся на каналы
                if (userId) {
                    wsRef.current.send(JSON.stringify({
                        type: 'subscribe',
                        channels: [`user:${userId}`, 'workshop_requests:all']
                    }));
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    let message;

                    // Проверяем тип данных
                    if (event.data instanceof Blob) {
                        // Если это Blob, читаем как текст
                        event.data.text().then(text => {
                            try {
                                message = JSON.parse(text);
                                if (message.type === 'pong') return;

                                // Вызываем callback функцию если она есть
                                if (onMessageRef.current && typeof onMessageRef.current === 'function') {
                                    onMessageRef.current(message);
                                }
                            } catch (parseError) {
                                console.error('❌ WorkshopRequests: Ошибка парсинга Blob данных:', parseError);
                            }
                        }).catch(blobError => {
                            console.error('❌ WorkshopRequests: Ошибка чтения Blob:', blobError);
                        });
                        return;
                    } else if (typeof event.data === 'string') {
                        message = JSON.parse(event.data);
                    } else {
                        console.warn('⚠️ WorkshopRequests: Неизвестный тип данных:', typeof event.data);
                        return;
                    }

                    if (message.type === 'pong') {
                        return;
                    }

                    // Вызываем callback функцию если она есть
                    if (onMessageRef.current && typeof onMessageRef.current === 'function') {
                        onMessageRef.current(message);
                    }
                } catch (error) {
                    console.error('❌ WorkshopRequests: Ошибка парсинга сообщения:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                setWsState(prev => ({ ...prev, isConnected: false, isConnecting: false }));

                // Очищаем интервал ping
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Попытка переподключения только если не превышен лимит
                if (connectionAttemptsRef.current < maxReconnectAttempts) {
                    connectionAttemptsRef.current += 1;

                    // Очищаем предыдущий таймаут
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }

                    reconnectTimeoutRef.current = setTimeout(() => {
                        setWsState(prev => ({ ...prev, connectionAttempts: connectionAttemptsRef.current }));
                        connect();
                    }, reconnectDelay);
                } else {
                    setWsState(prev => ({ ...prev, lastError: 'Connection failed after multiple attempts' }));
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ WorkshopRequests: WebSocket ошибка:', error);
                setWsState(prev => ({ ...prev, lastError: 'Connection error' }));
            };

        } catch (error) {
            console.error('❌ WorkshopRequests: Ошибка создания WebSocket:', error);
            setWsState(prev => ({ ...prev, isConnecting: false, lastError: 'Failed to create connection' }));
        }
    }, [userId, isAdmin]); // Убрал лишние зависимости

    // Функция для отключения
    const disconnect = useCallback(() => {

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'Manual disconnect');
            wsRef.current = null;
        }

        setWsState({
            isConnected: false,
            isConnecting: false,
            connectionAttempts: 0
        });

        connectionAttemptsRef.current = 0;
    }, []);

    // Функция для отправки сообщений
    const sendMessage = useCallback((message: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('⚠️ WorkshopRequests: WebSocket не открыт, состояние:', wsRef.current?.readyState);
            return false;
        }
    }, []);

    // Подключаемся при монтировании компонента
    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    return {
        ...wsState,
        connect,
        disconnect,
        sendMessage
    };
};
