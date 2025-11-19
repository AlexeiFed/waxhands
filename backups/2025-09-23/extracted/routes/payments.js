/**
 * @file: payments.ts
 * @description: API маршруты для работы с платежами
 * @dependencies: Router, pool, authenticateToken
 * @created: 2025-01-26
 */
import { Router } from 'express';
import pool from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
// Получение истории платежей с статистикой (только для админов)
router.get('/history', authenticateToken, async (req, res) => {
    try {
        // Проверяем что пользователь админ
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }
        // Получаем параметры фильтрации
        const { status, paymentMethod, dateFrom, dateTo, limit = '100', offset = '0' } = req.query;
        // Строим SQL запрос с фильтрами
        const whereConditions = ['1=1'];
        const queryParams = [];
        let paramIndex = 1;
        if (status && status !== 'all') {
            whereConditions.push(`ph.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (paymentMethod && paymentMethod !== 'all') {
            whereConditions.push(`ph.payment_method = $${paramIndex++}`);
            queryParams.push(paymentMethod);
        }
        if (dateFrom) {
            whereConditions.push(`ph.payment_date >= $${paramIndex++}`);
            queryParams.push(dateFrom);
        }
        if (dateTo) {
            whereConditions.push(`ph.payment_date <= $${paramIndex++}`);
            queryParams.push(dateTo);
        }
        const whereClause = whereConditions.join(' AND ');
        // Получаем платежи
        const paymentsQuery = `
            SELECT 
                ph.id,
                ph.invoice_id as "invoiceId",
                ph.payment_id as "paymentId",
                ph.amount,
                ph.currency,
                ph.payment_method as "paymentMethod",
                ph.payment_date as "paymentDate",
                ph.sender,
                ph.operation_id as "operationId",
                ph.label,
                ph.created_at as "createdAt",
                CASE 
                    WHEN ph.payment_date IS NOT NULL THEN 'success'
                    ELSE 'pending'
                END as status
            FROM payment_history ph
            WHERE ${whereClause}
            ORDER BY ph.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        queryParams.push(limit, offset);
        const paymentsResult = await pool.query(paymentsQuery, queryParams);
        const payments = paymentsResult.rows;
        // Получаем статистику
        const statsQuery = `
            SELECT 
                COUNT(*) as "totalPayments",
                COALESCE(SUM(ph.amount), 0) as "totalAmount",
                COUNT(CASE WHEN ph.payment_date IS NOT NULL THEN 1 END) as "successPayments",
                COUNT(CASE WHEN ph.payment_date IS NULL THEN 1 END) as "pendingPayments",
                COALESCE(AVG(ph.amount), 0) as "averageAmount"
            FROM payment_history ph
            WHERE ${whereConditions.slice(1).join(' AND ')}
        `;
        const statsResult = await pool.query(statsQuery, queryParams.slice(0, -2));
        const stats = statsResult.rows[0];
        // Добавляем количество неудачных платежей (из retry attempts)
        const failedQuery = `
            SELECT COUNT(*) as "failedPayments"
            FROM payment_retry_attempts
            WHERE status = 'failed'
        `;
        const failedResult = await pool.query(failedQuery);
        stats.failedPayments = parseInt(failedResult.rows[0].failedPayments);
        return res.json({
            success: true,
            data: {
                payments,
                stats: {
                    totalPayments: parseInt(stats.totalPayments),
                    totalAmount: parseFloat(stats.totalAmount),
                    successPayments: parseInt(stats.successPayments),
                    failedPayments: parseInt(stats.failedPayments),
                    pendingPayments: parseInt(stats.pendingPayments),
                    averageAmount: parseFloat(stats.averageAmount)
                }
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка получения истории платежей:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Получение детальной информации о платеже
router.get('/:paymentId', authenticateToken, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const user = req.user;
        // Проверяем права доступа
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }
        const result = await pool.query(`
            SELECT 
                ph.*,
                i.participant_name,
                i.school_name,
                i.city,
                i.workshop_date
            FROM payment_history ph
            LEFT JOIN invoices i ON ph.invoice_id = i.id
            WHERE ph.payment_id = $1
        `, [paymentId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }
        return res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('❌ Ошибка получения деталей платежа:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=payments.js.map