/**
 * @file: test-webhook.js
 * @description: Тестирование webhook'а ЮMoney с разными типами данных
 * @created: 2025-01-26
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3001';
const WEBHOOK_URL = `${BASE_URL}/api/payment-webhook-diagnostic/yumoney-diagnostic`;

// Секретное слово для тестирования (должно совпадать с YUMONEY_NOTIFICATION_SECRET)
const NOTIFICATION_SECRET = process.env.YUMONEY_NOTIFICATION_SECRET || 'test_secret_123';

// Тестовые данные для P2P перевода
const testP2PData = {
    notification_type: 'p2p-incoming',
    operation_id: 'test_op_123456',
    amount: '100.00',
    currency: '643',
    datetime: '2025-01-26T12:00:00.000+03:00',
    sender: '41001123456789',
    codepro: false,
    label: 'INV-test-123-1756197830',
    sha1_hash: '', // Будет вычислен
    test_notification: true
};

// Тестовые данные для платежа картой
const testCardData = {
    notification_type: 'card-incoming',
    operation_id: 'test_card_op_789',
    amount: '250.00',
    currency: '643',
    datetime: '2025-01-26T12:30:00.000+03:00',
    sender: '', // Для карт отправитель пустой
    codepro: false,
    label: 'INV-test-card-456-1756197830',
    sha1_hash: '', // Будет вычислен
    withdraw_amount: '250.00',
    test_notification: true
};

// Тестовые данные для защищенного платежа (codepro=true)
const testProtectedData = {
    notification_type: 'p2p-incoming',
    operation_id: 'test_protected_op_999',
    amount: '500.00',
    currency: '643',
    datetime: '2025-01-26T13:00:00.000+03:00',
    sender: '41001987654321',
    codepro: true, // КРИТИЧЕСКИ ВАЖНО!
    label: 'INV-test-protected-789-1756197830',
    sha1_hash: '', // Будет вычислен
    test_notification: true
};

// Функция для вычисления SHA1 hash
function calculateSHA1Hash(data) {
    const paramsString = [
        data.notification_type,
        data.operation_id,
        data.amount,
        data.currency,
        data.datetime,
        data.sender,
        data.codepro,
        NOTIFICATION_SECRET,
        data.label || ''
    ].join('&');

    return crypto.createHash('sha1').update(paramsString, 'utf8').digest('hex');
}

// Функция для отправки тестового webhook'а
async function testWebhook(data, description) {
    try {
        console.log(`\n🧪 Тестируем: ${description}`);
        console.log('📊 Данные:', JSON.stringify(data, null, 2));

        // Вычисляем SHA1 hash
        data.sha1_hash = calculateSHA1Hash(data);
        console.log('🔐 Вычисленный SHA1:', data.sha1_hash);

        // Отправляем POST запрос
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'TestWebhook/1.0'
            },
            body: new URLSearchParams(data)
        });

        console.log('📡 Статус ответа:', response.status);
        console.log('📨 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const responseText = await response.text();
            console.log('✅ Ответ получен:', responseText);
        } else {
            console.log('❌ Ошибка ответа');
        }

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Основная функция тестирования
async function runTests() {
    console.log('🚀 Начинаем тестирование webhook\'а ЮMoney...');
    console.log('🌐 URL:', WEBHOOK_URL);
    console.log('🔑 Секрет:', NOTIFICATION_SECRET);

    // Тест 1: P2P перевод
    await testWebhook(testP2PData, 'P2P перевод (codepro=false)');

    // Тест 2: Платеж картой
    await testWebhook(testCardData, 'Платеж картой (codepro=false)');

    // Тест 3: Защищенный платеж
    await testWebhook(testProtectedData, 'Защищенный платеж (codepro=true)');

    console.log('\n✅ Тестирование завершено');
}

// Запускаем тесты
runTests().catch(console.error);
