/**
 * @file: backend/src/websocket-server.ts
 * @description: Централизованный WebSocket сервер для отслеживания всех состояний системы
 * @dependencies: ws, database/connection, types
 * @created: 2024-12-19
 */

import ws from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface ClientConnection {
    id: string;
    ws: ws.WebSocket;
    userId?: string;
    userRole?: 'admin' | 'user';
    subscriptions: Set<string>;
    isAlive: boolean;
    lastPing: number;
}

interface SystemEvent {
    type: 'chat_message' | 'chat_status_change' | 'chat_list_update' | 'new_chat' | 'unread_count_update' | 'invoice_update' | 'master_class_update' | 'user_registration' | 'system_notification' | 'workshop_request_update' | 'workshop_request_created' | 'workshop_request_deleted' | 'workshop_request_status_change' | 'about_content_update' | 'about_media_update' | 'about_media_added' | 'about_media_deleted';
    data: Record<string, unknown>;
    timestamp: number;
    targetUsers?: string[];
    targetRoles?: string[];
}

export class WebSocketManager {
    private wss: ws.WebSocketServer;
    private clients: Map<string, ClientConnection> = new Map();
    private eventQueue: SystemEvent[] = [];
    private isProcessingEvents = false;

    constructor(server: Server) {
        this.wss = new ws.WebSocketServer({ server, path: '/api/chat/ws' });
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.startEventProcessor();
    }

