/**
 * @file: backend/src/websocket-server.ts
 * @description: Централизованный WebSocket сервер для отслеживания всех состояний системы
 * @dependencies: ws, database/connection, types
 * @created: 2024-12-19
 */
import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';
export class WebSocketManager {
    wss;
    clients = new Map();
    eventQueue = [];
    isProcessingEvents = false;
    constructor(server) {
        this.wss = new ws.WebSocketServer({ server, path: '/api/chat/ws' });
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.startEventProcessor();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, request) => {
            const clientId = uuidv4();
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            const userId = url.searchParams.get('userId');
            const isAdmin = url.searchParams.get('isAdmin') === 'true';
            const client = {
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
                }
                else {
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
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(clientId, message);
                }
                catch (error) {
                    console.error('❌ Ошибка парсинга сообщения от клиента:', error);
                }
            });
            // Обработка закрытия соединения
            ws.on('close', (code, reason) => {
                this.removeClient(clientId);
            });
            // Обработка ошибок
            ws.on('error', (error) => {
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
    handleClientMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        switch (message.type) {
            case 'ping':
                client.isAlive = true;
                client.lastPing = Date.now();
                client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'subscribe':
                if (message.channels && Array.isArray(message.channels)) {
                    message.channels.forEach((channel) => {
                        client.subscriptions.add(channel);
                    });
                    console.log(`📡 Клиент ${clientId} подписался на каналы:`, message.channels);
                }
                break;
            case 'unsubscribe':
                if (message.channels && Array.isArray(message.channels)) {
                    message.channels.forEach((channel) => {
                        client.subscriptions.delete(channel);
                    });
                    console.log(`📡 Клиент ${clientId} отписался от каналов:`, message.channels);
                }
                break;
            default:
                console.log(`📨 Неизвестный тип сообщения от клиента ${clientId}:`, message.type);
        }
    }
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.ws.close();
            this.clients.delete(clientId);
            console.log(`🔌 WebSocket клиент отключен: ${clientId}`);
        }
    }
    // Отправка события всем подписчикам
    broadcastEvent(event) {
        this.eventQueue.push(event);
        if (!this.isProcessingEvents) {
            this.processEventQueue();
        }
    }
    // Отправка события конкретным пользователям
    sendToUsers(userIds, event) {
        this.clients.forEach((client) => {
            if (client.userId && userIds.includes(client.userId)) {
                this.sendEventToClient(client, event);
            }
        });
    }
    // Отправка события по ролям
    sendToRoles(roles, event) {
        this.clients.forEach((client) => {
            if (client.userRole && roles.includes(client.userRole)) {
                this.sendEventToClient(client, event);
            }
        });
    }
    // Отправка события по подпискам
    sendToSubscribers(channels, event) {
        this.clients.forEach((client) => {
            const hasSubscription = channels.some(channel => client.subscriptions.has(channel));
            if (hasSubscription) {
                this.sendEventToClient(client, event);
            }
        });
    }
    sendEventToClient(client, event) {
        if (client.ws.readyState === 1) { // WebSocket.OPEN = 1
            try {
                client.ws.send(JSON.stringify(event));
            }
            catch (error) {
                console.error(`❌ Ошибка отправки события клиенту ${client.id}:`, error);
                this.removeClient(client.id);
            }
        }
    }
    async processEventQueue() {
        if (this.isProcessingEvents || this.eventQueue.length === 0)
            return;
        this.isProcessingEvents = true;
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            if (!event)
                continue;
            // Определяем целевых получателей
            if (event.targetUsers && event.targetUsers.length > 0) {
                this.sendToUsers(event.targetUsers, event);
            }
            else if (event.targetRoles && event.targetRoles.length > 0) {
                this.sendToRoles(event.targetRoles, event);
            }
            else {
                // Отправляем всем подписчикам соответствующих каналов
                const channels = this.getChannelsForEvent(event);
                this.sendToSubscribers(channels, event);
            }
        }
        this.isProcessingEvents = false;
    }
    getChannelsForEvent(event) {
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
    startHeartbeat() {
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
    startEventProcessor() {
        // Обработка событий чата
        this.setupChatEventHandlers();
        // Обработка событий счетов
        this.setupInvoiceEventHandlers();
        // Обработка событий мастер-классов
        this.setupMasterClassEventHandlers();
    }
    setupChatEventHandlers() {
        // Здесь будут обработчики событий чата
        console.log('📡 Настроены обработчики событий чата');
    }
    setupInvoiceEventHandlers() {
        // Здесь будут обработчики событий счетов
        console.log('📡 Настроены обработчики событий счетов');
    }
    setupMasterClassEventHandlers() {
        // Здесь будут обработчики событий мастер-классов
        console.log('📡 Настроены обработчики событий мастер-классов');
    }
    // Публичные методы для отправки событий
    notifyChatMessage(chatId, message, senderId, senderType) {
        console.log(`📡 Отправка сообщения чата ${chatId} от ${senderType} ${senderId}`);
        // Отправляем сообщение всем участникам чата
        this.clients.forEach((client) => {
            let shouldReceive = false;
            if (client.userRole === 'admin') {
                // Админ получает ВСЕ сообщения во ВСЕХ чатах
                shouldReceive = true;
                console.log(`📨 Админ ${client.id} получит сообщение`);
            }
            else if (client.userRole === 'user') {
                // Пользователь получает сообщения только в своём чате
                // Проверяем, подписан ли пользователь на этот чат
                if (client.subscriptions.has(`chat:${chatId}`)) {
                    shouldReceive = true;
                    console.log(`📨 Пользователь ${client.id} подписан на чат ${chatId}`);
                }
                else {
                    // Если пользователь не подписан на конкретный чат, но это его чат
                    // то он должен получить сообщение
                    if (client.subscriptions.has(`user:${client.userId}`)) {
                        shouldReceive = true;
                        console.log(`📨 Пользователь ${client.id} получит сообщение как участник чата ${chatId}`);
                    }
                    else {
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
    notifyNewChat(chatId, userId, adminId, firstMessage) {
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
    notifyUnreadCountUpdate(chatId) {
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
    notifyChatStatusChange(chatId, status, adminId) {
        this.broadcastEvent({
            type: 'chat_status_change',
            data: { chatId, status, adminId },
            timestamp: Date.now()
        });
    }
    notifyInvoiceUpdate(invoiceId, userId, status) {
        this.broadcastEvent({
            type: 'invoice_update',
            data: { invoiceId, userId, status },
            timestamp: Date.now(),
            targetUsers: [userId]
        });
    }
    notifyMasterClassUpdate(masterClassId, action) {
        this.broadcastEvent({
            type: 'master_class_update',
            data: { masterClassId, action },
            timestamp: Date.now()
        });
    }
    notifyWorkshopRequestUpdate(requestId, action, data) {
        this.broadcastEvent({
            type: 'workshop_request_update',
            data: { requestId, action, ...data },
            timestamp: Date.now()
        });
    }
    notifyWorkshopRequestStatusChange(requestId, newStatus, adminNotes) {
        this.broadcastEvent({
            type: 'workshop_request_status_change',
            data: { requestId, newStatus, adminNotes },
            timestamp: Date.now()
        });
    }
    notifyWorkshopRequestCreated(requestId, requestData) {
        this.broadcastEvent({
            type: 'workshop_request_created',
            data: { requestId, ...requestData },
            timestamp: Date.now()
        });
    }
    notifyUserRegistration(userId, userRole) {
        this.broadcastEvent({
            type: 'user_registration',
            data: { userId, userRole },
            timestamp: Date.now()
        });
    }
    notifySystemNotification(message, level = 'info') {
        this.broadcastEvent({
            type: 'system_notification',
            data: { message, level },
            timestamp: Date.now()
        });
    }
    // Уведомления об изменениях в about
    notifyAboutContentUpdate(contentId, action) {
        this.broadcastEvent({
            type: 'about_content_update',
            data: { contentId, action },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }
    notifyAboutMediaUpdate(mediaId, action, mediaData) {
        this.broadcastEvent({
            type: 'about_media_update',
            data: { mediaId, action, mediaData },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }
    notifyAboutMediaAdded(mediaData) {
        this.broadcastEvent({
            type: 'about_media_added',
            data: mediaData,
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }
    notifyAboutMediaDeleted(mediaId) {
        this.broadcastEvent({
            type: 'about_media_deleted',
            data: { mediaId },
            timestamp: Date.now(),
            targetRoles: ['user'] // Уведомляем всех родителей
        });
    }
    // Статистика подключений
    getStats() {
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
    cleanup() {
        this.clients.forEach((client) => {
            client.ws.close();
        });
        this.clients.clear();
        this.eventQueue = [];
        this.wss.close();
    }
}
// Экспортируем экземпляр для использования в других модулях
export let wsManager;
export const initializeWebSocketManager = (server) => {
    wsManager = new WebSocketManager(server);
    console.log('🚀 WebSocket сервер инициализирован');
    return wsManager;
};
//# sourceMappingURL=websocket-server.js.map