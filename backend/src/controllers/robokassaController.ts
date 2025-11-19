/**
 * @file: robokassaController.ts
 * @description: Контроллер для интеграции с Robokassa
 * @dependencies: robokassaService.ts, types/robokassa.ts
 * @created: 2025-01-26
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { robokassaService } from '../services/robokassaService.js';
import { syncPaymentStatusWithParticipants } from './invoices.js';
import { CreateRobokassaInvoiceData, RobokassaResultNotification, RobokassaJWSNotification, RobokassaCreateInvoiceResponse } from '../types/robokassa.js';
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

    // Проверяем, доступна ли оплата для пользователя
    if (!robokassaService.isPaymentAvailableForUser(userData)) {
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
 * Создает данные для iframe оплаты через Robokassa
 */
export const createIframePaymentData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔄 Создаем данные для iframe оплаты:', { invoiceId, userId });

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

        // Подготавливаем данные для Robokassa
        const robokassaData: CreateRobokassaInvoiceData = {
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
            notes: invoice.notes
        };

        // Создаем данные для iframe
        const result = robokassaService.createIframePaymentData(robokassaData);

        if (result.success) {
            // Сохраняем ID счета Robokassa в БД
            await pool.query(
                'UPDATE invoices SET robokassa_invoice_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [result.iframeData?.invId, invoiceId]
            );

            res.json({
                success: true,
                data: {
                    iframeData: result.iframeData,
                    invoiceId: result.iframeData?.invId
                }
            } as ApiResponse);
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Ошибка создания данных для iframe оплаты'
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при создании данных для iframe оплаты:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Создает ссылку на оплату через Robokassa
 */
export const createPaymentLink = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔄 Создаем ссылку на оплату:', { invoiceId, userId });

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

        // Подготавливаем данные для Robokassa
        const robokassaData: CreateRobokassaInvoiceData = {
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
            notes: invoice.notes
        };

        // Создаем счет через классический HTML-формат (стабильный вариант)
        const result = await robokassaService.createInvoice(robokassaData);

        if (result.success) {
            // Сохраняем ID счета Robokassa в БД
            await pool.query(
                'UPDATE invoices SET robokassa_invoice_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [result.invoiceId, invoiceId]
            );

            const responseData = {
                success: true,
                data: {
                    paymentUrl: result.paymentUrl || result.invoiceUrl,
                    invoiceId: result.invoiceId,
                    formData: result.formData,
                    method: result.method || 'POST' // Указываем метод POST для длинных URL
                }
            };

            console.log('📤 Отправляем ответ API:', {
                success: responseData.success,
                paymentUrl: responseData.data.paymentUrl,
                method: responseData.data.method,
                formDataKeys: Object.keys(responseData.data.formData || {}),
                formDataSize: JSON.stringify(responseData.data.formData || {}).length
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
 * Обрабатывает возврат пользователя после успешной оплаты (SuccessURL)
 */
export const handleSuccessRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 Обработка SuccessURL от Robokassa:', req.query);

        const notification = req.query as { OutSum: string; InvId: string; SignatureValue: string;[key: string]: string };

        // Проверяем подпись
        if (!robokassaService.verifySuccessSignature(notification)) {
            console.error('❌ Неверная подпись SuccessURL от Robokassa');
            res.status(400).send('Invalid signature');
            return;
        }

        const { OutSum, InvId } = notification;

        console.log('✅ SuccessURL обработан успешно:', {
            invoiceId: InvId,
            amount: OutSum
        });

        // Перенаправляем пользователя на страницу успеха
        res.redirect(`https://waxhands.ru/payment/success?invoiceId=${InvId}&amount=${OutSum}`);

    } catch (error) {
        console.error('❌ Ошибка при обработке SuccessURL:', error);
        res.status(500).send('Internal server error');
    }
};

/**
 * Обрабатывает возврат пользователя при отказе от оплаты (FailURL)
 */
export const handleFailRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 Обработка FailURL от Robokassa:', req.query);

        const { OutSum, InvId } = req.query as { OutSum: string; InvId: string;[key: string]: string };

        console.log('❌ Пользователь отказался от оплаты:', {
            invoiceId: InvId,
            amount: OutSum
        });

        // Перенаправляем пользователя на страницу отказа
        res.redirect(`https://waxhands.ru/payment/fail?invoiceId=${InvId}&amount=${OutSum}`);

    } catch (error) {
        console.error('❌ Ошибка при обработке FailURL:', error);
        res.status(500).send('Internal server error');
    }
};

