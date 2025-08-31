/**
 * @file: src/hooks/use-chat.ts
 * @description: Хук для управления чатом между пользователями и администраторами
 * @dependencies: chat-api.ts, types/chat.ts
 * @created: 2024-12-19
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../lib/chat-api';
import { Chat, ChatMessage, CreateChatRequest, SendMessageRequest, MessageReadStatus } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';
import { useNotificationSound } from './use-notification-sound';
import { WS_BASE_URL } from '../lib/config';
import { useWebSocketChat } from './use-websocket-chat';

export const useChat = (userId?: string) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { playMessageSound } = useNotificationSound();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Получение чатов пользователя
    const {
        data: chatsData,
        isLoading: isLoadingChats,
        error: chatsError,
        refetch: refetchChats
    } = useQuery({
        queryKey: ['chats', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');
            console.log('🔍 Запрашиваю чаты для пользователя:', userId);
            const result = await chatApi.getUserChats(userId);
            console.log('📡 Получен ответ от API:', result);
            // Проверяем, что данные не undefined
            if (!result || !result.chats) {
                console.error('❌ Неверный формат ответа:', result);
                throw new Error('Invalid response format');
            }
            console.log('✅ Данные валидны, возвращаю:', result);
            return result;
        },
        enabled: !!userId,
        refetchInterval: false, // Отключаем автоматическое обновление
        retry: 1, // Пробуем только 1 раз при ошибке
        retryDelay: 5000, // Задержка перед повтором
        retryOnMount: false, // Не повторяем при монтировании
        staleTime: 5 * 60 * 1000, // Данные считаются свежими 5 минут
    });

    // Автоматически выбираем первый чат при загрузке
    useEffect(() => {
        if (chatsData?.chats && chatsData.chats.length > 0 && !selectedChat) {
            const firstChat = chatsData.chats[0];
            console.log('🎯 Автоматически выбираю первый чат:', firstChat);
            setSelectedChat(firstChat);
        }
    }, [chatsData, selectedChat]);

    // Получение сообщений выбранного чата
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        error: messagesError,
        refetch: refetchMessages
    } = useQuery({
        queryKey: ['chat-messages', selectedChat?.id],
        queryFn: async () => {
            if (!selectedChat?.id) throw new Error('Chat ID required');
            console.log('🔍 Запрашиваю сообщения для чата:', selectedChat.id);
            const result = await chatApi.getChatMessages(selectedChat.id);
            console.log('📡 Получены сообщения:', result);
            return result;
        },
        enabled: !!selectedChat?.id,
        refetchInterval: false, // Отключаем автоматическое обновление
        retry: 1,
        retryDelay: 5000,
        retryOnMount: false,
        staleTime: 2 * 60 * 1000, // Данные считаются свежими 2 минуты
        gcTime: 5 * 60 * 1000, // Кэш хранится 5 минут
    });



    // Получение количества непрочитанных сообщений
    const {
        data: unreadData,
        refetch: refetchUnread
    } = useQuery({
        queryKey: ['chatUnread', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID required');
            const result = await chatApi.getUnreadCount(userId);
            // Проверяем, что данные не undefined
            if (!result || typeof result.unreadTotal !== 'number') {
                throw new Error('Invalid response format');
            }
            return result;
        },
        enabled: !!userId,
        refetchInterval: false, // Отключаем автоматическое обновление
        retry: 1, // Пробуем только 1 раз при ошибке
        retryDelay: 10000, // Задержка перед повтором
    });

    // Автоматически сбрасываем непрочитанные сообщения при открытии чата
    useEffect(() => {
        if (selectedChat?.id && messagesData?.messages && messagesData.messages.length > 0) {
            console.log('🔍 Автоматически сбрасываем непрочитанные для чата пользователя:', selectedChat.id);
            // Отмечаем сообщения как прочитанные
            chatApi.markAsRead({
                chatId: selectedChat.id,
                userId: userId || ''
            }).then(() => {
                console.log('✅ Сообщения отмечены как прочитанные для чата:', selectedChat.id);
                // Обновляем количество непрочитанных
                refetchUnread();
            }).catch((error) => {
                console.warn('⚠️ Не удалось отметить сообщения как прочитанные:', error);
            });
        }
    }, [selectedChat?.id, messagesData?.messages, userId, refetchUnread]);

    // Создание нового чата
    const createChatMutation = useMutation({
        mutationFn: chatApi.createChat,
        onSuccess: (data) => {
            console.log('✅ Чат создан успешно:', data);
            toast({
                title: "Чат создан! 💬",
                description: "Ваше сообщение отправлено в поддержку",
            });
            console.log('🔄 Обновляю список чатов...');
            refetchChats();
            // Автоматически открываем созданный чат
            if (data && data.chatId) {
                console.log('🎯 Создаю временный объект чата...');
                // Создаем временный объект чата для отображения
                const tempChat: Chat = {
                    id: data.chatId,
                    userId: userId || '',
                    adminId: undefined,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastMessageAt: new Date().toISOString(),
                    user: {
                        id: userId || '',
                        name: `${user?.name ?? ''} ${user?.surname ?? ''}`.trim(),
                        email: '',
                        role: 'parent'
                    },
                    admin: {
                        id: '',
                        name: 'Администратор',
                        email: '',
                        role: 'admin'
                    },
                    unreadCount: 0
                };
                console.log('💾 Устанавливаю выбранный чат:', tempChat);
                setSelectedChat(tempChat);
            }
        },
        onError: (error) => {
            toast({
                title: "Ошибка",
                description: "Не удалось создать чат. Попробуйте позже.",
                variant: "destructive",
            });
        }
    });

    // Отправка сообщения
    const sendMessageMutation = useMutation({
        mutationFn: chatApi.sendMessage,
        onSuccess: () => {
            setMessage('');
            refetchMessages();
            refetchChats();
            refetchUnread();
            scrollToBottom();
        },
        onError: (error) => {
            console.error('❌ Ошибка отправки сообщения:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось отправить сообщение. Попробуйте позже.",
                variant: "destructive",
            });
        }
    });

    // Создание нового чата
    const createChat = useCallback(async (message: string) => {
        if (!userId || !message.trim()) return;

        await createChatMutation.mutateAsync({
            userId,
            message: message.trim()
        });
    }, [userId, createChatMutation]);

    // Отправка сообщения
    const sendMessage = useCallback(async (message: string) => {
        if (!selectedChat?.id || !message.trim()) {
            console.error('❌ Не могу отправить сообщение:', { selectedChatId: selectedChat?.id, message: message.trim() });
            return;
        }

        try {
            console.log('📤 Отправляю сообщение:', { chatId: selectedChat.id, message: message.trim() });
            await sendMessageMutation.mutateAsync({
                chatId: selectedChat.id,
                message: message.trim()
            });
        } catch (error) {
            console.error('❌ Ошибка при отправке сообщения:', error);
            // Ошибка уже обработана в sendMessageMutation.onError
        }
    }, [selectedChat?.id, sendMessageMutation]);

    // Прокрутка к последнему сообщению
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Автоматическая прокрутка при новых сообщениях
    useEffect(() => {
        scrollToBottom();

        // Воспроизводим звук при новых сообщениях от других пользователей
        if (messagesData?.messages && messagesData.messages.length > 0) {
            const lastMessage = messagesData.messages[messagesData.messages.length - 1];
            // Звук играет когда получаем сообщение от другого пользователя (не от себя)
            if (lastMessage.senderType !== 'user' && selectedChat) {
                playMessageSound();
            }
        }
    }, [messagesData?.messages, scrollToBottom, playMessageSound, selectedChat]);

    // WebSocket для real-time обновлений сообщений
    const { isConnected: wsConnected } = useWebSocketChat(selectedChat?.id, userId, false);

    // Автоматическое обновление сообщений при получении WebSocket уведомлений
    useEffect(() => {
        if (!selectedChat?.id) return;

        console.log('🔌 WebSocket: инициализация real-time обновлений сообщений...');

        if (wsConnected) {
            console.log('✅ WebSocket подключен для чата:', selectedChat.id);
            // При получении нового сообщения обновляем данные
            const handleNewMessage = () => {
                console.log('📨 Получено новое сообщение, обновляем данные...');
                refetchMessages();
                refetchChats();
                refetchUnread();
            };

            // Добавляем обработчик для WebSocket сообщений
            window.addEventListener('chat-message-received', handleNewMessage);

            return () => {
                window.removeEventListener('chat-message-received', handleNewMessage);
            };
        } else {
            console.log('⏸️ WebSocket не подключен для чата:', selectedChat.id);
        }
    }, [selectedChat?.id, wsConnected, refetchMessages, refetchChats, refetchUnread]);

    // WebSocket для real-time обновлений списка чатов (заменяет polling)
    useEffect(() => {
        console.log('🔌 WebSocket: инициализация real-time обновлений списка чатов...');

        // TODO: Здесь будет WebSocket соединение для real-time обновлений
        // Пока отключаем polling для экономии ресурсов

        console.log('⏸️ Polling списка чатов отключен - переход на WebSocket режим');
    }, [refetchChats, unreadData?.unreadTotal]);

    // WebSocket для real-time обновлений непрочитанных сообщений (заменяет polling)
    useEffect(() => {
        if (!userId) return;

        console.log('🔌 WebSocket: инициализация real-time обновлений непрочитанных...');

        // TODO: Здесь будет WebSocket соединение для real-time обновлений
        // Пока отключаем polling для экономии ресурсов

        console.log('⏸️ Polling непрочитанных отключен - переход на WebSocket режим');
    }, [userId, refetchUnread]);

    // Мемоизируем selectedChat для предотвращения лишних перерендеров
    const memoizedSelectedChat = useMemo(() => selectedChat, [selectedChat]);

    // Отслеживаем изменения selectedChat
    useEffect(() => {
        if (memoizedSelectedChat !== selectedChat) {
            console.log('🎯 selectedChat изменился:', selectedChat);
            setSelectedChat(memoizedSelectedChat);
        }
    }, [memoizedSelectedChat, selectedChat]);

    // Отслеживаем изменения chatsData
    useEffect(() => {
        console.log('📊 chatsData изменился:', chatsData);
    }, [chatsData]);

    // Обработка ошибок чатов
    useEffect(() => {
        console.log('🔍 useEffect - обработка ошибок чатов:', {
            chatsError,
            chatsData: chatsData ? `${chatsData.chats?.length || 0} чатов` : 'нет данных',
            isLoadingChats,
            userId
        });

        if (chatsError && !chatsData && !isLoadingChats) {
            // Показываем ошибку только если нет данных и не загружаемся
            // И только один раз, не показываем постоянно
            const errorKey = `chat-error-${userId}`;
            if (!localStorage.getItem(errorKey)) {
                console.log('🚨 Показываю ошибку загрузки чатов');
                toast({
                    title: "Ошибка загрузки чатов",
                    description: "Не удалось загрузить список чатов. Попробуйте позже.",
                    variant: "destructive",
                });
                // Запоминаем, что ошибка уже показана
                localStorage.setItem(errorKey, 'true');
                // Через 30 секунд разрешаем показать ошибку снова
                setTimeout(() => localStorage.removeItem(errorKey), 30000);
            }
        }
    }, [chatsError, chatsData, isLoadingChats, userId, toast]);

    useEffect(() => {
        if (messagesError && !isLoadingMessages) {
            // Показываем ошибку только если не загружаемся
            // И только один раз для каждого чата
            const errorKey = `messages-error-${selectedChat?.id}`;
            if (!localStorage.getItem(errorKey)) {
                toast({
                    title: "Ошибка загрузки сообщений",
                    description: "Не удалось загрузить сообщения чата. Попробуйте позже.",
                    variant: "destructive",
                });
                // Запоминаем, что ошибка уже показана
                localStorage.setItem(errorKey, 'true');
                // Через 30 секунд разрешаем показать ошибку снова
                setTimeout(() => localStorage.removeItem(errorKey), 30000);
            }
        }
    }, [messagesError, isLoadingMessages, selectedChat?.id, toast]);

    return {
        // Данные
        chats: chatsData?.chats || [],
        messages: messagesData?.messages || [],
        selectedChat,
        unreadCount: unreadData?.unreadTotal || 0,

        // Состояние
        isLoadingChats,
        isLoadingMessages,
        message,

        // Действия
        setSelectedChat,
        setMessage,
        createChat,
        sendMessage,
        refetchChats,
        refetchMessages,
        refetchUnread,

        // Утилиты
        messagesEndRef,
        scrollToBottom,

        // Мутации
        isCreatingChat: createChatMutation.isPending,
        isSendingMessage: sendMessageMutation.isPending,
    };
};

// Хук для администраторов
export const useAdminChat = (externalSelectedChat?: Chat | null) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { playMessageSound } = useNotificationSound();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Используем внешний selectedChat если он передан, иначе внутренний
    const currentSelectedChat = externalSelectedChat || selectedChat;

    // Получение всех чатов
    const {
        data: chatsData,
        isLoading: isLoadingChats,
        error: chatsError,
        refetch: refetchChats
    } = useQuery({
        queryKey: ['adminChats', statusFilter],
        queryFn: async () => {
            console.log('🔍 useAdminChat: queryFn вызван с statusFilter:', statusFilter);
            const result = await chatApi.getAllChats(statusFilter);
            console.log('🔍 useAdminChat: API результат:', result);

            // Проверяем, что данные не undefined и имеют правильную структуру
            if (!result) {
                console.error('❌ useAdminChat: Пустой ответ от API');
                throw new Error('Empty response from API');
            }

            // Проверяем, что данные имеют правильную структуру
            if (!result.chats) {
                console.error('❌ useAdminChat: Неверный формат ответа:', result);
                throw new Error('Invalid response format');
            }

            console.log('✅ useAdminChat: Данные чатов получены:', {
                total: result.total,
                chatsCount: result.chats?.length,
                unreadTotal: result.unreadTotal
            });

            return result;
        },
        refetchInterval: false, // Отключаем автоматическое обновление
        retry: 1, // Пробуем только 1 раз при ошибке
        retryDelay: 5000, // Задержка перед повтором
        staleTime: 2 * 60 * 1000, // Данные считаются свежими 2 минуты
    });

    // Автоматическая загрузка чатов при монтировании
    useEffect(() => {
        console.log('🚀 useAdminChat hook mounted, fetching chats...');
        refetchChats();
    }, [refetchChats]);

    // Логируем изменения состояния чатов
    useEffect(() => {
        console.log('📊 useAdminChat: Состояние чатов изменилось:', {
            chatsData,
            isLoadingChats,
            chatsError,
            statusFilter
        });
    }, [chatsData, isLoadingChats, chatsError, statusFilter]);

    // Получение сообщений выбранного чата
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        error: messagesError,
        refetch: refetchMessages
    } = useQuery({
        queryKey: ['adminChatMessages', currentSelectedChat?.id],
        queryFn: async () => {
            if (!currentSelectedChat?.id) throw new Error('Chat ID required');
            const result = await chatApi.getChatMessages(currentSelectedChat.id);

            // Проверяем, что данные не undefined и имеют правильную структуру
            if (!result || !result.messages) {
                console.error('❌ useAdminChat: Неверный формат ответа для сообщений:', result);
                throw new Error('Invalid response format for messages');
            }

            return result;
        },
        enabled: !!currentSelectedChat?.id,
        refetchInterval: false, // Отключаем автоматическое обновление
        retry: 1, // Пробуем только 1 раз при ошибке
        retryDelay: 3000, // Задержка перед повтором
    });

    // Отправка сообщения
    const sendMessageMutation = useMutation({
        mutationFn: chatApi.sendMessage,
        onSuccess: () => {
            refetchMessages();
            refetchChats();
        },
        onError: (error) => {
            toast({
                title: "Ошибка",
                description: "Не удалось отправить сообщение. Попробуйте позже.",
                variant: "destructive",
            });
        }
    });

    // Обновление статуса чата
    const updateStatusMutation = useMutation({
        mutationFn: chatApi.updateChatStatus,
        onSuccess: () => {
            toast({
                title: "Статус обновлен! ✅",
                description: "Статус чата успешно изменен",
            });
            refetchChats();
        },
        onError: (error) => {
            toast({
                title: "Ошибка",
                description: "Не удалось обновить статус чата",
                variant: "destructive",
            });
        }
    });

    // Удаление чата
    const deleteChatMutation = useMutation({
        mutationFn: (chatId: string) => chatApi.deleteChat(chatId),
        onSuccess: () => {
            refetchChats();
            if (currentSelectedChat?.id === currentSelectedChat?.id) {
                setSelectedChat(null);
            }
            toast({
                title: 'Успешно',
                description: 'Чат удален',
            });
        },
        onError: (error) => {
            console.error('Ошибка удаления чата:', error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось удалить чат',
                variant: 'destructive'
            });
        }
    });

    // Отправка сообщения
    const sendMessage = useCallback(async (message: string) => {
        if (!currentSelectedChat?.id || !message.trim()) return;

        try {
            console.log('Отправка сообщения админом:', {
                chatId: currentSelectedChat.id,
                message: message.trim()
            });

            await sendMessageMutation.mutateAsync({
                chatId: currentSelectedChat.id,
                message: message.trim()
            });
        } catch (error) {
            console.error('❌ Ошибка при отправке сообщения админом:', error);
            // Ошибка уже обработана в sendMessageMutation.onError
        }
    }, [currentSelectedChat?.id, sendMessageMutation]);

    // Обновление статуса чата
    const updateChatStatus = useCallback(async (chatId: string, status: 'active' | 'closed' | 'pending') => {
        if (!user?.id) return;

        await updateStatusMutation.mutateAsync({
            chatId,
            status,
            adminId: user.id
        });
    }, [updateStatusMutation, user?.id]);

    // Обработка ошибок
    useEffect(() => {
        if (chatsError && !isLoadingChats) {
            // Показываем ошибку только если не загружаемся
            const errorKey = `admin-chats-error-${statusFilter}`;
            if (!localStorage.getItem(errorKey)) {
                toast({
                    title: "Ошибка загрузки чатов",
                    description: "Не удалось загрузить список чатов. Попробуйте позже.",
                    variant: "destructive",
                });
                localStorage.setItem(errorKey, 'true');
                setTimeout(() => localStorage.removeItem(errorKey), 30000);
            }
        }
    }, [chatsError, isLoadingChats, statusFilter, toast]);

    useEffect(() => {
        if (messagesError && !isLoadingMessages) {
            // Показываем ошибку только если не загружаемся
            const errorKey = `admin-messages-error-${currentSelectedChat?.id}`;
            if (!localStorage.getItem(errorKey)) {
                toast({
                    title: "Ошибка загрузки сообщений",
                    description: "Не удалось загрузить сообщения чата. Попробуйте позже.",
                    variant: "destructive",
                });
                localStorage.setItem(errorKey, 'true');
                setTimeout(() => localStorage.removeItem(errorKey), 30000);
            }
        }
    }, [messagesError, isLoadingMessages, currentSelectedChat?.id, toast]);

    // WebSocket для real-time обновлений сообщений администратора
    useEffect(() => {
        if (!currentSelectedChat?.id || !user?.id) return;

        console.log('🔌 WebSocket: инициализация real-time обновлений для администратора...');

        // Создаем WebSocket соединение для real-time обновлений
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Исправляем URL для WebSocket - используем правильный порт для backend
        const wsUrl = `${WS_BASE_URL}?userId=${user.id}&isAdmin=true`;

        console.log('🔌 Подключаемся к WebSocket URL:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('🔌 WebSocket соединение установлено для администратора');
            // Подписываемся на обновления чата
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: [`chat:${currentSelectedChat.id}`]
            }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'chat_message' && message.data.chatId === currentSelectedChat.id) {
                    console.log('📨 Получено новое сообщение через WebSocket, обновляем данные...');
                    // Обновляем сообщения и список чатов
                    refetchMessages();
                    refetchChats();
                }
            } catch (error) {
                console.warn('⚠️ Ошибка обработки WebSocket сообщения:', error);
            }
        };

        ws.onerror = (error) => {
            console.warn('⚠️ WebSocket ошибка для администратора:', error);
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket соединение закрыто для администратора:', event.code, event.reason);
        };

        return () => {
            console.log('🔌 Закрываем WebSocket соединение для администратора');
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [currentSelectedChat?.id, user?.id, refetchMessages, refetchChats]);

    // WebSocket для real-time обновлений списка чатов администратора
    useEffect(() => {
        if (!user?.id) return;

        console.log('🔌 WebSocket: инициализация real-time обновлений списка чатов для администратора...');

        // Создаем WebSocket соединение для обновлений списка чатов
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Исправляем URL для WebSocket - используем правильный порт для backend
        const wsUrl = `${WS_BASE_URL}?userId=${user.id}&isAdmin=true`;

        console.log('🔌 Подключаемся к WebSocket URL для списка чатов:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('🔌 WebSocket соединение установлено для списка чатов администратора');
            // Подписываемся на обновления всех чатов
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['admin_chats']
            }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'chat_message' || message.type === 'chat_status_change') {
                    console.log('📨 Получено обновление чата через WebSocket, обновляем список...');
                    // Обновляем список чатов
                    refetchChats();
                }
            } catch (error) {
                console.warn('⚠️ Ошибка обработки WebSocket сообщения для списка чатов:', error);
            }
        };

        ws.onerror = (error) => {
            console.warn('⚠️ WebSocket ошибка для списка чатов администратора:', error);
        };

        ws.onclose = (event) => {
            console.log('🔌 WebSocket соединение закрыто для списка чатов администратора:', event.code, event.reason);
        };

        return () => {
            console.log('🔌 Закрываем WebSocket соединение для списка чатов администратора');
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [user?.id, refetchChats]);

    // Автоматическая прокрутка при новых сообщениях
    useEffect(() => {
        if (messagesData?.messages && messagesData.messages.length > 0) {
            const lastMessage = messagesData.messages[messagesData.messages.length - 1];
            // Звук играет когда получаем сообщение от пользователя (не от себя)
            if (lastMessage.senderType === 'user' && currentSelectedChat) {
                playMessageSound();
            }
        }
    }, [messagesData?.messages, playMessageSound, currentSelectedChat]);

    // Функция для определения статуса прочтения сообщения
    const getMessageReadStatus = (message: ChatMessage): MessageReadStatus => {
        if (message.senderType === 'user') {
            // Для сообщений пользователя показываем статус прочтения администратором
            return message.isRead ? 'read' : 'delivered';
        } else {
            // Для сообщений администратора показываем статус доставки
            return 'sent';
        }
    };

    // Автоматически сбрасываем непрочитанные сообщения при открытии чата
    useEffect(() => {
        if (currentSelectedChat?.id && messagesData?.messages && messagesData.messages.length > 0) {
            console.log('🔍 Автоматически сбрасываем непрочитанные для чата администратора:', currentSelectedChat.id);

            // Отмечаем все непрочитанные сообщения от пользователя как прочитанные
            const unreadMessages = messagesData.messages.filter(
                msg => msg.senderType === 'user' && !msg.isRead
            );

            if (unreadMessages.length > 0) {
                console.log(`📖 Отмечаем ${unreadMessages.length} сообщений как прочитанные`);

                // Отмечаем каждое сообщение как прочитанное
                Promise.all(
                    unreadMessages.map(msg =>
                        chatApi.markMessageAsRead({
                            messageId: msg.id,
                            chatId: currentSelectedChat.id,
                            readerId: user?.id || '',
                            readerRole: 'admin'
                        })
                    )
                ).then(() => {
                    console.log('✅ Все сообщения отмечены как прочитанные администратором');
                    // Обновляем сообщения чата
                    refetchMessages();
                }).catch((error) => {
                    console.warn('⚠️ Не удалось отметить сообщения как прочитанные администратором:', error);
                });
            }

            // Также отмечаем весь чат как прочитанный
            chatApi.markAsRead({
                chatId: currentSelectedChat.id,
                userId: currentSelectedChat.userId
            }).then(() => {
                console.log('✅ Чат отмечен как прочитанный администратором');
                // Обновляем список чатов
                refetchChats();
            }).catch((error) => {
                console.warn('⚠️ Не удалось отметить чат как прочитанный администратором:', error);
            });
        }
    }, [currentSelectedChat?.id, currentSelectedChat?.userId, messagesData?.messages, refetchChats, refetchMessages, user?.id]);

    return {
        // Данные
        chats: chatsData?.chats || [],
        messages: messagesData?.messages || [],
        selectedChat: currentSelectedChat,
        statusFilter,

        // Состояние
        isLoadingChats,
        isLoadingMessages,

        // Действия
        setSelectedChat,
        setStatusFilter,
        sendMessage,
        updateChatStatus,
        refetchChats,
        refetchMessages,

        // Утилиты
        getMessageReadStatus,

        // Мутации
        isSendingMessage: sendMessageMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
        deleteChat: deleteChatMutation.mutate,
        isDeletingChat: deleteChatMutation.isPending,

        // Временные логи для диагностики
        _debug: {
            chatsData,
            messagesData,
            chatsError,
            messagesError,
            statusFilter,
            currentSelectedChat
        }
    };
};

