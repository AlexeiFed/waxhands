/**
 * @file: retryService.ts
 * @description: Сервис для обработки ошибок и повторных попыток при платежах
 * @dependencies: database connection, notification service
 * @created: 2025-01-26
 */

import pool from '../database/connection.js';
import { sendPaymentFailedNotification } from './notificationService.js';

export interface RetryAttempt {
    id: string;
    operationId: string;
    attempt: number;
    maxAttempts: number;
    lastError: string;
    nextRetryAt: Date;
    createdAt: Date;
}

export interface RetryConfig {
    maxAttempts: number;
    retryDelayMs: number;
    exponentialBackoff: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    retryDelayMs: 5000, // 5 секунд
    exponentialBackoff: true
};

/**
 * Создает запись о неудачной попытке обработки платежа
 */
export const createRetryAttempt = async (
    operationId: string,
    error: string,
    config: Partial<RetryConfig> = {}
): Promise<string> => {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    try {
        const result = await pool.query(
            `INSERT INTO payment_retry_attempts (
                operation_id, attempt, max_attempts, last_error, 
                next_retry_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id`,
            [
                operationId,
                1,
                retryConfig.maxAttempts,
                error,
                new Date(Date.now() + retryConfig.retryDelayMs)
            ]
        );

        const retryId = result.rows[0].id;
        console.log(`🔄 Создана запись о повторной попытке ${retryId} для операции ${operationId}`);

        return retryId;
    } catch (dbError) {
        console.error('❌ Ошибка создания записи о повторной попытке:', dbError);
        throw dbError;
    }
};

/**
 * Увеличивает счетчик попыток и обновляет время следующей попытки
 */
export const incrementRetryAttempt = async (
    retryId: string,
    error: string,
    config: Partial<RetryConfig> = {}
): Promise<boolean> => {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    try {
        const result = await pool.query(
            `SELECT attempt, max_attempts FROM payment_retry_attempts WHERE id = $1`,
            [retryId]
        );

        if (result.rows.length === 0) {
            console.error(`❌ Запись о повторной попытке ${retryId} не найдена`);
            return false;
        }

        const currentAttempt = result.rows[0].attempt;
        const maxAttempts = result.rows[0].max_attempts;

        if (currentAttempt >= maxAttempts) {
            console.log(`❌ Достигнут лимит попыток для ${retryId}`);
            await markRetryAsFailed(retryId, 'Max attempts reached');
            return false;
        }

        // Вычисляем время следующей попытки
        let nextRetryDelay = retryConfig.retryDelayMs;
        if (retryConfig.exponentialBackoff) {
            nextRetryDelay = retryConfig.retryDelayMs * Math.pow(2, currentAttempt);
        }

        const nextRetryAt = new Date(Date.now() + nextRetryDelay);

        await pool.query(
            `UPDATE payment_retry_attempts 
             SET attempt = $1, last_error = $2, next_retry_at = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [currentAttempt + 1, error, nextRetryAt, retryId]
        );

        console.log(`🔄 Увеличена попытка ${retryId} до ${currentAttempt + 1}, следующая попытка в ${nextRetryAt}`);
        return true;

    } catch (dbError) {
        console.error('❌ Ошибка увеличения попытки:', dbError);
        return false;
    }
};

/**
 * Отмечает повторную попытку как неудачную
 */
export const markRetryAsFailed = async (retryId: string, reason: string): Promise<void> => {
    try {
        await pool.query(
            `UPDATE payment_retry_attempts 
             SET status = 'failed', failure_reason = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [reason, retryId]
        );

        console.log(`❌ Повторная попытка ${retryId} отмечена как неудачная: ${reason}`);
    } catch (dbError) {
        console.error('❌ Ошибка отметки повторной попытки как неудачной:', dbError);
    }
};

/**
 * Отмечает повторную попытку как успешную
 */
export const markRetryAsSuccess = async (retryId: string): Promise<void> => {
    try {
        await pool.query(
            `UPDATE payment_retry_attempts 
             SET status = 'success', updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [retryId]
        );

        console.log(`✅ Повторная попытка ${retryId} отмечена как успешная`);
    } catch (dbError) {
        console.error('❌ Ошибка отметки повторной попытки как успешной:', dbError);
    }
};

/**
 * Получает все готовые к повторной попытке операции
 */
export const getReadyRetryAttempts = async (): Promise<RetryAttempt[]> => {
    try {
        const result = await pool.query(
            `SELECT * FROM payment_retry_attempts 
             WHERE status = 'pending' 
             AND next_retry_at <= CURRENT_TIMESTAMP
             AND attempt < max_attempts
             ORDER BY next_retry_at ASC`
        );

        return result.rows.map(row => ({
            id: row.id,
            operationId: row.operation_id,
            attempt: row.attempt,
            maxAttempts: row.max_attempts,
            lastError: row.last_error,
            nextRetryAt: new Date(row.next_retry_at),
            createdAt: new Date(row.created_at)
        }));
    } catch (dbError) {
        console.error('❌ Ошибка получения готовых к повторной попытке операций:', dbError);
        return [];
    }
};

/**
 * Обрабатывает ошибку платежа с созданием записи о повторной попытке
 */
export const handlePaymentError = async (
    operationId: string,
    error: string,
    userId?: string,
    invoiceId?: string,
    config: Partial<RetryConfig> = {}
): Promise<void> => {
    try {
        // Создаем запись о повторной попытке
        const retryId = await createRetryAttempt(operationId, error, config);

        // Отправляем уведомление пользователю если есть userId
        if (userId && invoiceId) {
            await sendPaymentFailedNotification(userId, invoiceId, error);
        }

        console.log(`🔄 Ошибка платежа ${operationId} обработана, создана запись о повторной попытке ${retryId}`);

    } catch (retryError) {
        console.error('❌ Критическая ошибка при обработке ошибки платежа:', retryError);

        // В крайнем случае пытаемся отправить уведомление
        if (userId && invoiceId) {
            try {
                await sendPaymentFailedNotification(userId, invoiceId, 'Системная ошибка при обработке платежа');
            } catch (notifyError) {
                console.error('❌ Не удалось отправить уведомление об ошибке:', notifyError);
            }
        }
    }
};

/**
 * Очищает старые записи о повторных попытках
 */
export const cleanupOldRetryAttempts = async (daysOld: number = 30): Promise<number> => {
    try {
        const result = await pool.query(
            `DELETE FROM payment_retry_attempts 
             WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
             AND status IN ('success', 'failed')`
        );

        const deletedCount = result.rowCount || 0;
        console.log(`🧹 Удалено ${deletedCount} старых записей о повторных попытках`);

        return deletedCount;
    } catch (dbError) {
        console.error('❌ Ошибка очистки старых записей о повторных попытках:', dbError);
        return 0;
    }
};

