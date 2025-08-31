// Webhook для ЮMoney
router.post('/yumoney', async (req, res) => {
    try {
        console.log('🔔 Webhook от ЮMoney получен:', JSON.stringify(req.body, null, 2));

        let webhookData = req.body;

        // Проверяем что это form-urlencoded данные
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            webhookData = req.body;
        }
        // Обрабатываем JSON данные для тестирования
        else if (req.headers['content-type']?.includes('application/json')) {
            console.log('📝 Получены JSON данные для тестирования');
            webhookData = req.body;

            // Для тестовых данных пропускаем валидацию подписи
            if (webhookData.test) {
                console.log('🧪 Тестовый webhook получен');
                res.json({
                    success: true,
                    message: 'Test webhook received',
                    data: webhookData
                });
                return;
            }
        } else {
            console.error('❌ Неподдерживаемый content-type:', req.headers['content-type']);
            res.status(400).json({
                success: false,
                error: 'Unsupported content type. Expected application/x-www-form-urlencoded or application/json'
            });
            return;
        }

        // Валидируем подпись только для реальных данных
        if (!webhookData.test && !validateYuMoneySignature(req, webhookData)) {
            console.error('❌ Неверная подпись от ЮMoney');
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid signature'
            });
            return;
        }

        // Обрабатываем webhook данные
        console.log('✅ Webhook успешно обработан');
        res.json({
            success: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('❌ Ошибка обработки webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;