/**
 * Обрабатывает уведомления от Robokassa (ResultURL)
 */
export const handleResultNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 Получено уведомление от Robokassa (ResultURL):');
        console.log('📦 req.body:', req.body);
        console.log('📦 req.query:', req.query);
        console.log('📦 req.method:', req.method);
        console.log('📦 req.headers:', req.headers);

        // Получаем данные из body (POST) или query (GET)
        const notification: RobokassaResultNotification = req.method === 'POST' ? req.body : req.query as RobokassaResultNotification;

        console.log('🔍 Обрабатываемые данные:', notification);

        // Проверяем подпись
        if (!robokassaService.verifyResultSignature(notification)) {
            console.error('❌ Неверная подпись уведомления от Robokassa');
            console.error('🔍 Данные для проверки подписи:', notification);
            res.status(200).send('bad sign'); // ✅ Текстовый ответ, статус 200
            return;
        }

        const { OutSum, InvId, SignatureValue, PaymentMethod, IncCurrLabel } = notification;

        // Находим счет по InvId (только по robokassa_invoice_id, так как id - это UUID)
        const invoiceResult = await pool.query(
            'SELECT * FROM invoices WHERE robokassa_invoice_id = $1',
            [InvId]
        );

        if (invoiceResult.rows.length === 0) {
            console.error('❌ Счет не найден для InvId:', InvId);
            res.status(200).send('invoice not found');
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Обработка уже оплаченных счетов
        if (invoice.status === 'paid') {
            console.log('ℹ️ Счет уже оплачен, подтверждаем уведомление');
            res.send(`OK${InvId}`);
            return;
        }

        // Проверяем сумму платежа
        if (Math.abs(parseFloat(OutSum) - parseFloat(invoice.amount)) > 0.01) {
            console.error('❌ Сумма платежа не соответствует счету:', {
                expected: invoice.amount,
                received: OutSum,
                difference: Math.abs(parseFloat(OutSum) - parseFloat(invoice.amount))
            });
            res.status(200).send('invalid amount');
            return;
        }

        // Получаем OpKey из XML API для возможности возврата
        let opKey: string | undefined;
        try {
            console.log('🔍 Получаем OpKey для возможности возврата...');
            const statusResult = await robokassaService.checkOperationStatus(parseInt(InvId));
            if (statusResult.success && statusResult.opKey) {
                opKey = statusResult.opKey;
                console.log('✅ OpKey получен:', opKey);
            } else {
                console.warn('⚠️ Не удалось получить OpKey из XML API:', statusResult.error);
            }
        } catch (opKeyError) {
            console.warn('⚠️ Ошибка при получении OpKey (не критично):', opKeyError);
        }

        // Обновляем статус счета с OpKey
        await pool.query(`
            UPDATE invoices 
            SET status = 'paid', 
                payment_id = $1,
                payment_method = $2,
                payment_date = CURRENT_TIMESTAMP,
                robokassa_invoice_id = $4,
                robokassa_op_key = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [InvId, PaymentMethod || 'robokassa', invoice.id, InvId, opKey || null]);

        console.log('✅ Счет успешно оплачен:', {
            invoiceId: invoice.id,
            robokassaInvId: InvId,
            robokassaOpKey: opKey || 'не получен',
            amount: OutSum,
            paymentMethod: PaymentMethod
        });

        // Синхронизируем участников мастер-класса
        try {
            if (invoice.master_class_id && invoice.participant_id) {
                await syncPaymentStatusWithParticipants(invoice.master_class_id, invoice.participant_id, true);
                console.log('✅ Статус оплаты синхронизирован с участниками (ResultURL)');
            } else {
                console.warn('⚠️ Пропущена синхронизация участников: отсутствует master_class_id или participant_id');
            }
        } catch (syncError) {
            console.error('❌ Ошибка синхронизации статуса оплаты с участниками (ResultURL):', syncError);
        }

        // Создаем второй чек для предоплаты (итоговый чек после оказания услуги)
        // Согласно ФЗ-54 для образовательных услуг
        try {
            const secondReceiptData = {
                merchantId: 'waxhands.ru',
                id: `receipt_${invoice.id}_${Date.now()}`,
                originId: InvId,
                total: parseFloat(OutSum),
                items: [{
                    Name: `Мастер-класс "${invoice.service_name || 'Восковая скульптура'}"`,
                    Quantity: 1, // ✅ ИСПРАВЛЕНО: Обычное число без преобразования в строку
                    Cost: parseFloat(OutSum),
                    Tax: "none" as const,
                    PaymentMethod: "full_payment" as const,
                    PaymentObject: "service" as const
                }],
                clientEmail: invoice.participant_email,
                clientPhone: invoice.participant_phone
            };

            const secondReceiptResult = await robokassaService.createSecondReceipt(secondReceiptData);

            if (secondReceiptResult.success) {
                console.log('✅ Второй чек создан успешно');
            } else {
                console.error('❌ Ошибка создания второго чека:', secondReceiptResult.error);
            }
        } catch (error) {
            console.error('❌ Ошибка при создании второго чека:', error);
        }

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid', invoice.master_class_id);
                if (invoice.master_class_id) {
                    wsManager.notifyMasterClassUpdate(invoice.master_class_id, 'payment_status_updated');
                }
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        // Отвечаем Robokassa
        res.send(`OK${InvId}`);

    } catch (error) {
        console.error('❌ Ошибка при обработке уведомления от Robokassa:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Обрабатывает JWS уведомления от Robokassa (ResultURL2)
 */
export const handleJWSNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 Получено JWS уведомление от Robokassa (ResultURL2):', req.body);

        const { token } = req.body;

        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        // Проверяем JWS токен
        const notification = robokassaService.verifyJWSNotification(token);

        if (!notification) {
            console.error('❌ Неверный JWS токен');
            res.status(400).json({ error: 'Invalid JWS token' });
            return;
        }

        const { data } = notification;

        if (data.state !== 'OK') {
            console.log('⚠️ Платеж не успешен:', data);
            res.status(200).json({ status: 'payment_failed' });
            return;
        }

        // Находим счет по invId (только по robokassa_invoice_id)
        const invoiceResult = await pool.query(
            'SELECT * FROM invoices WHERE robokassa_invoice_id = $1',
            [data.invId]
        );

        if (invoiceResult.rows.length === 0) {
            console.error('❌ Счет не найден для invId:', data.invId);
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Обновляем статус счета
        await pool.query(`
            UPDATE invoices 
            SET status = 'paid', 
                payment_id = $1,
                payment_method = $2,
                payment_date = CURRENT_TIMESTAMP,
                robokassa_invoice_id = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [data.opKey, data.paymentMethod, invoice.id, data.opKey]);

        console.log('✅ Счет успешно оплачен через JWS:', {
            invoiceId: invoice.id,
            robokassaInvId: data.invId,
            amount: data.incSum,
            paymentMethod: data.paymentMethod,
            opKey: data.opKey
        });

        // Синхронизируем участников мастер-класса
        try {
            if (invoice.master_class_id && invoice.participant_id) {
                await syncPaymentStatusWithParticipants(invoice.master_class_id, invoice.participant_id, true);
                console.log('✅ Статус оплаты синхронизирован с участниками (ResultURL2)');
            } else {
                console.warn('⚠️ Пропущена синхронизация участников (ResultURL2): отсутствует master_class_id или participant_id');
            }
        } catch (syncError) {
            console.error('❌ Ошибка синхронизации статуса оплаты с участниками (ResultURL2):', syncError);
        }


        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid', invoice.master_class_id);
                if (invoice.master_class_id) {
                    wsManager.notifyMasterClassUpdate(invoice.master_class_id, 'payment_status_updated');
                }
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('❌ Ошибка при обработке JWS уведомления:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


/**
 * Получает статус возврата
 */
export const getRefundStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;

        if (!requestId) {
            res.status(400).json({
                success: false,
                error: 'Request ID is required'
            } as ApiResponse);
            return;
        }

        const status = await robokassaService.getRefundStatus(requestId);

        if (status) {
            res.json({
                success: true,
                data: status
            } as ApiResponse);
        } else {
            res.status(404).json({
                success: false,
                error: 'Статус возврата не найден'
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при получении статуса возврата:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Проверяет возможность возврата для счета
 */
export const checkRefundAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔄 Проверяем возможность возврата:', { invoiceId, userId });

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

        // Проверяем возможность возврата
        const refundAvailable = robokassaService.isRefundAvailable(invoice.workshop_date);
        const workshopDate = new Date(invoice.workshop_date);
        const now = new Date();
        const timeDiff = workshopDate.getTime() - now.getTime();
        const hoursDiff = Math.max(0, timeDiff / (1000 * 60 * 60));

        res.json({
            success: true,
            refundAvailable,
            workshopDate: invoice.workshop_date,
            hoursUntilWorkshop: Math.round(hoursDiff * 10) / 10,
            message: refundAvailable
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
 * Инициирует возврат средств
 */
export const initiateRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔄 Инициируем возврат:', { invoiceId, userId });

        // Проверяем наличие Password3
        if (!process.env.ROBOKASSA_PASSWORD_3) {
            console.error('❌ Password3 не настроен в системе');
            res.status(500).json({
                success: false,
                error: 'Система возвратов временно недоступна'
            } as ApiResponse);
            return;
        }

        const { reason: rawReason, email } = req.body ?? {};
        const finalReason = typeof rawReason === 'string' && rawReason.trim()
            ? rawReason.trim()
            : 'Возврат по запросу пользователя';
        const finalEmail = typeof email === 'string' ? email.trim() : '';

        if (!finalEmail) {
            res.status(400).json({
                success: false,
                error: 'Необходимо указать e-mail, использованный при оплате'
            } as ApiResponse);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(finalEmail)) {
            res.status(400).json({
                success: false,
                error: 'Некорректный e-mail'
            } as ApiResponse);
            return;
        }

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
                error: 'Счет не оплачен'
            } as ApiResponse);
            return;
        }

        const autoRefundEnabled = process.env.ROBOKASSA_AUTO_REFUND === 'true';

        // Проверяем возможность возврата
        if (!robokassaService.isRefundAvailable(invoice.workshop_date)) {
            res.status(400).json({
                success: false,
                error: 'Возврат возможен только за 3 часа до мастер-класса'
            } as ApiResponse);
            return;
        }

        // Проверяем, не был ли уже инициирован возврат
        if (invoice.refund_status === 'pending' || invoice.refund_status === 'completed') {
            res.status(400).json({
                success: false,
                error: 'Возврат уже инициирован или завершен'
            } as ApiResponse);
            return;
        }

        // Если автоматические возвраты отключены, сохраняем заявку и завершаем
        if (!autoRefundEnabled) {
            await pool.query(`
                UPDATE invoices
                SET refund_status = 'pending',
                    refund_reason = $1,
                    refund_email = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [finalReason, finalEmail, invoice.id]);

            try {
                const { wsManager } = await import('../websocket-server.js');
                if (wsManager) {
                    wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, invoice.status, invoice.master_class_id);
                    if (invoice.master_class_id) {
                        wsManager.notifyMasterClassUpdate(invoice.master_class_id, 'refund_requested');
                    }
                }
            } catch (wsError) {
                console.warn('⚠️ Ошибка отправки WebSocket уведомления о ручном возврате:', wsError);
            }

            res.json({
                success: true,
                message: 'Заявка на возврат отправлена администратору. Мы свяжемся с вами по указанному e-mail.'
            } as ApiResponse);
            return;
        }

        // Получаем OpKey для возврата
        console.log('🔍 Получаем OpKey для возврата:', {
            robokassa_invoice_id: invoice.robokassa_invoice_id,
            robokassa_op_key: invoice.robokassa_op_key,
            type: typeof invoice.robokassa_invoice_id
        });

        let opKey = invoice.robokassa_op_key;

        // Если OpKey не был сохранен ранее, пробуем получить из XML API
        if (!opKey) {
            console.log('⚠️ OpKey не сохранен в БД, запрашиваем из XML API...');

            const robokassaId = parseInt(invoice.robokassa_invoice_id);
            if (isNaN(robokassaId)) {
                res.status(400).json({
                    success: false,
                    error: 'Неверный ID операции Robokassa'
                } as ApiResponse);
                return;
            }

            const statusResult = await robokassaService.checkOperationStatus(robokassaId);
            console.log('🔍 Результат проверки статуса операции:', statusResult);

            if (statusResult.success && statusResult.opKey) {
                opKey = statusResult.opKey;

                // Сохраняем OpKey в БД для будущих использований
                await pool.query(
                    'UPDATE invoices SET robokassa_op_key = $1 WHERE id = $2',
                    [opKey, invoice.id]
                );
                console.log('✅ OpKey получен и сохранен в БД:', opKey);
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Не удалось получить OpKey для возврата. Операция не найдена в Robokassa.'
                } as ApiResponse);
                return;
            }
        } else {
            console.log('✅ Используем сохраненный OpKey из БД:', opKey);
        }

        // Проверяем, что OpKey имеет правильный формат
        if (!opKey || typeof opKey !== 'string' || opKey.length < 10) {
            res.status(400).json({
                success: false,
                error: 'Неверный формат идентификатора операции'
            } as ApiResponse);
            return;
        }

        // Проверить, что сумма возврата положительная
        console.log('🔍 Исходные данные invoice.amount:', invoice.amount, 'typeof:', typeof invoice.amount);
        const refundSum = parseFloat(invoice.amount);
        console.log('🔍 После parseFloat refundSum:', refundSum, 'typeof:', typeof refundSum);
        if (refundSum <= 0) {
            console.log('❌ Сумма возврата <= 0:', refundSum);
            res.status(400).json({
                success: false,
                error: 'Сумма возврата должна быть положительной'
            } as ApiResponse);
            return;
        }

        console.log('🔍 Тип refundSum:', typeof refundSum, 'Значение:', refundSum);

        // Создаем возврат согласно документации Robokassa
        // Принудительно приводим к decimal типу (4.0 вместо 4)
        const refundSumDecimal = refundSum;

        // Убедитесь, что сумма правильная
        if (isNaN(refundSumDecimal) || refundSumDecimal <= 0) {
            console.error('❌ Неверная сумма возврата:', invoice.amount);
            res.status(400).json({
                success: false,
                error: 'Неверная сумма возврата'
            });
            return;
        }

        // Получаем InvoiceItems для детализации возврата
        let invoiceItems = [];
        try {
            invoiceItems = await robokassaService.getInvoiceItemsForRefund(invoice.id);
            console.log('🧾 Получены InvoiceItems для возврата:', invoiceItems);
        } catch (error) {
            console.warn('⚠️ Не удалось получить InvoiceItems, продолжаем без детализации:', error);
        }

        // Форматируем данные для возврата согласно документации vozrat.md
        const refundSumFloat = refundSumDecimal;

        const refundData = {
            OpKey: opKey,
            RefundSum: refundSumFloat,
            InvoiceItems: invoiceItems.length > 0 ? invoiceItems : undefined
        };

        console.log('🔍 Данные для возврата:', refundData);
        console.log('🔍 JSON сериализация:', JSON.stringify(refundData));

        // Используем JWT API возвратов (правильный API)
        const refundResult = await robokassaService.createRefund(refundData);

        if (refundResult.success) {
            // Обновляем статус счета
            await pool.query(`
                UPDATE invoices 
                SET refund_status = 'pending',
                    refund_request_id = $1,
                    refund_reason = $2,
                    refund_email = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [refundResult.requestId, finalReason, finalEmail, invoice.id]);

            console.log('✅ Возврат инициирован:', {
                invoiceId: invoice.id,
                refundRequestId: refundResult.requestId
            });

            res.json({
                success: true,
                message: 'Возврат инициирован успешно',
                refundRequestId: refundResult.requestId
            } as ApiResponse);
        } else {
            res.status(400).json({
                success: false,
                error: refundResult.message || 'Ошибка инициирования возврата'
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при инициировании возврата:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Получает JWT токен для возврата (для отладки)
 */
export const getRefundJWT = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔍 Получаем JWT токен для возврата:', { invoiceId, userId });

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

        // Получаем OpKey для возврата
        let opKey = invoice.robokassa_op_key;

        // Если OpKey не был сохранен ранее, пробуем получить из XML API
        if (!opKey) {
            console.log('⚠️ OpKey не сохранен в БД, запрашиваем из XML API...');

            const robokassaId = parseInt(invoice.robokassa_invoice_id);
            if (isNaN(robokassaId)) {
                res.status(400).json({
                    success: false,
                    error: 'Неверный ID операции Robokassa'
                } as ApiResponse);
                return;
            }

            const statusResult = await robokassaService.checkOperationStatus(robokassaId);

            if (statusResult.success && statusResult.opKey) {
                opKey = statusResult.opKey;

                // Сохраняем OpKey в БД для будущих использований
                await pool.query(
                    'UPDATE invoices SET robokassa_op_key = $1 WHERE id = $2',
                    [opKey, invoice.id]
                );
                console.log('✅ OpKey получен и сохранен в БД:', opKey);
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Не удалось получить OpKey для возврата. Операция не найдена в Robokassa.'
                } as ApiResponse);
                return;
            }
        } else {
            console.log('✅ Используем сохраненный OpKey из БД:', opKey);
        }

        // Проверяем, что OpKey имеет правильный формат
        if (!opKey || typeof opKey !== 'string' || opKey.length < 10) {
            res.status(400).json({
                success: false,
                error: 'Неверный формат идентификатора операции'
            } as ApiResponse);
            return;
        }

        // Форматируем данные для возврата
        const refundSumDecimal = parseFloat(invoice.amount);

        const refundSumFloat = refundSumDecimal;

        // Получаем InvoiceItems для детализации возврата
        let invoiceItems = [];
        try {
            invoiceItems = await robokassaService.getInvoiceItemsForRefund(invoice.id);
            console.log('🧾 Получены InvoiceItems для JWT:', invoiceItems);
        } catch (error) {
            console.warn('⚠️ Не удалось получить InvoiceItems для JWT:', error);
        }

        // Создаем данные для возврата согласно документации vozrat.md
        const refundData = {
            OpKey: opKey,
            RefundSum: refundSumFloat,
            InvoiceItems: invoiceItems.length > 0 ? invoiceItems : undefined
        };

        // Создаем JWT токен для отладки
        console.log('🔍 Создаем JWT токен с данными:', refundData);
        const jwtToken = await robokassaService.createRefundJWT(refundData);
        console.log('🔐 JWT токен создан успешно');

        res.json({
            success: true,
            jwtToken: jwtToken,
            refundData: refundData
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка при получении JWT токена:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

/**
 * Проверяет статус платежа через Robokassa API
 */
export const checkPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔍 Проверяем статус платежа:', { invoiceId, userId });

        // Получаем информацию о счете
        const invoiceResult = await pool.query(`
            SELECT id, robokassa_invoice_id, amount, payment_status, payment_date
            FROM invoices 
            WHERE id = $1 AND participant_id = $2
        `, [invoiceId, userId]);

        if (invoiceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        if (invoice.payment_status === 'paid') {
            res.json({
                success: true,
                message: 'Счет уже оплачен',
                status: 'paid',
                paymentDate: invoice.payment_date
            } as ApiResponse);
            return;
        }

        if (!invoice.robokassa_invoice_id) {
            res.status(400).json({
                success: false,
                error: 'Robokassa ID не найден'
            } as ApiResponse);
            return;
        }

        // Проверяем статус через Robokassa API
        const robokassaId = parseInt(invoice.robokassa_invoice_id);
        if (isNaN(robokassaId)) {
            res.status(400).json({
                success: false,
                error: 'Неверный ID операции Robokassa'
            } as ApiResponse);
            return;
        }

        const statusResult = await robokassaService.checkOperationStatus(robokassaId);

        if (statusResult.success && statusResult.status === 100) {
            // Платеж успешен, обновляем статус (статус 100 = успешный платеж)
            await pool.query(`
                UPDATE invoices 
                SET payment_status = 'paid',
                    payment_date = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [invoiceId]);

            console.log('✅ Статус платежа обновлен на "paid" для счета:', invoiceId);

            res.json({
                success: true,
                message: 'Платеж успешно подтвержден',
                status: 'paid',
                paymentDate: new Date().toISOString()
            } as ApiResponse);
        } else {
            res.json({
                success: true,
                message: 'Платеж еще не подтвержден',
                status: 'pending',
                robokassaStatus: statusResult.status,
                robokassaDescription: statusResult.description
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при проверке статуса платежа:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};
