/**
 * @file: backend/test-websocket.js
 * @description: Простой тестовый WebSocket клиент для проверки соединения
 * @created: 2024-12-19
 */

import WebSocket from 'ws';

// Тестируем подключение к WebSocket серверу
function testWebSocketConnection() {
    console.log('🔌 Тестируем WebSocket соединение...');

    const ws = new WebSocket('ws://localhost:3001/api/chat/ws?userId=test-user&isAdmin=false');

    ws.on('open', () => {
        console.log('✅ WebSocket соединение установлено');

        // Отправляем ping
        ws.send(JSON.stringify({ type: 'ping' }));

        // Подписываемся на канал
        ws.send(JSON.stringify({
            type: 'subscribe',
            channels: ['chat:test-chat', 'user:test-user']
        }));

        // Отправляем тестовое сообщение
        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 'test_message',
                data: 'Тестовое сообщение'
            }));
        }, 1000);
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📨 Получено сообщение:', message);

            if (message.type === 'pong') {
                console.log('✅ Ping/Pong работает');
            }
        } catch (error) {
            console.error('❌ Ошибка парсинга сообщения:', error);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`🔌 Соединение закрыто: ${code} - ${reason}`);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket ошибка:', error);
    });

    // Закрываем соединение через 5 секунд
    setTimeout(() => {
        console.log('🔄 Закрываем тестовое соединение...');
        ws.close();
    }, 5000);
}

// Запускаем тест
testWebSocketConnection();
