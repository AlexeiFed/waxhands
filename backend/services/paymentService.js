/**
 * @file: paymentService.ts
 * @description: Сервис для обработки платежей и обновления счетов
 * @dependencies: database connection, types
 * @created: 2025-01-26
 */
import pool from '../database/connection.js';
import { sendInvoiceStatusUpdate } from './notificationService.js';
/**
 * Обновляет статус счета и связанные данные в базе данных
 */
export const updateInvoicePaymentStatus = async (paymentData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log(`🔄 Обновляем счет ${paymentData.invoiceId}: статус=paid, payment_id=${paymentData.paymentId}`);
        // Обновляем счет
        const updateResult = await client.query(`UPDATE invoices 
             SET status = $1, 
                 payment_id = $2, 
                 payment_method = $3, 
                 payment_date = $4, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $5 
             RETURNING *`, ['paid', paymentData.paymentId, paymentData.paymentMethod, paymentData.paymentDate, paymentData.invoiceId]);
        if (updateResult.rows.length === 0) {
            console.error(`❌ Счет ${paymentData.invoiceId} не найден`);
            await client.query('ROLLBACK');
            return {
                success: false,
                message: `Счет ${paymentData.invoiceId} не найден`,
                error: 'Invoice not found'
            };
        }
        const invoice = updateResult.rows[0];
        console.log(`✅ Счет обновлен:`, {
            id: invoice.id,
            status: invoice.status,
            payment_id: invoice.payment_id,
            payment_method: invoice.payment_method,
            payment_date: invoice.payment_date
        });
        // Упрощенная синхронизация статуса оплаты (временно отключена)
        console.log(`ℹ️ Синхронизация статуса оплаты временно отключена`);
        // Создаем запись о платеже
        await client.query(`INSERT INTO payment_history (
                invoice_id, payment_id, amount, currency, payment_method, 
                payment_date, sender, operation_id, label
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            paymentData.invoiceId,
            paymentData.paymentId,
            paymentData.amount,
            paymentData.currency,
            paymentData.paymentMethod,
            paymentData.paymentDate,
            paymentData.sender || null,
            paymentData.operationId,
            paymentData.label || null
        ]);
        await client.query('COMMIT');
        // Отправляем WebSocket уведомление об обновлении статуса
        try {
            await sendInvoiceStatusUpdate(paymentData.invoiceId, 'paid');
        }
        catch (wsError) {
            console.warn('⚠️ Не удалось отправить WebSocket уведомление:', wsError);
            // Не прерываем выполнение если WebSocket недоступен
        }
        return {
            success: true,
            message: `Счет ${paymentData.invoiceId} успешно обновлен на статус 'paid'`,
            invoiceId: paymentData.invoiceId,
            paymentId: paymentData.paymentId
        };
    }
    catch (error) {
        console.error(`❌ Ошибка обновления счета ${paymentData.invoiceId}:`, error);
        await client.query('ROLLBACK');
        return {
            success: false,
            message: `Ошибка обновления счета ${paymentData.invoiceId}`,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    finally {
        client.release();
    }
};
/**
 * Находит счет по метке платежа или отправителю
 */
export const findInvoiceByLabel = async (label) => {
    try {
        console.log(`🔍 Ищем счет по метке: "${label}"`);
        const result = await pool.query('SELECT id FROM invoices WHERE payment_label = $1 AND status = $2', [label, 'pending']);
        console.log(`📊 Результат поиска: найдено ${result.rows.length} записей`);
        if (result.rows.length > 0) {
            console.log(`✅ Найден счет: ${result.rows[0].id}`);
        }
        else {
            console.log(`❌ Счет не найден для метки: "${label}"`);
            // Проверяем что есть в базе
            const allResult = await pool.query('SELECT id, payment_label, status FROM invoices WHERE payment_label IS NOT NULL ORDER BY created_at DESC LIMIT 3', []);
            console.log(`📋 Доступные метки в базе:`, allResult.rows.map(row => ({
                id: row.id,
                label: row.payment_label,
                status: row.status
            })));
        }
        return result.rows.length > 0 ? result.rows[0].id : null;
    }
    catch (error) {
        console.error('❌ Ошибка поиска счета по метке:', error);
        return null;
    }
};
/**
 * Находит счет по отправителю
 */
export const findInvoiceBySender = async (sender) => {
    try {
        const result = await pool.query('SELECT id FROM invoices WHERE sender_phone = $1 AND status = $2', [sender, 'pending']);
        return result.rows.length > 0 ? result.rows[0].id : null;
    }
    catch (error) {
        console.error('❌ Ошибка поиска счета по отправителю:', error);
        return null;
    }
};
//# sourceMappingURL=paymentService.js.map