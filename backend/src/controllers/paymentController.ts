/**
 * @file: paymentController.ts
 * @description: Универсальный контроллер для работы с платежными системами (Robokassa, FreeKassa и др.)
 * @dependencies: PaymentFactory, IPaymentProvider
 * @created: 2025-10-16
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { paymentFactory, getPaymentProvider } from '../payments/PaymentFactory.js';
import { PaymentInvoiceData, PaymentNotification } from '../payments/interfaces/IPaymentProvider.js';
import { ApiResponse, UserRole } from '../types/index.js';

// Расширяем интерфейс Request для добавления user
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: UserRole;
        email?: string;
        iat: number;
        exp: number;
    };
}

/**
 * Общий метод для валидации и получения данных счета
 */
async function validateAndGetInvoiceData(invoiceId: string, userId: string, userRole: UserRole) {
    // Получаем данные пользователя из БД
    const userResult = await pool.query('SELECT surname, phone FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
        return {
            success: false,
            error: 'Пользователь не найден',
            statusCode: 404
        };
    }

    const userData = userResult.rows[0];

    // Получаем текущий провайдер
    const provider = getPaymentProvider();

    // Проверяем, доступна ли оплата для пользователя
    if (!provider.isPaymentAvailable(userData)) {
        return {
            success: false,
            error: 'Оплата временно недоступна.',
            statusCode: 403
        };
    }

    // Получаем данные счета из БД
    const invoiceResult = await pool.query(`
        SELECT 
            i.*,
            s.name as service_name,
            s.short_description as service_description
        FROM invoices i
        LEFT JOIN master_class_events mce ON i.master_class_id = mce.id
        LEFT JOIN services s ON mce.service_id = s.id
        WHERE i.id = $1
    `, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
        return {
            success: false,
            error: 'Счет не найден',
            statusCode: 404
        };
    }

    const invoice = invoiceResult.rows[0];

    // Проверяем, что счет принадлежит пользователю
    if (userRole !== 'admin' && invoice.participant_id !== userId) {
        return {
            success: false,
            error: 'Доступ запрещен',
            statusCode: 403
        };
    }

    return {
        success: true,
        invoice,
        userData
    };
}

/**
 * Создает ссылку на оплату (универсальный метод для всех провайдеров)
 */