    private setupWebSocketServer() {
        this.wss.on('connection', (ws: ws.WebSocket, request: { url?: string; headers: { host?: string } }) => {
            const clientId = uuidv4();
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            const userId = url.searchParams.get('userId');
            const isAdmin = url.searchParams.get('isAdmin') === 'true';

            const client: ClientConnection = {
                id: clientId,
                ws,
                ...(userId && { userId }),
                userRole: isAdmin ? 'admin' : 'user',
                subscriptions: new Set(),
                isAlive: true,
                lastPing: Date.now()
            };

            this.clients.set(clientId, client);
            console.log(`🔌 WebSocket клиент подключен: ${clientId} (${isAdmin ? 'admin' : 'user'})`);

            // Автоматически подписываем на события пользователя
            if (userId) {
                client.subscriptions.add(`user:${userId}`);
                if (isAdmin) {
                    client.subscriptions.add('admin:all');
                    client.subscriptions.add('system:all');
                    // Админ автоматически подписывается на все чаты
                    client.subscriptions.add('chat:all');
                    // Админ подписывается на все новые чаты
                    client.subscriptions.add('new_chat');
                    // Админ подписывается на все заявки
                    client.subscriptions.add('admin:workshop_requests');
                    client.subscriptions.add('workshop_requests:all');
                } else {
                    // Родитель автоматически подписывается на все свои чаты
                    // Это будет обновлено при получении subscribe сообщения
                    // Но также подписываемся на общие уведомления
                    client.subscriptions.add('user:notifications');
                    // Родитель подписывается на обновления контента "О нас"
                    client.subscriptions.add('about:content');
                    client.subscriptions.add('about:media');
                }
            }

            // Обработка сообщений от клиента
            ws.on('message', (data: ws.RawData) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(clientId, message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения от клиента:', error);
                }
            });

            // Обработка закрытия соединения
            ws.on('close', (code: number, reason: Buffer) => {
                this.removeClient(clientId);
            });

            // Обработка ошибок
            ws.on('error', (error: Error) => {
                console.error(`❌ WebSocket ошибка для клиента ${clientId}:`, error);
                this.removeClient(clientId);
            });

            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({
                type: 'connection_established',
                data: { clientId, userId, userRole: client.userRole },
                timestamp: Date.now()
            }));
        });
    }

    private handleClientMessage(clientId: string, message: Record<string, unknown>) {
        const client = this.clients.get(clientId);
        if (!client) return;

        switch (message.type) {
            case 'ping':
                client.isAlive = true;
                client.lastPing = Date.now();
                client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;

            case 'subscribe':
                if (message.channels && Array.isArray(message.channels)) {
                    message.channels.forEach((channel: string) => {
                        client.subscriptions.add(channel);
                    });
                    console.log(`📡 Клиент ${clientId} подписался на каналы:`, message.channels);
                }
                break;

            case 'unsubscribe':
                if (message.channels && Array.isArray(message.channels)) {
                    message.channels.forEach((channel: string) => {
                        client.subscriptions.delete(channel);
                    });
                    console.log(`📡 Клиент ${clientId} отписался от каналов:`, message.channels);
                }
                break;

            default:
                console.log(`📨 Неизвестный тип сообщения от клиента ${clientId}:`, message.type);
        }
    }

    private removeClient(clientId: string) {
        const client = this.clients.get(clientId);
        if (client) {
            client.ws.close();
            this.clients.delete(clientId);
            console.log(`🔌 WebSocket клиент отключен: ${clientId}`);
        }
    }

    // Отправка события всем подписчикам
    public broadcastEvent(event: SystemEvent) {
        this.eventQueue.push(event);

        if (!this.isProcessingEvents) {
            this.processEventQueue();
        }
    }

    // Отправка события конкретным пользователям
    public sendToUsers(userIds: string[], event: SystemEvent) {
        this.clients.forEach((client) => {
            if (client.userId && userIds.includes(client.userId)) {
                this.sendEventToClient(client, event);
            }
        });
    }

    // Отправка события по ролям
    public sendToRoles(roles: string[], event: SystemEvent) {
        this.clients.forEach((client) => {
            if (client.userRole && roles.includes(client.userRole)) {
                this.sendEventToClient(client, event);
            }
        });
    }

    // Отправка события по подпискам
    public sendToSubscribers(channels: string[], event: SystemEvent) {
        this.clients.forEach((client) => {
            const hasSubscription = channels.some(channel => client.subscriptions.has(channel));
            if (hasSubscription) {
                this.sendEventToClient(client, event);
            }
        });
    }

    private sendEventToClient(client: ClientConnection, event: SystemEvent) {
        if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
            try {
                client.ws.send(JSON.stringify(event));
            } catch (error) {
                console.error(`❌ Ошибка отправки события клиенту ${client.id}:`, error);
                this.removeClient(client.id);
            }
        }
    }

    private async processEventQueue() {
        if (this.isProcessingEvents || this.eventQueue.length === 0) return;

        this.isProcessingEvents = true;

        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (!event) continue;

            // Определяем целевых получателей
            if (event.targetUsers && event.targetUsers.length > 0) {
                this.sendToUsers(event.targetUsers, event);
            } else if (event.targetRoles && event.targetRoles.length > 0) {
                this.sendToRoles(event.targetRoles, event);
            } else {
                // Отправляем всем подписчикам соответствующих каналов
                const channels = this.getChannelsForEvent(event);
                this.sendToSubscribers(channels, event);
            }
        }

        this.isProcessingEvents = false;
    }

    private getChannelsForEvent(event: SystemEvent): string[] {
        switch (event.type) {
            case 'chat_message':
                return [`chat:${event.data.chatId}`];
            case 'chat_status_change':
                return [`chat:${event.data.chatId}`, 'admin:all'];
            case 'invoice_update':
                return [`user:${event.data.userId}`, 'admin:all'];
            case 'master_class_update':
                return ['admin:all', 'system:all'];
            case 'user_registration':
                return ['admin:all'];
            case 'system_notification':
                return ['system:all'];
            default:
                return ['system:all'];
        }
    }

    // Heartbeat для поддержания соединений
    private startHeartbeat() {
        setInterval(() => {
            const now = Date.now();
            this.clients.forEach((client) => {
                if (now - client.lastPing > 60000) { // 60 секунд без ping
                    client.isAlive = false;
                    this.removeClient(client.id);
                }
            });
        }, 30000); // Проверяем каждые 30 секунд
    }

    // Обработчик событий системы
    private startEventProcessor() {
        // Обработка событий чата
        this.setupChatEventHandlers();

        // Обработка событий счетов
        this.setupInvoiceEventHandlers();

        // Обработка событий мастер-классов
        this.setupMasterClassEventHandlers();
    }

    private setupChatEventHandlers() {
        // Здесь будут обработчики событий чата
        console.log('📡 Настроены обработчики событий чата');
    }

    private setupInvoiceEventHandlers() {
        // Здесь будут обработчики событий счетов
        console.log('📡 Настроены обработчики событий счетов');
    }

    private setupMasterClassEventHandlers() {
        // Здесь будут обработчики событий мастер-классов
        console.log('📡 Настроены обработчики событий мастер-классов');
    }

    // Публичные методы для отправки событий
    public notifyChatMessage(chatId: string, message: Record<string, unknown>, senderId: string, senderType: 'user' | 'admin') {
        console.log(`📡 Отправка сообщения чата ${chatId} от ${senderType} ${senderId}`);

        // Отправляем сообщение всем участникам чата
        this.clients.forEach((client) => {
            let shouldReceive = false;

            if (client.userRole === 'admin') {
                // Админ получает ВСЕ сообщения во ВСЕХ чатах
                shouldReceive = true;
                console.log(`📨 Админ ${client.id} получит сообщение`);
            } else if (client.userRole === 'user') {
                // Пользователь получает сообщения только в своём чате
                // Проверяем, подписан ли пользователь на этот чат
                if (client.subscriptions.has(`chat:${chatId}`)) {
                    shouldReceive = true;
                    console.log(`📨 Пользователь ${client.id} подписан на чат ${chatId}`);
                } else {
                    // Если пользователь не подписан на конкретный чат, но это его чат
                    // то он должен получить сообщение
                    if (client.subscriptions.has(`user:${client.userId}`)) {
                        shouldReceive = true;
                        console.log(`📨 Пользователь ${client.id} получит сообщение как участник чата ${chatId}`);
                    } else {
                        console.log(`❌ Пользователь ${client.id} НЕ подписан на чат ${chatId}`);
                    }
                }
            }

            if (shouldReceive) {
                this.sendEventToClient(client, {
                    type: 'chat_message',
                    data: { chatId, message, senderId, senderType },
                    timestamp: Date.now()
                });
            }
        });

        // Отправляем уведомление об обновлении списка чатов для админов
        this.clients.forEach((client) => {
            if (client.userRole === 'admin' && client.subscriptions.has('admin:all')) {
                this.sendEventToClient(client, {
                    type: 'chat_list_update',
                    data: { chatId, action: 'message_sent' },
                    timestamp: Date.now()
                });
            }
        });
    }

    public notifyNewChat(chatId: string, userId: string, adminId: string, firstMessage: string) {
        console.log(`📡 Уведомление о новом чате ${chatId} от пользователя ${userId} для админа ${adminId}`);

        // Отправляем уведомление о новом чате всем админам
        this.clients.forEach((client) => {
            if (client.userRole === 'admin' && client.subscriptions.has('admin:all')) {
                this.sendEventToClient(client, {
                    type: 'new_chat',
                    data: { chatId, userId, adminId, firstMessage },
                    timestamp: Date.now()
                });
                console.log(`📨 Админ ${client.id} получит уведомление о новом чате`);
            }
        });
    }

    public notifyUnreadCountUpdate(chatId: string) {
        console.log(`📡 Уведомление об обновлении непрочитанных для чата ${chatId}`);

        // Отправляем уведомление всем участникам чата
        this.clients.forEach((client) => {
            if (client.subscriptions.has(`chat:${chatId}`) || client.subscriptions.has('admin:all')) {
                this.sendEventToClient(client, {
                    type: 'unread_count_update',
                    data: { chatId },
                    timestamp: Date.now()
                });
                console.log(`📨 Клиент ${client.id} получит уведомление о непрочитанных`);
            }
        });
    }

    public notifyChatStatusChange(chatId: string, status: string, adminId?: string) {
        this.broadcastEvent({
            type: 'chat_status_change',
            data: { chatId, status, adminId },
            timestamp: Date.now()
        });
    }

    public notifyInvoiceUpdate(invoiceId: string, userId: string, status: string) {
        this.broadcastEvent({
            type: 'invoice_update',
            data: { invoiceId, userId, status },
            timestamp: Date.now(),
            targetUsers: [userId]
        });
    }

    public notifyMasterClassUpdate(masterClassId: string, action: string) {
        this.broadcastEvent({
            type: 'master_class_update',
            data: { masterClassId, action },
            timestamp: Date.now()
        });
    }

    public notifyWorkshopRequestUpdate(requestId: string, action: string, data?: Record<string, unknown>) {
        this.broadcastEvent({
            type: 'workshop_request_update',
            data: { requestId, action, ...data },
            timestamp: Date.now()
        });
    }

    public notifyWorkshopRequestStatusChange(requestId: string, newStatus: string, adminNotes?: string) {
        this.broadcastEvent({
            type: 'workshop_request_status_change',
            data: { requestId, newStatus, adminNotes },
            timestamp: Date.now()
        });
    }

    public notifyWorkshopRequestCreated(requestId: string, requestData: Record<string, unknown>) {
        this.broadcastEvent({
            type: 'workshop_request_created',
            data: { requestId, ...requestData },
            timestamp: Date.now()
        });
    }

    public notifyUserRegistration(userId: string, userRole: string) {
        this.broadcastEvent({
            type: 'user_registration',
            data: { userId, userRole },
            timestamp: Date.now()
        });
    }

    public notifySystemNotification(message: string, level: 'info' | 'warning' | 'error' = 'info') {
        this.broadcastEvent({
            type: 'system_notification',
            data: { message, level },
            timestamp: Date.now()
        });
    }

    // Уведомления об изменениях в about
    public notifyAboutContentUpdate(contentId: number, action: string) {
        this.broadcastEvent({
            type: 'about_content_update',
            data: { contentId, action },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }

    public notifyAboutMediaUpdate(mediaId: number, action: string, mediaData?: Record<string, unknown>) {
        this.broadcastEvent({
            type: 'about_media_update',
            data: { mediaId, action, mediaData },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }

    public notifyAboutMediaAdded(mediaData: Record<string, unknown>) {
        this.broadcastEvent({
            type: 'about_media_added',
            data: mediaData,
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }

    public notifyAboutMediaDeleted(mediaId: number) {
        this.broadcastEvent({
            type: 'about_media_deleted',
            data: { mediaId },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }

    // Статистика подключений
    public getStats() {
        const totalClients = this.clients.size;
        const adminClients = Array.from(this.clients.values()).filter(c => c.userRole === 'admin').length;
        const userClients = totalClients - adminClients;
        const activeConnections = Array.from(this.clients.values()).filter(c => c.isAlive).length;

        return {
            totalClients,
            adminClients,
            userClients,
            activeConnections,
            eventQueueLength: this.eventQueue.length
        };
    }

    // Очистка ресурсов
    public cleanup() {
        this.clients.forEach((client) => {
            client.ws.close();
        });
        this.clients.clear();
        this.eventQueue = [];
        this.wss.close();
    }
}

// Экспортируем экземпляр для использования в других модулях
export let wsManager: WebSocketManager;

export const initializeWebSocketManager = (server: Server) => {
    wsManager = new WebSocketManager(server);
    console.log('🚀 WebSocket сервер инициализирован');
    return wsManager;
};
