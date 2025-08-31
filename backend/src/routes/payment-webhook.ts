import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import crypto from 'crypto';
import pool from '../database/connection.js';
import { updateInvoicePaymentStatus, findInvoiceByLabel, findInvoiceBySender } from '../services/paymentService.js';
import { sendPaymentSuccessNotification, sendPaymentReceivedNotification } from '../services/notificationService.js';
import { handlePaymentError } from '../services/retryService.js';

const router = Router();

// Интерфейс для webhook'а от ЮMoney согласно документации
interface YuMoneyWebhook {
    notification_type: 'p2p-incoming' | 'card-incoming';
    operation_id: string;
    amount: string;
    withdraw_amount?: string;
    currency: string;
    datetime: string;
    sender: string;
    codepro: boolean;
    label: string;
    sha1_hash: string;
    test_notification?: boolean;
    unaccepted?: boolean;
    lastname?: string;
    firstname?: string;
    fathersname?: string;
    email?: string;
    phone?: string;
    city?: string;
    street?: string;
    building?: string;
    suite?: string;
    flat?: string;
    zip?: string;
}

// Функция для валидации подписи от ЮMoney
const validateYuMoneySignature = (req: Request, body: YuMoneyWebhook): boolean => {
    try {
        // Получаем секретное слово из переменных окружения
        const notificationSecret = process.env.YUMONEY_NOTIFICATION_SECRET;

        if (!notificationSecret) {
            console.log('⚠️ YUMONEY_NOTIFICATION_SECRET не настроен, пропускаем валидацию');
            return true; // Пропускаем валидацию если секрет не настроен
        }

        // Формируем строку для проверки согласно документации ЮMoney
        const paramsString = [
            body.notification_type,
            body.operation_id,
            body.amount,
            body.currency,
            body.datetime,
            body.sender,
            body.codepro,
            notificationSecret,
            body.label || ''
        ].join('&');

        // Вычисляем SHA1 hash
        const calculatedHash = crypto.createHash('sha1').update(paramsString, 'utf8').digest('hex');

        // Сравниваем с полученным hash
        const isValid = calculatedHash === body.sha1_hash;

        console.log(`🔐 Валидация подписи ЮMoney: ${isValid ? 'УСПЕШНО' : 'ОШИБКА'}`);
        console.log(`📝 Строка для проверки: ${paramsString}`);
        console.log(`🔍 Вычисленный hash: ${calculatedHash}`);
        console.log(`📨 Полученный hash: ${body.sha1_hash}`);

        return isValid;
    } catch (error) {
        console.error('❌ Ошибка валидации подписи:', error);
        return false;
    }
};



