/**
 * @file: payment.ts
 * @description: Универсальные маршруты для работы с платежными системами
 * @dependencies: paymentController.ts, authMiddleware.ts
 * @created: 2025-10-16
 */

import { Router } from 'express';
import {
    createPaymentLink,
    handlePaymentWebhook,
    handleSuccessRedirect,
    handleFailRedirect,
    checkRefundAvailability,
    getProviderInfo
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Информация о текущем провайдере (публичный эндпоинт)
router.get('/provider/info', getProviderInfo);

// Создание ссылки на оплату (требует аутентификации)
router.post('/invoices/:invoiceId/pay', authenticateToken, createPaymentLink);

// Обработка уведомлений от платежных систем (не требует аутентификации)
router.post('/webhook', handlePaymentWebhook);
router.get('/webhook', handlePaymentWebhook);

// Обработка возвратов пользователя (не требует аутентификации)
router.get('/success', handleSuccessRedirect);
router.get('/fail', handleFailRedirect);

// Проверка возможности возврата (требует аутентификации)
router.get('/invoices/:invoiceId/refund/check', authenticateToken, checkRefundAvailability);

export default router;


