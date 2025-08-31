/**
 * @file: websocket-server-simple.js
 * @description: Простой WebSocket сервер на порту 3002
 * @dependencies: ws, uuid, http
 * @created: 2025-08-26
 */

const { WebSocketServer, WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

class WebSocketManager {
    constructor() {
        // Создаем HTTP сервер
        this.server = http.createServer();
        
        // Создаем WebSocket сервер на пути /ws
        this.wss = new WebSocketServer({ 
            server: this.server,
            path: '/ws'
        });
        
        this.clients = new Map();
        this.eventQueue = [];
        this.isProcessingEvents = false;
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.startEventProcessor();
        
        // Запускаем HTTP сервер на порту 3002
        this.server.listen(3002, () => {
            console.log('🔌 WebSocket сервер запущен на порту 3002, путь /ws');
        });
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws, req) => {
            const clientId = uuidv4();
            console.log('🔌 Новое WebSocket подключение:', clientId);

            // Создаем объект клиента
            const client = {
                id: clientId,
                ws: ws,
                isAlive: true,
                subscriptions: new Set(),
                userId: null,
                userRole: null,
                connectedAt: Date.now()
            };

            // Сохраняем клиента в Map
            this.clients.set(clientId, client);

            // Обработка ping/pong для keep-alive
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
                client.isAlive = true;
            });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📨 Получено сообщение от клиента', clientId, ':', data.type);

                    // Обработка различных типов сообщений
                    if (data.type === 'subscribe') {
                        if (data.channels && Array.isArray(data.channels)) {
                            data.channels.forEach((channel) => {
                                client.subscriptions.add(channel);
                            });
                            console.log(`📡 Клиент ${clientId} подписался на каналы:`, data.channels);
                        }
                        if (data.userId) client.userId = data.userId;
                        if (data.userRole) client.userRole = data.userRole;
                    } else if (data.type === 'unsubscribe') {
                        if (data.channels && Array.isArray(data.channels)) {
                            data.channels.forEach((channel) => {
                                client.subscriptions.delete(channel);
                            });
                            console.log(`📡 Клиент ${clientId} отписался от каналов:`, data.channels);
                        }
                    } else if (data.type === 'ping') {
                        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    } else {
                        // Broadcast сообщения всем подключенным клиентам
                        this.wss.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(data));
                            }
                        });
                    }
                } catch (error) {
                    console.error('❌ Ошибка обработки WebSocket сообщения:', error);
                }
            });

            ws.on('close', () => {
                console.log('🔌 WebSocket подключение закрыто:', clientId);
                this.removeClient(clientId);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket ошибка для клиента', clientId, ':', error);
                this.removeClient(clientId);
            });

            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({
                type: 'connected',
                clientId: clientId,
                timestamp: Date.now(),
                message: 'WebSocket соединение установлено'
            }));
        });
    }

    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            console.log(`🔌 WebSocket клиент отключен: ${clientId}`);
            try {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.close();
                }
            } catch (error) {
                console.error(`❌ Ошибка при закрытии соединения клиента ${clientId}:`, error);
            }
            this.clients.delete(clientId);
        }
    }

    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (!client.isAlive) {
                    console.log(`💀 Клиент ${clientId} не отвечает, отключаем`);
                    this.removeClient(clientId);
                    return;
                }

                client.isAlive = false;
                try {
                    if (client.ws.readyState === WebSocket.OPEN) {
                        client.ws.ping();
                    } else {
                        console.log(`💀 Клиент ${clientId} соединение закрыто, отключаем`);
                        this.removeClient(clientId);
                    }
                } catch (error) {
                    console.error(`❌ Ошибка ping для клиента ${clientId}:`, error);
                    this.removeClient(clientId);
                }
            });
        }, 30000); // Каждые 30 секунд
    }

    startEventProcessor() {
        setInterval(() => {
            if (this.isProcessingEvents || this.eventQueue.length === 0) return;

            this.isProcessingEvents = true;
            const events = [...this.eventQueue];
            this.eventQueue = [];

            events.forEach(event => {
                this.broadcastEvent(event);
            });

            this.isProcessingEvents = false;
        }, 100); // Каждые 100мс
    }

    broadcastEvent(event) {
        console.log(`📢 Broadcasting event: ${event.type}`);

        this.clients.forEach((client) => {
            // Проверяем, подписан ли клиент на это событие
            let shouldSend = false;

            // Проверяем подписки клиента
            for (const subscription of client.subscriptions) {
                if (subscription === 'admin:all' && client.userRole === 'admin') {
                    shouldSend = true;
                    break;
                }
                if (subscription === 'system:all') {
                    shouldSend = true;
                    break;
                }
                if (subscription === event.type) {
                    shouldSend = true;
                    break;
                }
                if (event.targetUsers && client.userId && event.targetUsers.includes(client.userId)) {
                    shouldSend = true;
                    break;
                }
                if (event.targetRoles && client.userRole && event.targetRoles.includes(client.userRole)) {
                    shouldSend = true;
                    break;
                }
            }

            if (shouldSend && client.ws.readyState === WebSocket.OPEN) {
                try {
                    client.ws.send(JSON.stringify(event));
                } catch (error) {
                    console.error(`❌ Ошибка отправки события клиенту ${client.id}:`, error);
                    this.removeClient(client.id);
                }
            }
        });
    }

    addEvent(event) {
        this.eventQueue.push(event);
    }
}

// Создаем и запускаем WebSocket сервер
const wsManager = new WebSocketManager();

// Обработка сигналов завершения
process.on('SIGINT', () => {
    console.log('🔌 Получен SIGINT, закрываем WebSocket сервер...');
    wsManager.wss.close(() => {
        console.log('🔌 WebSocket сервер закрыт');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('🔌 Получен SIGTERM, закрываем WebSocket сервер...');
    wsManager.wss.close(() => {
        console.log('🔌 WebSocket сервер закрыт');
        process.exit(0);
    });
});