// Webhook для ЮMoney
router.post('/yumoney', async (req: Request, res: Response) => {
    try {
        console.log('🔔 Webhook от ЮMoney получен');
        console.log('🌐 IP:', req.ip || req.connection.remoteAddress);
        console.log('👤 User-Agent:', req.headers['user-agent']);
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
        console.log('🔗 URL:', req.url);
        console.log('🌐 Method:', req.method);
        console.log('📡 Content-Type:', req.headers['content-type']);

        // Проверяем что это form-urlencoded данные (стандарт ЮMoney)
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            const webhookData = req.body as YuMoneyWebhook;

            // Определяем источник данных - НОВАЯ ЛОГИКА
            // ЮMoney всегда отправляет notification_type и sha1_hash
            const isFromYuMoney = webhookData.notification_type && webhookData.sha1_hash;

            // Проверяем тестовый режим
            const isTestMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_TEST_WEBHOOK === 'true';
            const isTestRequest = req.headers['x-test-webhook'] === 'true' || webhookData.test_notification;

            console.log(`🔍 Анализ уведомления:`, {
                notification_type: webhookData.notification_type,
                has_sha1_hash: !!webhookData.sha1_hash,
                label: webhookData.label,
                operation_id: webhookData.operation_id,
                amount: webhookData.amount
            });

            // Если это уведомление от ЮMoney - обрабатываем как ЮMoney
            if (isFromYuMoney) {
                // Проверяем подпись ЮMoney (пропускаем в тестовом режиме)
                if (!isTestRequest && !validateYuMoneySignature(req, webhookData)) {
                    console.error('❌ Неверная подпись от ЮMoney');
                    res.status(401).json({
                        success: false,
                        error: 'Unauthorized - Invalid signature'
                    } as ApiResponse);
                    return;
                }

                if (isTestRequest) {
                    console.log('🧪 Тестовый режим: пропускаем валидацию подписи');
                } else {
                    console.log('✅ Подпись ЮMoney проверена успешно');
                }

                // Обрабатываем в зависимости от типа уведомления
                if (webhookData.notification_type === 'p2p-incoming' || webhookData.notification_type === 'card-incoming') {
                    console.log(`💰 Получен платеж ${webhookData.notification_type}: ${webhookData.amount} ${webhookData.currency}`);
                    console.log(`🔍 Операция: ${webhookData.operation_id}, Метка: ${webhookData.label}`);

                    // Ищем счет по метке
                    let invoiceId = null;
                    if (webhookData.label) {
                        invoiceId = await findInvoiceByLabel(webhookData.label);
                        console.log(`🔍 Поиск по метке '${webhookData.label}': ${invoiceId ? 'найден' : 'не найден'}`);
                    }

                    if (invoiceId) {
                        try {
                            // Обновляем статус счета
                            const paymentData = {
                                invoiceId,
                                paymentId: webhookData.operation_id,
                                amount: webhookData.amount,
                                currency: webhookData.currency,
                                paymentMethod: webhookData.notification_type === 'p2p-incoming' ? 'P2P transfer' : 'Card payment',
                                paymentDate: webhookData.datetime,
                                sender: webhookData.sender,
                                operationId: webhookData.operation_id,
                                label: webhookData.label
                            };

                            const result = await updateInvoicePaymentStatus(paymentData);

                            if (result.success) {
                                console.log(`✅ Платеж успешно обработан для счета ${invoiceId}`);

                                // Отправляем уведомления
                                try {
                                    const invoiceResult = await pool.query(
                                        'SELECT participant_id FROM invoices WHERE id = $1',
                                        [invoiceId]
                                    );

                                    if (invoiceResult.rows.length > 0) {
                                        const userId = invoiceResult.rows[0].participant_id;
                                        await sendPaymentSuccessNotification(
                                            userId,
                                            invoiceId,
                                            webhookData.amount,
                                            paymentData.paymentMethod
                                        );
                                    }
                                } catch (notifyError) {
                                    console.error('❌ Ошибка отправки уведомления:', notifyError);
                                }
                            } else {
                                console.error(`❌ Ошибка обновления счета ${invoiceId}:`, result.error);
                                await handlePaymentError(
                                    webhookData.operation_id,
                                    result.error || 'Failed to update invoice',
                                    undefined,
                                    invoiceId
                                );
                            }
                        } catch (dbError) {
                            console.error(`❌ Ошибка обработки платежа:`, dbError);
                            await handlePaymentError(
                                webhookData.operation_id,
                                dbError instanceof Error ? dbError.message : 'Database error',
                                undefined,
                                invoiceId
                            );
                        }
                    } else {
                        console.log(`⚠️ Счет не найден для платежа. Метка: ${webhookData.label}`);
                    }

                    // Отвечаем 200 OK - критически важно для ЮMoney
                    res.json({
                        success: true,
                        message: `${webhookData.notification_type} payment received`,
                        amount: webhookData.amount,
                        currency: webhookData.currency,
                        operation_id: webhookData.operation_id,
                        label: webhookData.label,
                        invoice_found: !!invoiceId
                    } as ApiResponse);
                    return;
                }

                // Тестовое уведомление
                if (webhookData.test_notification === true) {
                    console.log(`🧪 Тестовое уведомление от ЮMoney: ${webhookData.notification_type}`);
                    res.json({
                        success: true,
                        message: 'Test notification received',
                        notification_type: webhookData.notification_type,
                        amount: webhookData.amount,
                        operation_id: webhookData.operation_id
                    } as ApiResponse);
                    return;
                }

                // Неизвестный тип уведомления от ЮMoney
                console.log(`⚠️ Неизвестный тип уведомления от ЮMoney: ${webhookData.notification_type}`);
                res.json({
                    success: true,
                    message: 'Unknown YuMoney notification type',
                    notification_type: webhookData.notification_type
                } as ApiResponse);
                return;
            }

            // Если это НЕ уведомление от ЮMoney, но есть label - возможно от Яндекс.Форм
            if (webhookData.label && webhookData.label.startsWith('INV-')) {
                console.log('📨 Обрабатываем данные от Яндекс.Форм');
                console.log(`📨 Метка: ${webhookData.label}`);
                console.log(`💰 Сумма: ${webhookData.amount}`);

                // Ищем счет по метке
                let invoiceId = null;
                invoiceId = await findInvoiceByLabel(webhookData.label);
                console.log(`🔍 Поиск по метке '${webhookData.label}': ${invoiceId ? 'найден' : 'не найден'}`);

                if (invoiceId) {
                    try {
                        // Обновляем статус счета
                        const paymentData = {
                            invoiceId,
                            paymentId: `yandex-forms-${Date.now()}`,
                            amount: webhookData.amount,
                            currency: '643', // RUB
                            paymentMethod: 'Yandex Forms',
                            paymentDate: new Date().toISOString(),
                            operationId: `yandex-forms-${Date.now()}`
                        };

                        const result = await updateInvoicePaymentStatus(paymentData);

                        if (result.success) {
                            console.log(`✅ Счет ${invoiceId} успешно обновлен на статус 'paid'`);

                            res.json({
                                success: true,
                                message: 'Payment processed successfully from Yandex Forms',
                                invoice_id: invoiceId,
                                amount: webhookData.amount
                            } as ApiResponse);
                            return;
                        } else {
                            console.error(`❌ Не удалось обновить счет ${invoiceId}:`, result.error);
                            res.status(500).json({
                                success: false,
                                error: 'Failed to update invoice'
                            } as ApiResponse);
                            return;
                        }
                    } catch (dbError) {
                        console.error(`❌ Ошибка обработки платежа от Яндекс.Форм:`, dbError);
                        res.status(500).json({
                            success: false,
                            error: 'Internal server error'
                        } as ApiResponse);
                        return;
                    }
                } else {
                    console.log(`ℹ️ Счет не найден для метки: ${webhookData.label}`);
                    res.status(404).json({
                        success: false,
                        error: 'Invoice not found',
                        label: webhookData.label
                    } as ApiResponse);
                    return;
                }
            }

            // Неизвестный формат form-urlencoded данных
            console.log(`⚠️ Неизвестный формат form-urlencoded данных`);
            res.json({
                success: true,
                message: 'Unknown form-urlencoded format'
            } as ApiResponse);
            return;
        }

        // Если это JSON данные (платежи через форму)
        if (req.headers['content-type']?.includes('application/json')) {
            const jsonData = req.body;

            if ('event' in jsonData && jsonData.event === 'payment.succeeded') {
                const payment = jsonData.object;
                if (!payment) {
                    console.error('❌ Объект платежа не найден');
                    res.status(400).json({
                        success: false,
                        error: 'Missing payment object'
                    } as ApiResponse);
                    return;
                }

                const metadata = payment.metadata || {};
                const invoiceId = metadata.invoice_id;

                if (!invoiceId) {
                    console.error('❌ invoice_id не найден в metadata платежа');
                    res.status(400).json({
                        success: false,
                        error: 'Missing invoice_id in payment metadata'
                    } as ApiResponse);
                    return;
                }

                console.log(`💰 Обрабатываем успешную оплату для счета ${invoiceId}`);
                console.log(`🔍 Данные платежа:`, {
                    payment_id: payment.id,
                    amount: payment.amount.value,
                    currency: payment.amount.currency,
                    method: payment.payment_method.type,
                    created_at: payment.created_at,
                    captured_at: payment.captured_at
                });

                try {
                    // Обновляем статус счета
                    const paymentData = {
                        invoiceId,
                        paymentId: payment.id,
                        amount: payment.amount.value,
                        currency: payment.amount.currency,
                        paymentMethod: payment.payment_method.type,
                        paymentDate: payment.captured_at || payment.created_at,
                        operationId: payment.id
                    };

                    const result = await updateInvoicePaymentStatus(paymentData);

                    if (result.success) {
                        console.log(`✅ Счет ${invoiceId} успешно обновлен на статус 'paid'`);

                        // Отправляем уведомления
                        try {
                            const invoiceResult = await pool.query(
                                'SELECT user_id FROM invoices WHERE id = $1',
                                [invoiceId]
                            );

                            if (invoiceResult.rows.length > 0) {
                                const userId = invoiceResult.rows[0].user_id;
                                await sendPaymentSuccessNotification(
                                    userId,
                                    invoiceId,
                                    payment.amount.value,
                                    payment.payment_method.type
                                );
                            }
                        } catch (notifyError) {
                            console.error('❌ Ошибка отправки уведомления:', notifyError);
                        }

                        res.json({
                            success: true,
                            message: 'Payment processed successfully',
                            invoice_id: invoiceId,
                            payment_id: payment.id
                        } as ApiResponse);
                    } else {
                        console.error(`❌ Не удалось обновить счет ${invoiceId}:`, result.error);
                        await handlePaymentError(
                            payment.id,
                            result.error || 'Failed to update invoice',
                            undefined,
                            invoiceId
                        );

                        res.status(500).json({
                            success: false,
                            error: 'Failed to update invoice'
                        } as ApiResponse);
                    }
                } catch (dbError) {
                    console.error(`❌ Ошибка обработки платежа:`, dbError);
                    await handlePaymentError(
                        payment.id,
                        dbError instanceof Error ? dbError.message : 'Database error',
                        undefined,
                        invoiceId
                    );

                    res.status(500).json({
                        success: false,
                        error: 'Internal server error'
                    } as ApiResponse);
                }
                return;
            }

            // Неизвестный JSON формат
            console.log(`ℹ️ Неизвестный JSON формат webhook'а`);
            res.status(200).json({
                success: true,
                message: 'Unknown JSON webhook format'
            } as ApiResponse);
            return;
        }

        // Неизвестный формат webhook'а
        console.log(`ℹ️ Неизвестный формат webhook'а от ЮMoney`);
        res.status(200).json({
            success: true,
            message: 'Unknown webhook format'
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка обработки webhook\'а от ЮMoney:', error);

        // Обрабатываем ошибку с созданием записи о повторной попытке
        try {
            const operationId = req.body?.operation_id || req.body?.object?.id || 'unknown';
            await handlePaymentError(
                operationId,
                error instanceof Error ? error.message : 'Unknown error'
            );
        } catch (retryError) {
            console.error('❌ Критическая ошибка при обработке ошибки:', retryError);
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        } as ApiResponse);
    }
});

