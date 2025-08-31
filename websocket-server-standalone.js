/**
 * @file: websocket-server-standalone.js
 * @description: Простой WebSocket сервер на порту 3002 (CommonJS версия)
 * @dependencies: ws, uuid
 * @created: 2025-08-26
 */

const { WebSocketServer, WebSocket } = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketManager {
    constructor() {
        this.wss = new WebSocketServer({ port: 3002 });
        this.clients = new Map();
        this.eventQueue = [];
        this.isProcessingEvents = false;
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.startEventProcessor();
        console.log('🔌 WebSocket сервер запущен на порту 3002');
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            const clientId = uuidv4();
            console.log('🔌 Новое WebSocket подключение:', clientId);
            
            // Сохраняем клиента
            this.clients.set(clientId, {
                ws,
                id: clientId,
                subscriptions: new Set(),
                lastPing: Date.now(),
                isAlive: true
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    console.log('📨 Получено сообщение:', data.type);
                    
                    // Обработка различных типов сообщений
                    if (data.type === 'master_class_update') {
                        console.log('🎯 Отправка уведомления о мастер-классе:', data.masterClassId);
                    }
                    
                    // Broadcast сообщения всем подключенным клиентам
                    this.wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(data));
                        }
                    });
                } catch (error) {
                    console.error('❌ Ошибка обработки WebSocket сообщения:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket подключение закрыто:', clientId);
                this.removeClient(clientId);
            });
            
            ws.on('error', (error) => {
                console.error('❌ WebSocket ошибка:', error);
                this.removeClient(clientId);
            });
            
            // Отправляем приветственное сообщение
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId: clientId,
                message: 'WebSocket подключение установлено'
            }));
        });
    }

    handleClientMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        console.log(`📨 Сообщение от клиента ${clientId}:`, message);

        switch (message.type) {
            case 'ping':
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
                console.log(`❓ Неизвестный тип сообщения: ${message.type}`);
        }
    }

    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            console.log(`🔌 WebSocket клиент отключен: ${clientId}`);
            client.ws.close();
            this.clients.delete(clientId);
        }
    }

    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((client, clientId) => {
                if (client.isAlive === false) {
                    console.log(`💀 Удаляем неактивного клиента: ${clientId}`);
                    this.removeClient(clientId);
                    return;
                }
                
                client.isAlive = false;
                client.ws.ping();
            });
        }, 30000); // 30 секунд
    }

    startEventProcessor() {
        setInterval(() => {
            if (this.eventQueue.length > 0 && !this.isProcessingEvents) {
                this.processEventQueue();
            }
        }, 1000); // 1 секунда
    }

    processEventQueue() {
        this.isProcessingEvents = true;
        
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.broadcastEvent(event);
        }
        
        this.isProcessingEvents = false;
    }

    broadcastEvent(event) {
        console.log(`📡 Отправка события: ${event.type}`);
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify(event));
                } catch (error) {
                    console.error('❌ Ошибка отправки события клиенту:', error);
                }
            }
        });
    }

    // Методы для отправки уведомлений
    notifyMasterClassUpdate(masterClassId, data) {
        const event = {
            type: 'master_class_update',
            masterClassId,
            data,
            timestamp: Date.now()
        };
        
        this.eventQueue.push(event);
        console.log(`🎯 Добавлено уведомление о мастер-классе: ${masterClassId}`);
    }

    notifyWorkshopRequestUpdate(requestId, data) {
        const event = {
            type: 'workshop_request_update',
            requestId,
            data,
            timestamp: Date.now()
        };
        
        this.eventQueue.push(event);
        console.log(`📋 Добавлено уведомление о заявке: ${requestId}`);
    }

    notifyChatMessage(chatId, message) {
        const event = {
            type: 'chat_message',
            chatId,
            message,
            timestamp: Date.now()
        };
        
        this.eventQueue.push(event);
        console.log(`💬 Добавлено уведомление о сообщении в чате: ${chatId}`);
    }

    // Статистика сервера
    getStats() {
        return {
            totalClients: this.clients.size,
            activeConnections: this.wss.clients.size,
            eventQueueLength: this.eventQueue.length,
            uptime: process.uptime()
        };
    }
}

// Запуск сервера
try {
    const wsManager = new WebSocketManager();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('🛑 Получен сигнал SIGINT, закрываем WebSocket сервер...');
        wsManager.wss.close(() => {
            console.log('✅ WebSocket сервер закрыт');
            process.exit(0);
        });
    });
    
    process.on('SIGTERM', () => {
        console.log('🛑 Получен сигнал SIGTERM, закрываем WebSocket сервер...');
        wsManager.wss.close(() => {
            console.log('✅ WebSocket сервер закрыт');
            process.exit(0);
        });
    });
    
    // Логирование статистики каждые 5 минут
    setInterval(() => {
        const stats = wsManager.getStats();
        console.log('📊 Статистика WebSocket сервера:', stats);
    }, 300000);
    
    console.log('🚀 WebSocket сервер успешно запущен и готов к работе');
    
} catch (error) {
    console.error('❌ Ошибка запуска WebSocket сервера:', error);
    process.exit(1);
}
