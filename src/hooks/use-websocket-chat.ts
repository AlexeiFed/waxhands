/**
 * @file: src/hooks/use-websocket-chat.ts
 * @description: Хук для WebSocket соединения с централизованным сервером уведомлений
 * @dependencies: useNotificationSound, useCallback, useEffect, useRef
 * @created: 2024-12-19
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';
import { WS_BASE_URL } from '../lib/config';
import { useNotificationSound } from './use-notification-sound';

interface WebSocketMessage {
    type: 'connection_established' | 'chat_message' | 'chat_status_change' | 'chat_list_update' | 'new_chat' | 'unread_count_update' | 'invoice_update' | 'master_class_update' | 'user_registration' | 'system_notification' | 'pong';
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

export const useWebSocketChat = (chatId?: string, userId?: string, isAdmin: boolean = false) => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionAttemptsRef = useRef(0);
    const { playMessageSound } = useNotificationSound();

    const [wsState, setWsState] = useState<WebSocketState>({
        isConnected: false,
        isConnecting: false,
        connectionAttempts: 0
    });

    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000; // Начальная задержка 2 секунды

    // Функция для создания WebSocket соединения
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
            console.log('🔌 WebSocket: Уже подключен или подключается, пропускаем');
            return;
        }

        if (wsState.isConnecting) {
            console.log('🔌 WebSocket: Уже идет подключение, пропускаем');
            return;
        }

        setWsState(prev => ({ ...prev, isConnecting: true }));

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = protocol === 'wss:' ?
                `wss://${host}/api/chat/ws?userId=${userId}&isAdmin=${isAdmin}` :
                `${WS_BASE_URL}?userId=${userId}&isAdmin=${isAdmin}`;

            console.log('🔌 Подключение к WebSocket:', wsUrl);

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('🔌 WebSocket соединение установлено');
                setWsState({
                    isConnected: true,
                    isConnecting: false,
                    connectionAttempts: 0
                });
                connectionAttemptsRef.current = 0;

                // Отправляем ping каждые 60 секунд для поддержания соединения
                pingIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 60000);

                // Подписываемся на каналы
                if (isAdmin) {
                    // Админ подписывается на все чаты
                    wsRef.current.send(JSON.stringify({
                        type: 'subscribe',
                        channels: ['admin:all', 'chat:all']
                    }));
                } else {
                    // Пользователь подписывается на свои уведомления
                    const channels = [`user:${userId}`];
                    if (chatId) {
                        // Если есть конкретный чат, подписываемся на него
                        channels.push(`chat:${chatId}`);
                    }
                    wsRef.current.send(JSON.stringify({
                        type: 'subscribe',
                        channels
                    }));
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    switch (message.type) {
                        case 'connection_established':
                            console.log('🔌 WebSocket соединение подтверждено:', message.data);
                            break;

                        case 'chat_message':
                            // Админ получает все сообщения, пользователь - все сообщения в своих чатах
                            if (isAdmin || message.data.chatId === chatId) {
                                // Воспроизводим звук только для получателя (не для отправителя)
                                if (message.data.senderId !== userId) {
                                    playMessageSound();
                                }
                                console.log('📨 Получено новое сообщение через WebSocket:', message.data);

                                // Если это сообщение от админа к родителю, нужно обновить UI
                                if (!isAdmin && message.data.senderType === 'admin') {
                                    console.log('📨 Родитель получил сообщение от админа, обновляем UI');
                                    // Здесь можно добавить логику для обновления UI
                                }
                            }
                            break;

                        case 'chat_list_update':
                            // Админ получает уведомления об обновлении списка чатов
                            if (isAdmin) {
                                console.log('📋 Обновление списка чатов через WebSocket:', message.data);
                                // Здесь можно добавить логику для обновления списка чатов
                            }
                            break;

                        case 'new_chat':
                            // Админ получает уведомления о новых чатах
                            if (isAdmin) {
                                console.log('🆕 Новый чат через WebSocket:', message.data);
                                // Здесь можно добавить логику для обновления списка чатов
                            }
                            break;

                        case 'unread_count_update':
                            // Обновление непрочитанных сообщений
                            console.log('🔢 Обновление непрочитанных через WebSocket:', message.data);
                            // Здесь можно добавить логику для обновления счетчиков
                            break;

                        case 'chat_status_change':
                            if (message.data.chatId === chatId) {
                                console.log('📊 Изменение статуса чата через WebSocket:', message.data.status);
                            }
                            break;

                        case 'invoice_update':
                            if (message.data.userId === userId) {
                                console.log('💰 Обновление счета через WebSocket:', message.data);
                            }
                            break;

                        case 'master_class_update':
                            console.log('🎨 Обновление мастер-класса через WebSocket:', message.data);
                            break;

                        case 'user_registration':
                            if (isAdmin) {
                                console.log('👤 Новая регистрация пользователя через WebSocket:', message.data);
                            }
                            break;

                        case 'system_notification':
                            console.log('🔔 Системное уведомление через WebSocket:', message.data);
                            break;

                        case 'pong':
                            // Ответ на ping
                            break;

                        default:
                            console.log('📨 Неизвестный тип WebSocket сообщения:', message.type);
                    }
                } catch (error) {
                    console.error('❌ Ошибка парсинга WebSocket сообщения:', error);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('🔌 WebSocket соединение закрыто:', event.code, event.reason);
                setWsState(prev => ({ ...prev, isConnected: false, isConnecting: false }));

                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Попытка переподключения только для неожиданных разрывов
                if (event.code !== 1000 && connectionAttemptsRef.current < maxReconnectAttempts) {
                    connectionAttemptsRef.current += 1;
                    console.log(`🔄 Попытка переподключения ${connectionAttemptsRef.current}/${maxReconnectAttempts}`);

                    // Очищаем предыдущий таймаут
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }

                    reconnectTimeoutRef.current = setTimeout(() => {
                        setWsState(prev => ({ ...prev, connectionAttempts: connectionAttemptsRef.current }));
                        connect();
                    }, reconnectDelay);
                } else if (connectionAttemptsRef.current >= maxReconnectAttempts) {
                    console.log('❌ Превышен лимит попыток переподключения');
                    setWsState(prev => ({ ...prev, lastError: 'Connection failed after multiple attempts' }));
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('❌ WebSocket ошибка:', error);
                setWsState(prev => ({ ...prev, lastError: 'Connection error' }));
            };

        } catch (error) {
            console.error('❌ Ошибка создания WebSocket:', error);
            setWsState(prev => ({ ...prev, isConnecting: false, lastError: 'Failed to create connection' }));
        }
    }, [chatId, userId, isAdmin]); // Убрал лишние зависимости

    // Функция для отправки сообщения через WebSocket
    const sendMessage = useCallback((message: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'new_message',
                data: { message, chatId }
            }));
        }
    }, [chatId]);

    // Функция для закрытия соединения
    const disconnect = useCallback(() => {
        console.log('🔌 WebSocket: Отключение соединения');

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

    // Устанавливаем соединение при монтировании
    useEffect(() => {
        if (userId) {
            console.log('🔌 WebSocket: useEffect: Подключаемся к WebSocket');
            connect();
        }

        return () => {
            console.log('🔌 WebSocket: useEffect cleanup: Отключаем WebSocket');
            disconnect();
        };
    }, [userId, connect, disconnect]);

    // Переподключаемся при изменении chatId (только для пользователей)
    useEffect(() => {
        if (!isAdmin && chatId && wsState.isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
            // Отписываемся от старого канала и подписываемся на новый
            wsRef.current.send(JSON.stringify({
                type: 'unsubscribe',
                channels: [`chat:${chatId}`]
            }));

            wsRef.current.send(JSON.stringify({
                type: 'subscribe',
                channels: [`chat:${chatId}`, `user:${userId}`]
            }));
        }
    }, [chatId, wsState.isConnected, isAdmin, userId]);

    return {
        ...wsState,
        sendMessage,
        disconnect,
        connect,
        // Дополнительные методы для управления подписками
        subscribe: useCallback((channels: string[]) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'subscribe',
                    channels
                }));
            }
        }, []),
        unsubscribe: useCallback((channels: string[]) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'unsubscribe',
                    channels
                }));
            }
        }, [])
    };
};
