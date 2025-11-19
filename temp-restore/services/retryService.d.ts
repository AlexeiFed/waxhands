/**
 * @file: retryService.ts
 * @description: Сервис для обработки ошибок и повторных попыток при платежах
 * @dependencies: database connection, notification service
 * @created: 2025-01-26
 */
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
/**
 * Создает запись о неудачной попытке обработки платежа
 */
export declare const createRetryAttempt: (operationId: string, error: string, config?: Partial<RetryConfig>) => Promise<string>;
/**
 * Увеличивает счетчик попыток и обновляет время следующей попытки
 */
export declare const incrementRetryAttempt: (retryId: string, error: string, config?: Partial<RetryConfig>) => Promise<boolean>;
/**
 * Отмечает повторную попытку как неудачную
 */
export declare const markRetryAsFailed: (retryId: string, reason: string) => Promise<void>;
/**
 * Отмечает повторную попытку как успешную
 */
export declare const markRetryAsSuccess: (retryId: string) => Promise<void>;
/**
 * Получает все готовые к повторной попытке операции
 */
export declare const getReadyRetryAttempts: () => Promise<RetryAttempt[]>;
/**
 * Обрабатывает ошибку платежа с созданием записи о повторной попытке
 */
export declare const handlePaymentError: (operationId: string, error: string, userId?: string, invoiceId?: string, config?: Partial<RetryConfig>) => Promise<void>;
/**
 * Очищает старые записи о повторных попытках
 */
export declare const cleanupOldRetryAttempts: (daysOld?: number) => Promise<number>;
//# sourceMappingURL=retryService.d.ts.map