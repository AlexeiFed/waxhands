/**
 * @file: admin.ts
 * @description: Контроллер для административных функций
 * @dependencies: pool, AuthenticatedRequest
 * @created: 2025-01-27
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';

/**
 * Получает список всех возвратов
 */
export const getRefunds = async (req: Request, res: Response): Promise<void> => {
    try {
        // Проверяем права администратора
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен'
            });
            return;
        }

        const result = await pool.query(`
            SELECT 
                i.id,
                i.id as invoice_id,
                i.workshop_date,
                i.updated_at as refund_date,
                u.name as parent_name,
                u.surname as parent_surname,
                i.refund_email,
                i.refund_reason as reason,
                i.amount,
                i.refund_status as status,
                i.refund_request_id,
                s.name as service_name
            FROM invoices i
            LEFT JOIN master_class_events mce ON i.master_class_id = mce.id
            LEFT JOIN users u ON i.participant_id = u.id
            LEFT JOIN services s ON mce.service_id = s.id
            WHERE i.refund_status IS NOT NULL
                AND i.refund_status <> 'none'
            ORDER BY i.updated_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('❌ Ошибка при получении возвратов:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
};