export const createPaymentLink = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;
        const provider = getPaymentProvider();

        console.log(`🔄 Создаем ссылку на оплату через ${provider.providerName}:`, { invoiceId, userId });

        // Валидация и получение данных счета
        const validationResult = await validateAndGetInvoiceData(invoiceId, userId!, req.user?.role || 'parent');

        if (!validationResult.success) {
            res.status(validationResult.statusCode).json({
                success: false,
                error: validationResult.error
            } as ApiResponse);
            return;
        }

        const { invoice } = validationResult;

        // Проверяем статус счета
        if (invoice.status !== 'pending') {
            res.status(400).json({
                success: false,
                error: 'Счет уже оплачен или отменен'
            } as ApiResponse);
            return;
        }

        // Подготавливаем данные для платежного провайдера
        const paymentData: PaymentInvoiceData = {
            invoiceId: invoice.id,
            amount: parseFloat(invoice.amount),
            description: `Мастер-класс "${invoice.service_name || 'Восковая скульптура'}"`,
            participantName: invoice.participant_name,
            masterClassName: invoice.service_name || 'Восковая скульптура',
            selectedStyles: invoice.selected_styles || [],
            selectedOptions: invoice.selected_options || [],
            workshopDate: invoice.workshop_date,
            city: invoice.city,
            schoolName: invoice.school_name,
            classGroup: invoice.class_group,
            userEmail: invoice.participant_email,
            notes: invoice.notes
        };

        // Создаем счет через текущий провайдер
        const result = await provider.createInvoice(paymentData);

        if (result.success) {
            // Сохраняем ID счета Robokassa в БД
            await pool.query(
                `UPDATE invoices SET robokassa_invoice_id = $1, payment_provider = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
                [result.invoiceId, 'robokassa', invoiceId]
            );

            const responseData = {
                success: true,
                data: {
                    paymentUrl: result.paymentUrl || result.invoiceUrl,
                    invoiceId: result.invoiceId,
                    formData: result.formData,
                    method: result.method || 'POST',
                    provider: provider.providerName
                }
            };

            console.log(`📤 Отправляем ответ API (${provider.providerName}):`, {
                success: responseData.success,
                paymentUrl: responseData.data.paymentUrl,
                method: responseData.data.method,
                provider: responseData.data.provider
            });

            res.json(responseData as ApiResponse);
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Ошибка создания ссылки на оплату'
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при создании ссылки на оплату:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Обрабатывает уведомления от платежных систем (универсальный webhook)
 */
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = getPaymentProvider();
        console.log(`🔄 Получено уведомление от ${provider.providerName}:`, {
            body: req.body,
            query: req.query,
            method: req.method
        });

        // Определяем, откуда пришли данные (body или query)
        const notificationData = req.method === 'POST' ? req.body : req.query;

        // Формируем уведомление в формате Robokassa
        const notification: PaymentNotification = {
            invoiceId: notificationData.InvId || notificationData.invId,
            amount: notificationData.OutSum || notificationData.outSum,
            signature: notificationData.SignatureValue || notificationData.signatureValue,
            transactionId: notificationData.Fee,
            ...notificationData
        };

        console.log('🔍 Обрабатываемые данные (Robokassa):', notification);

        // Проверяем подпись Robokassa
        if (!provider.verifyNotification(notification)) {
            console.error(`❌ Неверная подпись уведомления от Robokassa`);
            res.status(200).send('bad sign');
            return;
        }

        // Ищем счет по robokassa_invoice_id или по id
        const providerIdField = 'robokassa_invoice_id';

        // Находим счет по ID провайдера
        const invoiceResult = await pool.query(
            `SELECT * FROM invoices WHERE ${providerIdField} = $1 OR id = $1`,
            [notification.invoiceId]
        );

        if (invoiceResult.rows.length === 0) {
            console.error(`❌ Счет не найден для ${provider.providerName} ID:`, notification.invoiceId);
            res.status(200).send('invoice not found');
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Обработка уже оплаченных счетов
        if (invoice.status === 'paid') {
            console.log('ℹ️ Счет уже оплачен, подтверждаем уведомление');
            res.send(`OK${notification.invoiceId}`);
            return;
        }

        // Проверяем сумму платежа
        if (Math.abs(parseFloat(notification.amount) - parseFloat(invoice.amount)) > 0.01) {
            console.error('❌ Сумма платежа не соответствует счету:', {
                expected: invoice.amount,
                received: notification.amount
            });
            res.status(200).send('invalid amount');
            return;
        }

        // Получаем OpKey для Robokassa (для возможности возврата)
        let opKey: string | undefined;
        try {
            console.log('🔍 Получаем OpKey для Robokassa...');
            const { robokassaService } = await import('../services/robokassaService.js');
            const statusResult = await robokassaService.checkOperationStatus(parseInt(notification.invoiceId));
            if (statusResult.success && statusResult.opKey) {
                opKey = statusResult.opKey;
                console.log('✅ OpKey получен:', opKey);
            } else {
                console.warn('⚠️ Не удалось получить OpKey из XML API:', statusResult.error);
            }
        } catch (opKeyError) {
            console.warn('⚠️ Ошибка при получении OpKey (не критично):', opKeyError);
        }

        // Обновляем статус счета Robokassa
        await pool.query(
            `UPDATE invoices 
             SET status = 'paid', 
                 payment_id = $1,
                 payment_method = 'robokassa',
                 payment_date = CURRENT_TIMESTAMP,
                 robokassa_op_key = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [notification.transactionId || notification.invoiceId, 'robokassa', invoice.id, opKey || null]
        );

        console.log(`✅ Счет успешно оплачен через Robokassa:`, {
            invoiceId: invoice.id,
            amount: notification.amount,
            transactionId: notification.transactionId,
            robokassaOpKey: opKey || 'не получен'
        });

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid', invoice.master_class_id);
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        // Отвечаем Robokassa
        res.send(`OK${notification.invoiceId}`);

    } catch (error) {
        console.error('❌ Ошибка при обработке уведомления:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Обрабатывает возврат пользователя после успешной оплаты
 */
export const handleSuccessRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = getPaymentProvider();
        console.log(`🔄 Обработка Success redirect от ${provider.providerName}:`, req.query);

        // Формируем универсальное уведомление
        // Формат данных Robokassa для success redirect
        const notification: PaymentNotification = {
            invoiceId: (req.query.InvId as string) || '',
            amount: (req.query.OutSum as string) || '',
            signature: (req.query.SignatureValue as string) || '',
            ...req.query
        };
        const invoiceId = req.query.InvId as string;
        const amount = req.query.OutSum as string;

        // Проверяем подпись (опционально для success redirect)
        if (!provider.verifySuccessNotification(notification)) {
            console.warn(`⚠️ Неверная подпись Success redirect от Robokassa`);
        }

        console.log(`✅ Success redirect обработан:`, { invoiceId, amount, provider: 'Robokassa' });

        // Перенаправляем пользователя на страницу успеха
        res.redirect(`https://waxhands.ru/payment/success?invoiceId=${invoiceId}&amount=${amount}&provider=robokassa`);

    } catch (error) {
        console.error('❌ Ошибка при обработке Success redirect:', error);
        res.status(500).send('Internal server error');
    }
};

