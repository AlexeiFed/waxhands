/**
 * @file: src/types/chat.ts
 * @description: Типы для системы чата между пользователями и администраторами
 * @dependencies: index.ts
 * @created: 2024-12-19
 */

export interface Chat {
    id: string;
    userId: string;
    adminId?: string;
    status: 'active' | 'closed' | 'pending';
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
    lastMessage?: string;
    user?: {
        id: string;
        name: string;
        surname?: string;
        email: string;
        role: string;
    };
    admin?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    unreadCount?: number;
}

// Интерфейс для данных, возвращаемых backend (с подчеркиваниями)
export interface ChatBackend {
    id: string;
    user_id: string;
    admin_id?: string;
    status: 'active' | 'closed' | 'pending';
    created_at: string;
    updated_at: string;
    last_message_at: string;
    user_name: string;
    user_email: string;
    user_role: string;
    admin_name?: string;
    admin_email?: string;
    admin_role?: string;
    unread_count: number;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderType: 'user' | 'admin';
    message: string;
    messageType: 'text' | 'image' | 'file';
    fileUrl?: string;
    isRead: boolean;
    readAt?: string; // Время прочтения сообщения
    readBy?: string[]; // ID пользователей, прочитавших сообщение
    createdAt: string;
    sender?: {
        id: string;
        name: string;
        surname?: string;
        role: string;
    };
}

// Статус прочтения сообщения
export type MessageReadStatus = 'sent' | 'delivered' | 'read';

// Интерфейс для отметки сообщений как прочитанных
export interface MarkMessageAsReadRequest {
    messageId: string;
    chatId: string;
    readerId: string;
    readerRole: 'user' | 'admin';
}

export interface ChatNotification {
    id: string;
    userId: string;
    chatId: string;
    unreadCount: number;
    lastReadAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateChatRequest {
    userId: string;
    message: string;
}

export interface SendMessageRequest {
    chatId: string;
    message: string;
    senderId?: string; // Опциональный, так как backend берет из аутентификации
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
}

export interface UpdateChatStatusRequest {
    chatId: string;
    status: 'active' | 'closed' | 'pending';
    adminId?: string;
}

export interface MarkAsReadRequest {
    chatId: string;
    userId: string;
}

export interface ChatListResponse {
    chats: Chat[];
    total: number;
    unreadTotal: number;
}

export interface ChatMessagesResponse {
    messages: ChatMessage[];
    total: number;
    hasMore: boolean;
}

