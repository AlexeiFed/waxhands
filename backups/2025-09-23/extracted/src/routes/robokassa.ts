/**
 * @file: robokassa.ts
 * @description: Маршруты для интеграции с Robokassa
 * @dependencies: robokassaController.ts, authMiddleware.ts
 * @created: 2025-01-26
 */

import { Router } from 'express';
import {
    createPaymentLink,
    createIframePaymentData,
    handleResultNotification,
    handleSuccessRedirect,
    handleFailRedirect,
    handleJWSNotification,
    createRefund,
    getRefundStatus,
    checkRefundAvailability,
    initiateRefund
} from '../controllers/robokassaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Создание ссылки на оплату (требует аутентификации)
router.post('/invoices/:invoiceId/pay', authenticateToken, createPaymentLink);

// Создание данных для iframe оплаты (требует аутентификации)
router.post('/invoices/:invoiceId/pay/iframe', authenticateToken, createIframePaymentData);

// Обработка уведомлений от Robokassa (не требует аутентификации)
router.post('/payment-webhook/robokassa', handleResultNotification);
router.post('/payment-webhook/robokassa/jws', handleJWSNotification);

// Обработка возвратов пользователя (не требует аутентификации)
router.get('/payment/success', handleSuccessRedirect);
router.get('/payment/fail', handleFailRedirect);

// Возврат средств (требует аутентификации)
router.post('/invoices/:invoiceId/refund', authenticateToken, createRefund);

// Статус возврата (требует аутентификации)
router.get('/refunds/:requestId/status', authenticateToken, getRefundStatus);

// Проверка возможности возврата (требует аутентификации)
router.get('/invoices/:invoiceId/refund/check', authenticateToken, checkRefundAvailability);

// Инициирование возврата (требует аутентификации)
router.post('/invoices/:invoiceId/refund/initiate', authenticateToken, initiateRefund);

export default router;
