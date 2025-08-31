/**
 * @file: notificationService.ts
 * @description: Сервис для отправки уведомлений пользователям
 * @dependencies: websocket, database connection
 * @created: 2025-01-26
 */

import pool from '../database/connection.js';
import { WebSocketManager } from '../websocket-server.js';

// Глобальный экземпляр WebSocket менеджера
let webSocketManager: WebSocketManager | null = null;

// Функция для получения экземпляра WebSocket менеджера
export const getWebSocketManager = (): WebSocketManager | null => {
    return webSocketManager;
};

// Функция для установки экземпляра WebSocket менеджера
export const setWebSocketManager = (manager: WebSocketManager): void => {
    webSocketManager = manager;
};

export interface NotificationData {
    userId: string;
    type: 'payment_success' | 'payment_failed' | 'payment_received';
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

/**
 * Отправляет уведомление пользователю через WebSocket
 */
export const sendWebSocketNotification = async (notificationData: NotificationData): Promise<boolean> => {
    try {
        const manager = getWebSocketManager();
        if (manager) {
            // Отправляем уведомление через WebSocket
            const message = {
                type: 'notification',
                data: notificationData,
                timestamp: new Date().toISOString()
            };

            // Отправляем всем подключенным клиентам или конкретному пользователю
            if (notificationData.userId) {
                manager.sendToUsers([notificationData.userId], {
                    type: 'notification',
                    data: notificationData as unknown as Record<string, unknown>,
                    timestamp: Date.now()
                });
            } else {
                manager.broadcastEvent({
                    type: 'notification',
                    data: notificationData as unknown as Record<string, unknown>,
                    timestamp: Date.now()
                });
            }

            console.log(`📨 WebSocket уведомление отправлено для пользователя ${notificationData.userId}: ${notificationData.title}`);
            return true;
        } else {
            // Fallback: логируем уведомление если WebSocket недоступен
            console.log(`📨 Уведомление для пользователя ${notificationData.userId}: ${notificationData.title} (WebSocket недоступен)`);
            return true;
        }
    } catch (error) {
        console.error('❌ Ошибка отправки WebSocket уведомления:', error);
        return false;
    }
};

/**
 * Сохраняет уведомление в базе данных
 */
export const saveNotificationToDatabase = async (notificationData: NotificationData): Promise<boolean> => {
    try {
        await pool.query(
            `INSERT INTO user_notifications (
                user_id, type, title, message, data, created_at, read
            ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, false)`,
            [
                notificationData.userId,
                notificationData.type,
                notificationData.title,
                notificationData.message,
                JSON.stringify(notificationData.data || {})
            ]
        );

        console.log(`✅ Уведомление сохранено в БД для пользователя ${notificationData.userId}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения уведомления в БД:', error);
        return false;
    }
};

/**
 * Отправляет уведомление об успешной оплате
 */
export const sendPaymentSuccessNotification = async (
    userId: string,
    invoiceId: string,
    amount: string,
    paymentMethod: string
): Promise<void> => {
    const notificationData: NotificationData = {
        userId,
        type: 'payment_success',
        title: 'Оплата прошла успешно!',
        message: `Ваш платеж на сумму ${amount} руб. успешно обработан.`,
        data: {
            invoiceId,
            amount,
            paymentMethod,
            timestamp: new Date().toISOString()
        }
    };

    // Отправляем через WebSocket
    await sendWebSocketNotification(notificationData);

    // Сохраняем в БД
    await saveNotificationToDatabase(notificationData);
};

/**
 * Отправляет уведомление о неудачной оплате
 */
export const sendPaymentFailedNotification = async (
    userId: string,
    invoiceId: string,
    error: string
): Promise<void> => {
    const notificationData: NotificationData = {
        userId,
        type: 'payment_failed',
        title: 'Ошибка оплаты',
        message: `К сожалению, произошла ошибка при обработке платежа: ${error}`,
        data: {
            invoiceId,
            error,
            timestamp: new Date().toISOString()
        }
    };

    await sendWebSocketNotification(notificationData);
    await saveNotificationToDatabase(notificationData);
};

/**
 * Отправляет уведомление о получении платежа (для администраторов)
 */
export const sendPaymentReceivedNotification = async (
    adminUserId: string,
    invoiceId: string,
    amount: string,
    sender: string
): Promise<void> => {
    const notificationData: NotificationData = {
        userId: adminUserId,
        type: 'payment_received',
        title: 'Получен новый платеж',
        message: `Получен платеж на сумму ${amount} руб. от ${sender}`,
        data: {
            invoiceId,
            amount,
            sender,
            timestamp: new Date().toISOString()
        }
    };

    await sendWebSocketNotification(notificationData);
    await saveNotificationToDatabase(notificationData);
};

/**
 * Получает все уведомления пользователя
 */
export const getUserNotifications = async (userId: string, limit: number = 50): Promise<Record<string, unknown>[]> => {
    try {
        const result = await pool.query(
            `SELECT * FROM user_notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );

        return result.rows;
    } catch (error) {
        console.error('❌ Ошибка получения уведомлений:', error);
        return [];
    }
};

/**
 * Отмечает уведомление как прочитанное
 */
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
    try {
        await pool.query(
            'UPDATE user_notifications SET read = true WHERE id = $1 AND user_id = $2',
            [notificationId, userId]
        );

        return true;
    } catch (error) {
        console.error('❌ Ошибка отметки уведомления как прочитанного:', error);
        return false;
    }
};

/**
 * Отправляет WebSocket уведомление об обновлении статуса счета
 */
export const sendInvoiceStatusUpdate = async (
    invoiceId: string,
    newStatus: string,
    userId?: string
): Promise<boolean> => {
    try {
        const manager = getWebSocketManager();
        if (manager) {
            const message = {
                type: 'invoice_update',
                data: {
                    invoiceId,
                    status: newStatus,
                    timestamp: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            };

            // Отправляем всем подключенным клиентам
            manager.broadcastEvent({
                type: 'invoice_update',
                data: {
                    invoiceId,
                    status: newStatus,
                    timestamp: new Date().toISOString()
                },
                timestamp: Date.now()
            });

            console.log(`📨 WebSocket уведомление об обновлении статуса счета ${invoiceId}: ${newStatus}`);
            return true;
        } else {
            console.log(`📨 Уведомление об обновлении статуса счета ${invoiceId}: ${newStatus} (WebSocket недоступен)`);
            return true;
        }
    } catch (error) {
        console.error('❌ Ошибка отправки уведомления об обновлении статуса счета:', error);
        return false;
    }
};
