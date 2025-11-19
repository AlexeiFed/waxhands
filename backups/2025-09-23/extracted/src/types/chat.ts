/**
 * @file: backend/src/types/chat.ts
 * @description: Типы для системы чата между пользователями и администраторами
 * @dependencies: index.ts
 * @created: 2024-12-19
 */

export interface Chat {
    id: string;
    userId: string;
    adminId?: string;
    status: 'active' | 'closed' | 'pending';
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt: Date;
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    admin?: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | undefined;
    unreadCount?: number;
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
    createdAt: Date;
    sender?: {
        id: string;
        name: string;
        role: string;
    };
}

export interface ChatNotification {
    id: string;
    userId: string;
    chatId: string;
    unreadCount: number;
    lastReadAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateChatRequest {
    userId: string;
    message: string;
}

export interface SendMessageRequest {
    chatId: string;
    message: string;
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