/**
 * Обрабатывает возврат пользователя при отказе от оплаты
 */
export const handleFailRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log(`🔄 Обработка Fail redirect от Robokassa:`, req.query);

        // Формат данных Robokassa для fail redirect
        const invoiceId = req.query.InvId as string;
        const amount = req.query.OutSum as string;

        console.log(`❌ Пользователь отказался от оплаты:`, { invoiceId, amount, provider: 'Robokassa' });

        // Перенаправляем пользователя на страницу отказа
        res.redirect(`https://waxhands.ru/payment/fail?invoiceId=${invoiceId}&amount=${amount}&provider=robokassa`);

    } catch (error) {
        console.error('❌ Ошибка при обработке Fail redirect:', error);
        res.status(500).send('Internal server error');
    }
};

/**
 * Проверяет возможность возврата для счета
 */
export const checkRefundAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;
        const provider = getPaymentProvider();

        console.log(`🔄 Проверяем возможность возврата через ${provider.providerName}:`, { invoiceId, userId });

        // Валидация и получение данных счета
        const validationResult = await validateAndGetInvoiceData(invoiceId, userId!, req.user?.role || 'parent');

        if (!validationResult.success) {
            res.status(validationResult.statusCode).json({
                success: false,
                error: validationResult.error
            } as ApiResponse);
            return;
        }

        const { invoice } = validationResult;

        // Проверяем статус счета
        if (invoice.status !== 'paid') {
            res.status(400).json({
                success: false,
                error: 'Счет не оплачен',
                refundAvailable: false
            } as ApiResponse);
            return;
        }

        // Проверяем возможность возврата через провайдер
        const refundAvailable = provider.isRefundAvailable(invoice.workshop_date);
        const workshopDate = new Date(invoice.workshop_date);
        const now = new Date();
        const timeDiff = workshopDate.getTime() - now.getTime();
        const hoursDiff = Math.max(0, timeDiff / (1000 * 60 * 60));

        // Проверяем, поддерживает ли провайдер возвраты
        const supportsRefunds = typeof provider.createRefund === 'function';

        res.json({
            success: true,
            refundAvailable: refundAvailable && supportsRefunds,
            supportsRefunds,
            provider: provider.providerName,
            workshopDate: invoice.workshop_date,
            hoursUntilWorkshop: Math.round(hoursDiff * 10) / 10,
            message: !supportsRefunds
                ? `${provider.providerName} не поддерживает автоматические возвраты. Обратитесь в службу поддержки.`
                : refundAvailable
                    ? 'Возврат возможен'
                    : 'Возврат возможен только за 3 часа до мастер-класса'
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка при проверке возможности возврата:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Получает информацию о текущем платежном провайдере
 */
export const getProviderInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        const provider = getPaymentProvider();

        res.json({
            success: true,
            data: {
                provider: 'Robokassa',
                type: 'robokassa',
                supportsRefunds: true,
                supportsRefundStatus: true
            }
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка при получении информации о провайдере:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};


