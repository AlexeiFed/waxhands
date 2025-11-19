/**
 * @file: robokassaController.ts
 * @description: Контроллер для интеграции с Robokassa
 * @dependencies: robokassaService.ts, types/robokassa.ts
 * @created: 2025-01-26
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { robokassaService } from '../services/robokassaService.js';
import { CreateRobokassaInvoiceData, RobokassaResultNotification, RobokassaJWSNotification } from '../types/robokassa.js';
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
 * Создает данные для iframe оплаты через Robokassa
 */
export const createIframePaymentData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const userId = req.user?.userId;

        console.log('🔄 Создаем данные для iframe оплаты:', { invoiceId, userId });

        // Получаем данные пользователя из БД
        const userResult = await pool.query('SELECT surname, phone FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            } as ApiResponse);
            return;
        }

        const userData = userResult.rows[0];

        // Проверяем, доступна ли оплата для пользователя
        if (!robokassaService.isPaymentAvailableForUser(userData)) {
            console.log('❌ Оплата недоступна для пользователя:', userData);
            res.status(403).json({
                success: false,
                error: 'Оплата временно недоступна.'
            } as ApiResponse);
            return;
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
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Проверяем, что счет принадлежит пользователю
        if (req.user?.role !== 'admin' && invoice.participant_id !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            } as ApiResponse);
            return;
        }

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
        console.log('🔍 Заголовки запроса:', req.headers);
        console.log('🔍 Пользователь из токена:', req.user);

        // Получаем данные пользователя из БД
        const userResult = await pool.query('SELECT surname, phone FROM users WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            } as ApiResponse);
            return;
        }

        const userData = userResult.rows[0];

        // Проверяем, доступна ли оплата для пользователя
        if (!robokassaService.isPaymentAvailableForUser(userData)) {
            console.log('❌ Оплата недоступна для пользователя:', userData);
            res.status(403).json({
                success: false,
                error: 'Оплата временно недоступна.'
            } as ApiResponse);
            return;
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
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Проверяем, что счет принадлежит пользователю
        if (req.user?.role !== 'admin' && invoice.participant_id !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            } as ApiResponse);
            return;
        }

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

        // Создаем счет в Robokassa
        const result = await robokassaService.createInvoice(robokassaData);

        if (result.success) {
            // Сохраняем ID счета Robokassa в БД
            await pool.query(
                'UPDATE invoices SET robokassa_invoice_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [result.invoiceId, invoiceId]
            );

            res.json({
                success: true,
                data: {
                    paymentUrl: result.invoiceUrl,
                    invoiceId: result.invoiceId,
                    formData: result.formData // Добавляем данные формы для POST запроса
                }
            } as ApiResponse);
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
        console.log('🔄 Получено уведомление от Robokassa (ResultURL):', req.body);

        const notification: RobokassaResultNotification = req.body;

        // Проверяем подпись
        if (!robokassaService.verifyResultSignature(notification)) {
            console.error('❌ Неверная подпись уведомления от Robokassa');
            res.status(400).json({ error: 'Invalid signature' });
            return;
        }

        const { OutSum, InvId, SignatureValue, PaymentMethod, IncCurrLabel } = notification;

        // Находим счет по InvId
        const invoiceResult = await pool.query(
            'SELECT * FROM invoices WHERE robokassa_invoice_id = $1 OR id = $1',
            [InvId]
        );

        if (invoiceResult.rows.length === 0) {
            console.error('❌ Счет не найден для InvId:', InvId);
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
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [InvId, PaymentMethod || 'robokassa', invoice.id]);

        console.log('✅ Счет успешно оплачен:', {
            invoiceId: invoice.id,
            robokassaInvId: InvId,
            amount: OutSum,
            paymentMethod: PaymentMethod
        });

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
                    Quantity: 1,
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
                wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid');
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

        // Находим счет по invId
        const invoiceResult = await pool.query(
            'SELECT * FROM invoices WHERE robokassa_invoice_id = $1 OR id = $1',
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
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [data.opKey, data.paymentMethod, invoice.id]);

        console.log('✅ Счет успешно оплачен через JWS:', {
            invoiceId: invoice.id,
            robokassaInvId: data.invId,
            amount: data.incSum,
            paymentMethod: data.paymentMethod,
            opKey: data.opKey
        });


        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid');
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
 * Инициирует возврат средств
 */
export const createRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { invoiceId } = req.params;
        const { opKey, refundSum } = req.body;

        console.log('🔄 Создаем возврат:', { invoiceId, opKey, refundSum });

        // Получаем данные счета
        const invoiceResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);

        if (invoiceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Проверяем права доступа
        if (req.user?.role !== 'admin' && invoice.participant_id !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            } as ApiResponse);
            return;
        }

        // Проверяем статус счета
        if (invoice.status !== 'paid') {
            res.status(400).json({
                success: false,
                error: 'Возврат возможен только для оплаченных счетов'
            } as ApiResponse);
            return;
        }

        // Проверяем время возврата (до 3 часов до мастер-класса)
        const workshopDate = new Date(invoice.workshop_date);
        const now = new Date();
        const threeHoursBefore = new Date(workshopDate.getTime() - 3 * 60 * 60 * 1000);

        if (now > threeHoursBefore) {
            res.status(400).json({
                success: false,
                error: 'Возврат возможен только до 3 часов до начала мастер-класса'
            } as ApiResponse);
            return;
        }

        // Создаем возврат в Robokassa
        const refundResult = await robokassaService.createRefund({
            OpKey: opKey || '',
            RefundSum: refundSum || parseFloat(invoice.amount)
        });

        if (refundResult.success) {
            // Обновляем статус счета
            await pool.query(
                'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['cancelled', invoiceId]
            );

            res.json({
                success: true,
                data: {
                    requestId: refundResult.requestId,
                    message: 'Возврат инициирован'
                }
            } as ApiResponse);
        } else {
            res.status(500).json({
                success: false,
                error: refundResult.message || 'Ошибка создания возврата'
            } as ApiResponse);
        }

    } catch (error) {
        console.error('❌ Ошибка при создании возврата:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
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

        // Получаем данные счета из БД
        const invoiceResult = await pool.query(`
            SELECT 
                i.*,
                mce.workshop_date,
                s.name as service_name
            FROM invoices i
            LEFT JOIN master_class_events mce ON i.master_class_id = mce.id
            LEFT JOIN services s ON mce.service_id = s.id
            WHERE i.id = $1
        `, [invoiceId]);

        if (invoiceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Проверяем, что счет принадлежит пользователю
        if (req.user?.role !== 'admin' && invoice.participant_id !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            } as ApiResponse);
            return;
        }

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

        // Получаем данные счета из БД
        const invoiceResult = await pool.query(`
            SELECT 
                i.*,
                mce.workshop_date,
                s.name as service_name
            FROM invoices i
            LEFT JOIN master_class_events mce ON i.master_class_id = mce.id
            LEFT JOIN services s ON mce.service_id = s.id
            WHERE i.id = $1
        `, [invoiceId]);

        if (invoiceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = invoiceResult.rows[0];

        // Проверяем, что счет принадлежит пользователю
        if (req.user?.role !== 'admin' && invoice.participant_id !== req.user?.userId) {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            } as ApiResponse);
            return;
        }

        // Проверяем статус счета
        if (invoice.status !== 'paid') {
            res.status(400).json({
                success: false,
                error: 'Счет не оплачен'
            } as ApiResponse);
            return;
        }

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

        // Получаем OpKey из Robokassa
        const statusResult = await robokassaService.checkOperationStatus(parseInt(invoice.robokassa_invoice_id));

        if (!statusResult.success || !statusResult.opKey) {
            res.status(400).json({
                success: false,
                error: 'Не удалось получить данные операции для возврата'
            } as ApiResponse);
            return;
        }

        // Создаем возврат
        const refundData = {
            OpKey: statusResult.opKey,
            RefundSum: parseFloat(invoice.amount),
            InvoiceItems: [{
                Name: `Мастер-класс "${invoice.service_name || 'Восковая скульптура'}"`,
                Quantity: 1,
                Cost: parseFloat(invoice.amount),
                Tax: "none" as const,
                PaymentMethod: "full_payment" as const,
                PaymentObject: "service" as const
            }]
        };

        const refundResult = await robokassaService.createRefund(refundData);

        if (refundResult.success) {
            // Обновляем статус счета
            await pool.query(`
                UPDATE invoices 
                SET refund_status = 'pending',
                    refund_request_id = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [refundResult.requestId, invoice.id]);

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
