/**
 * @file: robokassa-sync.ts
 * @description: Endpoint для синхронизации статусов счетов с Robokassa
 * @dependencies: express, robokassaService, database
 * @created: 2025-11-12
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { robokassaService } from '../services/robokassaService.js';
import pool from '../database/connection.js';
import { wsManager } from '../websocket-server.js';
import { UserRole } from '../types/index.js';

const router = Router();

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
 * Проверка и синхронизация статусов неоплаченных счетов с Robokassa
 */
router.post('/sync-pending-invoices', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Проверяем права администратора
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }

        console.log('🔄 Начинаем синхронизацию статусов счетов с Robokassa...');

        // Получаем все неоплаченные счета с robokassa_invoice_id
        const pendingInvoicesResult = await pool.query(`
            SELECT id, robokassa_invoice_id, amount, participant_id, participant_name, 
                   master_class_id, created_at
            FROM invoices 
            WHERE status = 'pending' 
              AND robokassa_invoice_id IS NOT NULL 
              AND robokassa_invoice_id != ''
            ORDER BY created_at DESC
            LIMIT 100
        `);

        const pendingInvoices = pendingInvoicesResult.rows;
        console.log(`📊 Найдено неоплаченных счетов для проверки: ${pendingInvoices.length}`);

        const results = {
            checked: 0,
            updated: 0,
            failed: 0,
            updatedInvoices: [] as any[]
        };

        // Проверяем каждый счет
        for (const invoice of pendingInvoices) {
            try {
                results.checked++;

                const robokassaId = parseInt(invoice.robokassa_invoice_id);
                if (isNaN(robokassaId)) {
                    console.log(`⚠️ Неверный Robokassa ID для счета ${invoice.id}: ${invoice.robokassa_invoice_id}`);
                    results.failed++;
                    continue;
                }

                // Проверяем статус в Robokassa
                console.log(`🔍 Проверка счета ${invoice.id} (Robokassa ID: ${robokassaId})`);
                const statusResult = await robokassaService.checkOperationStatus(robokassaId);

                // Статус 100 = успешный платеж
                if (statusResult.success && statusResult.status === 100) {
                    console.log(`✅ Счет ${invoice.id} оплачен в Robokassa, обновляем статус...`);

                    // Обновляем статус счета
                    await pool.query(`
                        UPDATE invoices 
                        SET status = 'paid',
                            payment_status = 'paid',
                            payment_id = $1,
                            payment_method = 'card',
                            payment_date = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, [invoice.robokassa_invoice_id, invoice.id]);

                    // Синхронизируем с участниками мастер-класса
                    if (invoice.master_class_id && invoice.participant_id) {
                        const mcResult = await pool.query(
                            'SELECT participants FROM master_class_events WHERE id = $1',
                            [invoice.master_class_id]
                        );

                        if (mcResult.rows.length > 0) {
                            let participants = mcResult.rows[0].participants || [];
                            participants = participants.map((p: any) => {
                                if (p.id === invoice.participant_id) {
                                    return { ...p, isPaid: true };
                                }
                                return p;
                            });

                            await pool.query(
                                'UPDATE master_class_events SET participants = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                                [JSON.stringify(participants), invoice.master_class_id]
                            );
                        }
                    }

                    // Отправляем WebSocket уведомления
                    if (wsManager && invoice.participant_id) {
                        wsManager.notifyInvoiceUpdate(invoice.id, invoice.participant_id, 'paid', invoice.master_class_id);
                        if (invoice.master_class_id) {
                            wsManager.notifyMasterClassUpdate(invoice.master_class_id, 'payment_status_updated');
                        }
                    }

                    results.updated++;
                    results.updatedInvoices.push({
                        id: invoice.id,
                        participant_name: invoice.participant_name,
                        amount: invoice.amount,
                        robokassa_id: invoice.robokassa_invoice_id
                    });

                    console.log(`✅ Счет ${invoice.id} успешно обновлен`);
                } else {
                    console.log(`ℹ️ Счет ${invoice.id} еще не оплачен (статус: ${statusResult.status})`);
                }

                // Небольшая задержка между запросами к Robokassa API
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error: any) {
                console.error(`❌ Ошибка проверки счета ${invoice.id}:`, error.message);
                results.failed++;
            }
        }

        console.log('✅ Синхронизация завершена:', results);

        res.json({
            success: true,
            message: 'Синхронизация завершена',
            results: {
                checked: results.checked,
                updated: results.updated,
                failed: results.failed,
                updatedInvoices: results.updatedInvoices
            }
        });

    } catch (error: any) {
        console.error('❌ Ошибка синхронизации:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при синхронизации статусов счетов'
        });
    }
});

export default router;

