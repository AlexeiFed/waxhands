/**
 * @file: src/lib/chat-api.ts
 * @description: API функции для системы чата
 * @dependencies: api.ts, types/chat.ts
 * @created: 2024-12-19
 */

import { api } from './api';
import {
    Chat,
    ChatMessage,
    CreateChatRequest,
    SendMessageRequest,
    UpdateChatStatusRequest,
    MarkAsReadRequest,
    MarkMessageAsReadRequest,
    ChatListResponse,
    ChatMessagesResponse
} from '../types/chat';

export const chatApi = {
    // Создать новый чат
    createChat: async (data: CreateChatRequest): Promise<{ success: boolean; chatId: string; message: string }> => {
        const response = await api.post<{ success: boolean; chatId: string; message: string }>('/chat/create', data);
        return response.data!;
    },

    // Получить чаты пользователя
    getUserChats: async (userId: string): Promise<ChatListResponse> => {

        try {
            const response = await api.get<ChatListResponse>(`/chat/user/${userId}`);

            const result = response.data || response;

            // Проверяем, что результат имеет правильную структуру
            if (result && 'chats' in result && 'total' in result) {
                return result as ChatListResponse;
            }

            throw new Error('Invalid response format from backend');
        } catch (error) {
            console.error('❌ chat-api: getUserChats ошибка:', error);
            throw error;
        }
    },

    // Получить все чаты (для администратора)
    getAllChats: async (status?: string): Promise<ChatListResponse> => {

        try {
            const params = new URLSearchParams();
            if (status) {
                params.append('status', status);
            }

            const response = await api.get<ChatListResponse>(`/chat/admin/all?${params.toString()}`);

            // Backend возвращает данные напрямую, а не в response.data
            // Поэтому извлекаем данные из response.data или используем response напрямую
            const result = response.data || response;

            // Проверяем, что результат имеет правильную структуру
            if (result && 'chats' in result && 'total' in result) {
                return result as ChatListResponse;
            }

            throw new Error('Invalid response format from backend');
        } catch (error) {
            console.error('❌ chat-api: getAllChats ошибка:', error);
            throw error;
        }
    },

    // Получить сообщения чата
    getChatMessages: async (chatId: string): Promise<ChatMessagesResponse> => {

        try {
            const response = await api.get<ChatMessagesResponse>(`/chat/${chatId}/messages`);

            const result = response.data || response;

            // Проверяем, что результат имеет правильную структуру
            if (result && 'messages' in result && 'total' in result) {
                return result as ChatMessagesResponse;
            }

            throw new Error('Invalid response format from backend');
        } catch (error) {
            console.error('❌ chat-api: getChatMessages ошибка:', error);
            throw error;
        }
    },

    // Отправить сообщение
    sendMessage: async (data: SendMessageRequest): Promise<{ success: boolean; messageId: string; message: string }> => {

        const response = await api.post<{ success: boolean; messageId: string; message: string }>('/chat/send', {
            chatId: data.chatId,
            message: data.message,
            messageType: data.messageType || 'text',
            fileUrl: data.fileUrl
        });

        return response.data!;
    },

    // Отметить сообщения как прочитанные
    markAsRead: async (data: MarkAsReadRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>('/chat/mark-read', data);
        return response.data!;
    },

    // Отметить конкретное сообщение как прочитанное
    markMessageAsRead: async (data: MarkMessageAsReadRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>('/chat/message/read', data);
        return response.data!;
    },

    // Обновить статус чата (для администраторов)
    updateChatStatus: async (data: UpdateChatStatusRequest): Promise<{ success: boolean; message: string }> => {
        const response = await api.put<{ success: boolean; message: string }>('/chat/status', data);
        return response.data!;
    },

    // Получить количество непрочитанных сообщений
    getUnreadCount: async (userId: string): Promise<{ unreadTotal: number }> => {
        try {
            // Путь: /chat/user/{userId}/unread -> полный: /api/chat/user/{userId}/unread
            const response = await api.get<{ unreadTotal: number }>(`/chat/user/${userId}/unread`);
            console.log('✅ chat-api: getUnreadCount ответ:', response);

            // apiRequest возвращает данные напрямую, используем fallback для совместимости
            const result = response.data || response;

            // Проверяем, что данные в правильном формате
            if (result && typeof result === 'object' && 'unreadTotal' in result) {
                return result as { unreadTotal: number };
            }

            console.error('❌ chat-api: getUnreadCount - неверный формат ответа:', result);
            throw new Error('Invalid response format');
        } catch (error) {
            console.error('❌ chat-api: getUnreadCount ошибка для userId:', userId);
            console.error('❌ chat-api: getUnreadCount детали:', error);
            throw error;
        }
    },

    // Удалить чат
    deleteChat: async (chatId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/chat/delete/${chatId}`);
        return response.data!;
    }
};

