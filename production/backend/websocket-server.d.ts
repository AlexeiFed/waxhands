/**
 * @file: backend/src/websocket-server.ts
 * @description: Централизованный WebSocket сервер для отслеживания всех состояний системы
 * @dependencies: ws, database/connection, types
 * @created: 2024-12-19
 */
import { Server } from 'http';
interface SystemEvent {
    type: 'chat_message' | 'chat_status_change' | 'chat_list_update' | 'new_chat' | 'unread_count_update' | 'invoice_update' | 'master_class_update' | 'user_registration' | 'system_notification' | 'workshop_request_update' | 'workshop_request_created' | 'workshop_request_deleted' | 'workshop_request_status_change' | 'about_content_update' | 'about_media_update' | 'about_media_added' | 'about_media_deleted';
    data: Record<string, unknown>;
    timestamp: number;
    targetUsers?: string[];
    targetRoles?: string[];
}
export declare class WebSocketManager {
    private wss;
    private clients;
    private eventQueue;
    private isProcessingEvents;
    constructor(server: Server);
    private setupWebSocketServer;
    private handleClientMessage;
    private removeClient;
    broadcastEvent(event: SystemEvent): void;
    sendToUsers(userIds: string[], event: SystemEvent): void;
    sendToRoles(roles: string[], event: SystemEvent): void;
    sendToSubscribers(channels: string[], event: SystemEvent): void;
    private sendEventToClient;
    private processEventQueue;
    private getChannelsForEvent;
    private startHeartbeat;
    private startEventProcessor;
    private setupChatEventHandlers;
    private setupInvoiceEventHandlers;
    private setupMasterClassEventHandlers;
    notifyChatMessage(chatId: string, message: Record<string, unknown>, senderId: string, senderType: 'user' | 'admin'): void;
    notifyNewChat(chatId: string, userId: string, adminId: string, firstMessage: string): void;
    notifyUnreadCountUpdate(chatId: string): void;
    notifyChatStatusChange(chatId: string, status: string, adminId?: string): void;
    notifyInvoiceUpdate(invoiceId: string, userId: string, status: string): void;
    notifyMasterClassUpdate(masterClassId: string, action: string): void;
    notifyWorkshopRequestUpdate(requestId: string, action: string, data?: Record<string, unknown>): void;
    notifyWorkshopRequestStatusChange(requestId: string, newStatus: string, adminNotes?: string): void;
    notifyWorkshopRequestCreated(requestId: string, requestData: Record<string, unknown>): void;
    notifyUserRegistration(userId: string, userRole: string): void;
    notifySystemNotification(message: string, level?: 'info' | 'warning' | 'error'): void;
    notifyAboutContentUpdate(contentId: number, action: string): void;
    notifyAboutMediaUpdate(mediaId: number, action: string, mediaData?: Record<string, unknown>): void;
    notifyAboutMediaAdded(mediaData: Record<string, unknown>): void;
    notifyAboutMediaDeleted(mediaId: number): void;
    getStats(): {
        totalClients: number;
        adminClients: number;
        userClients: number;
        activeConnections: number;
        eventQueueLength: number;
    };
    cleanup(): void;
}
export declare let wsManager: WebSocketManager;
export declare const initializeWebSocketManager: (server: Server) => WebSocketManager;
export {};
//# sourceMappingURL=websocket-server.d.ts.map