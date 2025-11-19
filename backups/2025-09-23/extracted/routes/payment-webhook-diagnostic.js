/**
 * @file: payment-webhook-diagnostic.ts
 * @description: Диагностический webhook для анализа уведомлений платежных систем
 * @dependencies: Router, types
 * @created: 2025-01-26
 */
import { Router } from 'express';
const router = Router();
// Диагностический webhook для ЮMoney
router.post('/yumoney-diagnostic', async (req, res) => {
    try {
        console.log('🔍 ДИАГНОСТИЧЕСКИЙ WEBHOOK ЮMoney');
        console.log('='.repeat(50));
        // Логируем все заголовки
        console.log('📋 ЗАГОЛОВКИ ЗАПРОСА:');
        Object.entries(req.headers).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        // Логируем сырое тело запроса
        console.log('\n📄 СЫРОЕ ТЕЛО ЗАПРОСА:');
        console.log(JSON.stringify(req.body, null, 2));
        // Анализируем content-type
        const contentType = req.headers['content-type'];
        console.log(`\n🔍 CONTENT-TYPE: ${contentType}`);
        if (contentType?.includes('application/x-www-form-urlencoded')) {
            console.log('✅ Правильный content-type для ЮMoney');
            // Анализируем параметры
            const webhookData = req.body;
            console.log('\n📊 АНАЛИЗ ПАРАМЕТРОВ:');
            console.log(`  notification_type: ${webhookData.notification_type || 'НЕ УКАЗАН'}`);
            console.log(`  operation_id: ${webhookData.operation_id || 'НЕ УКАЗАН'}`);
            console.log(`  amount: ${webhookData.amount || 'НЕ УКАЗАН'}`);
            console.log(`  currency: ${webhookData.currency || 'НЕ УКАЗАН'}`);
            console.log(`  datetime: ${webhookData.datetime || 'НЕ УКАЗАН'}`);
            console.log(`  sender: ${webhookData.sender || 'НЕ УКАЗАН'}`);
            console.log(`  codepro: ${webhookData.codepro || 'НЕ УКАЗАН'}`);
            console.log(`  label: ${webhookData.label || 'НЕ УКАЗАН'}`);
            console.log(`  sha1_hash: ${webhookData.sha1_hash || 'НЕ УКАЗАН'}`);
            console.log(`  test_notification: ${webhookData.test_notification || 'НЕ УКАЗАН'}`);
            // Анализируем дополнительные поля (только для HTTPS)
            if (webhookData.lastname || webhookData.firstname) {
                console.log(`  👤 Отправитель: ${webhookData.lastname} ${webhookData.firstname} ${webhookData.fathersname || ''}`);
            }
            if (webhookData.email) {
                console.log(`  📧 Email: ${webhookData.email}`);
            }
            if (webhookData.phone) {
                console.log(`  📱 Телефон: ${webhookData.phone}`);
            }
            // Определяем тип уведомления
            if (webhookData.notification_type === 'p2p-incoming') {
                console.log('\n💰 ТИП: P2P перевод между пользователями');
            }
            else if (webhookData.notification_type === 'card-incoming') {
                console.log('\n💳 ТИП: Платеж с банковской карты');
            }
            else {
                console.log(`\n❓ ТИП: Неизвестный - ${webhookData.notification_type}`);
            }
            // Проверяем обязательные поля
            const requiredFields = ['notification_type', 'operation_id', 'amount', 'currency', 'datetime', 'sender', 'codepro', 'sha1_hash'];
            const missingFields = requiredFields.filter(field => !webhookData[field]);
            if (missingFields.length > 0) {
                console.log(`\n⚠️ ОТСУТСТВУЮТ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ: ${missingFields.join(', ')}`);
            }
            else {
                console.log('\n✅ Все обязательные поля присутствуют');
            }
            // Анализируем label
            if (webhookData.label) {
                console.log(`\n🏷️ АНАЛИЗ LABEL: ${webhookData.label}`);
                if (webhookData.label.startsWith('INV-')) {
                    console.log('  ✅ Label имеет правильный формат для наших счетов');
                }
                else {
                    console.log('  ⚠️ Label имеет неожиданный формат');
                }
            }
            else {
                console.log('\n⚠️ LABEL отсутствует - это может быть проблемой');
            }
        }
        else {
            console.log('❌ Неправильный content-type для ЮMoney');
            console.log('Ожидается: application/x-www-form-urlencoded');
        }
        console.log('\n' + '='.repeat(50));
        // Отвечаем 200 OK
        res.json({
            success: true,
            message: 'Diagnostic webhook received',
            timestamp: new Date().toISOString(),
            content_type: contentType,
            body_keys: Object.keys(req.body)
        });
    }
    catch (error) {
        console.error('❌ Ошибка диагностического webhook\'а:', error);
        res.status(500).json({
            success: false,
            error: 'Diagnostic webhook error'
        });
    }
});
// Тестовый endpoint для проверки доступности
router.get('/yumoney-test', async (req, res) => {
    res.json({
        success: true,
        message: 'YuMoney diagnostic webhook is available',
        timestamp: new Date().toISOString(),
        endpoints: {
            diagnostic: '/api/payment-webhook-diagnostic/yumoney-diagnostic',
            test: '/api/payment-webhook-diagnostic/yumoney-test'
        }
    });
});
export default router;
//# sourceMappingURL=payment-webhook-diagnostic.js.map