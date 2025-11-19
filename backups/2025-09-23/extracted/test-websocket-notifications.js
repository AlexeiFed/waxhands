/**
 * @file: backend/test-websocket-notifications.js
 * @description: Тест всех типов WebSocket уведомлений
 * @created: 2024-12-19
 */

import WebSocket from 'ws';

// Тестируем все типы уведомлений
function testAllNotifications() {
    console.log('🔌 Тестируем все типы WebSocket уведомлений...');

    // Подключаемся как обычный пользователь
    const userWs = new WebSocket('ws://localhost:3001/api/chat/ws?userId=test-user-123&isAdmin=false');

    // Подключаемся как администратор
    const adminWs = new WebSocket('ws://localhost:3001/api/chat/ws?userId=admin-123&isAdmin=true');

    let userConnected = false;
    let adminConnected = false;

    // Обработчик для пользователя
    userWs.on('open', () => {
        console.log('✅ Пользователь подключен');
        userConnected = true;

        // Подписываемся на каналы пользователя
        userWs.send(JSON.stringify({
            type: 'subscribe',
            channels: ['user:test-user-123', 'chat:test-chat-123']
        }));
    });

    userWs.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('👤 Пользователь получил:', message.type, message.data);
        } catch (error) {
            console.error('❌ Ошибка парсинга сообщения пользователя:', error);
        }
    });

    // Обработчик для администратора
    adminWs.on('open', () => {
        console.log('✅ Администратор подключен');
        adminConnected = true;

        // Подписываемся на каналы администратора
        adminWs.send(JSON.stringify({
            type: 'subscribe',
            channels: ['admin:all', 'system:all', 'chat:test-chat-123']
        }));
    });

    adminWs.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('👨‍💼 Администратор получил:', message.type, message.data);
        } catch (error) {
            console.error('❌ Ошибка парсинга сообщения администратора:', error);
        }
    });

    // Ждем подключения обоих клиентов
    const checkConnections = setInterval(() => {
        if (userConnected && adminConnected) {
            console.log('🎯 Оба клиента подключены, начинаем тестирование...');
            clearInterval(checkConnections);

            // Тестируем уведомления через HTTP API
            testNotifications();
        }
    }, 100);

    // Обработка ошибок
    userWs.on('error', (error) => console.error('❌ Ошибка пользователя:', error));
    adminWs.on('error', (error) => console.error('❌ Ошибка администратора:', error));

    // Закрытие соединений
    setTimeout(() => {
        console.log('🔄 Закрываем тестовые соединения...');
        userWs.close();
        adminWs.close();
        process.exit(0);
    }, 10000);
}

// Тестируем уведомления через HTTP API
async function testNotifications() {
    try {
        console.log('📡 Тестируем уведомления через HTTP API...');

        // Тест уведомления о чате
        await fetch('http://localhost:3001/api/chat/test-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'chat_message',
                chatId: 'test-chat-123',
                message: 'Тестовое сообщение',
                senderId: 'test-user-123',
                senderType: 'user'
            })
        });

        console.log('✅ Тест уведомления о чате отправлен');

    } catch (error) {
        console.error('❌ Ошибка тестирования уведомлений:', error);
    }
}

// Запускаем тест
testAllNotifications();