// Диагностический endpoint
router.get('/debug', async (req: Request, res: Response) => {
    try {
        console.log('🔍 Диагностический endpoint вызван');

        const result = await pool.query(
            'SELECT id, payment_label, status FROM invoices ORDER BY created_at DESC LIMIT 3'
        );

        console.log('📊 Результат запроса:', result.rows);

        res.json({
            success: true,
            message: 'Debug endpoint working',
            invoices: result.rows
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка диагностики:', error);
        res.status(500).json({
            success: false,
            error: 'Debug error'
        } as ApiResponse);
    }
});

// Тестовый endpoint для проверки findInvoiceByLabel
router.get('/test-find/:label', async (req: Request, res: Response) => {
    try {
        const { label } = req.params;
        if (!label) {
            return res.status(400).json({
                success: false,
                error: 'Label parameter is required'
            } as ApiResponse);
        }

        console.log(`🔍 Тестируем поиск счета по метке: "${label}"`);

        const invoiceId = await findInvoiceByLabel(label);

        console.log(`📊 Результат поиска: ${invoiceId ? 'найден' : 'не найден'}`, { invoiceId });

        return res.json({
            success: true,
            label: label,
            invoiceId: invoiceId,
            found: !!invoiceId
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка тестового поиска:', error);
        return res.status(500).json({
            success: false,
            error: 'Test find error'
        } as ApiResponse);
    }
});

export default router;
