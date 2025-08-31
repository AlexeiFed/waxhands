/**
 * @file: test-webhook.js
 * @description: Скрипт для тестирования webhook'а ЮMoney
 * @dependencies: crypto
 * @created: 2025-01-26
 */

import crypto from 'crypto';

// Конфигурация
const WEBHOOK_URL = 'https://waxhands.ru/api/payment-webhook/yumoney';
const DIAGNOSTIC_URL = 'https://waxhands.ru/api/payment-webhook-diagnostic/yumoney-diagnostic';
const NOTIFICATION_SECRET = 'YOUR_NOTIFICATION_SECRET'; // Замените на ваш секрет

// Тестовые данные webhook'а от ЮMoney
function createTestWebhookData() {
    return {
        notification_type: 'p2p-incoming',
        operation_id: 'test-operation-' + Date.now(),
        amount: '100.00',
        currency: '643',
        datetime: new Date().toISOString(),
        sender: '41001123456789',
        codepro: 'false',
        label: 'INV-test-123',
        sha1_hash: '', // Будет вычислен ниже
        test_notification: 'false'
    };
}

// Вычисляет SHA1 hash для webhook'а
function calculateSha1Hash(webhookData, secret) {
    const paramsString = [
        webhookData.notification_type,
        webhookData.operation_id,
        webhookData.amount,
        webhookData.currency,
        webhookData.datetime,
        webhookData.sender,
        webhookData.codepro,
        secret,
        webhookData.label || ''
    ].join('&');
    
    console.log('📝 Строка для SHA1:', paramsString);
    
    return crypto.createHash('sha1').update(paramsString, 'utf8').digest('hex');
}

// Отправляет POST запрос
async function sendWebhook(url, data) {
    try {
        console.log(`📤 Отправляем webhook на: ${url}`);
        console.log('📋 Данные:', data);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'YuMoney-Webhook-Test/1.0'
            },
            body: new URLSearchParams(data)
        });
        
        const responseText = await response.text();
        const responseData = JSON.parse(responseText);
        
        console.log(`📥 Ответ: ${response.status} ${response.statusText}`);
        console.log('📄 Данные ответа:', responseData);
        
        return { success: response.ok, data: responseData };
    } catch (error) {
        console.error('❌ Ошибка отправки webhook:', error);
        return { success: false, error: error.message };
    }
}

// Основная функция тестирования
async function testWebhook() {
    console.log('🧪 ТЕСТИРОВАНИЕ WEBHOOK\'А ЮMONEY');
    console.log('=' * 50);
    
    // Создаем тестовые данные
    const webhookData = createTestWebhookData();
    
    // Вычисляем SHA1 hash
    webhookData.sha1_hash = calculateSha1Hash(webhookData, NOTIFICATION_SECRET);
    console.log(`🔐 SHA1 hash: ${webhookData.sha1_hash}`);
    
    // Тест 1: Диагностический webhook
    console.log('\n🔍 ТЕСТ 1: Диагностический webhook');
    await sendWebhook(DIAGNOSTIC_URL, webhookData);
    
    // Тест 2: Основной webhook
    console.log('\n💳 ТЕСТ 2: Основной webhook');
    const result = await sendWebhook(WEBHOOK_URL, webhookData);
    
    // Анализ результатов
    console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ');
    console.log('=' * 50);
    
    if (result.success) {
        console.log('✅ Webhook обработан успешно');
        console.log(`📄 Ответ: ${JSON.stringify(result.data, null, 2)}`);
    } else {
        console.log('❌ Webhook не обработан');
        if (result.error) {
            console.log(`🚨 Ошибка: ${result.error}`);
        }
    }
    
    console.log('\n🎯 РЕКОМЕНДАЦИИ:');
    console.log('1. Проверьте логи сервера для детального анализа');
    console.log('2. Убедитесь, что NOTIFICATION_SECRET настроен правильно');
    console.log('3. Проверьте доступность webhook URL');
    console.log('4. Убедитесь, что label соответствует существующему счету в БД');
}

// Запуск теста
testWebhook().catch(console.error);
