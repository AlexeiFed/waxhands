/**
 * @file: notificationService.ts
 * @description: Сервис для отправки уведомлений пользователям
 * @dependencies: websocket, database connection
 * @created: 2025-01-26
 */
import { WebSocketManager } from '../websocket-server.js';
export declare const getWebSocketManager: () => WebSocketManager | null;
export declare const setWebSocketManager: (manager: WebSocketManager) => void;
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
export declare const sendWebSocketNotification: (notificationData: NotificationData) => Promise<boolean>;
/**
 * Сохраняет уведомление в базе данных
 */
export declare const saveNotificationToDatabase: (notificationData: NotificationData) => Promise<boolean>;
/**
 * Отправляет уведомление об успешной оплате
 */
export declare const sendPaymentSuccessNotification: (userId: string, invoiceId: string, amount: string, paymentMethod: string) => Promise<void>;
/**
 * Отправляет уведомление о неудачной оплате
 */
export declare const sendPaymentFailedNotification: (userId: string, invoiceId: string, error: string) => Promise<void>;
/**
 * Отправляет уведомление о получении платежа (для администраторов)
 */
export declare const sendPaymentReceivedNotification: (adminUserId: string, invoiceId: string, amount: string, sender: string) => Promise<void>;
/**
 * Получает все уведомления пользователя
 */
export declare const getUserNotifications: (userId: string, limit?: number) => Promise<Record<string, unknown>[]>;
/**
 * Отмечает уведомление как прочитанное
 */
export declare const markNotificationAsRead: (notificationId: string, userId: string) => Promise<boolean>;
/**
 * Отправляет WebSocket уведомление об обновлении статуса счета
 */
export declare const sendInvoiceStatusUpdate: (invoiceId: string, newStatus: string, userId?: string) => Promise<boolean>;
//# sourceMappingURL=notificationService.d.ts.map