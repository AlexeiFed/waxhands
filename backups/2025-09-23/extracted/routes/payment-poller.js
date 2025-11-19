/**
 * @file: payment-poller.ts
 * @description: API endpoints для проверки платежей через OAuth2 API ЮMoney
 * @dependencies: paymentChecker, express
 * @created: 2025-01-27
 */
import { Router } from 'express';
import paymentChecker from '../services/paymentChecker.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
/**
 * POST /api/payment-poller/check-all
 * Проверяет все pending счета
 */
router.post('/check-all', authenticateToken, async (req, res) => {
    try {
        // Проверяем права администратора
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }
        console.log('🔍 Ручная проверка всех pending счетов...');
        const result = await paymentChecker.checkAllPendingPayments();
        return res.json({
            success: result.success,
            message: result.message,
            data: {
                checkedInvoices: result.checkedInvoices,
                updatedInvoices: result.updatedInvoices
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка ручной проверки платежей:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка проверки платежей'
        });
    }
});
/**
 * POST /api/payment-poller/check-invoice/:invoiceId
 * Проверяет конкретный счет
 */
router.post('/check-invoice/:invoiceId', authenticateToken, async (req, res) => {
    try {
        const { invoiceId } = req.params;
        if (!invoiceId) {
            return res.status(400).json({
                success: false,
                error: 'ID счета обязателен'
            });
        }
        console.log(`🔍 Ручная проверка счета ${invoiceId}...`);
        const result = await paymentChecker.checkInvoicePayment(invoiceId);
        return res.json({
            success: result.success,
            message: result.message,
            data: {
                checkedInvoices: result.checkedInvoices,
                updatedInvoices: result.updatedInvoices
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка проверки счета:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка проверки счета'
        });
    }
});
/**
 * POST /api/payment-poller/start
 * Запускает автоматическую проверку
 */
router.post('/start', authenticateToken, async (req, res) => {
    try {
        // Проверяем права администратора
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }
        await paymentChecker.startPeriodicCheck();
        return res.json({
            success: true,
            message: 'Автоматическая проверка платежей запущена'
        });
    }
    catch (error) {
        console.error('❌ Ошибка запуска проверки:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка запуска проверки'
        });
    }
});
/**
 * POST /api/payment-poller/stop
 * Останавливает автоматическую проверку
 */
router.post('/stop', authenticateToken, async (req, res) => {
    try {
        // Проверяем права администратора
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }
        paymentChecker.stopPeriodicCheck();
        return res.json({
            success: true,
            message: 'Автоматическая проверка платежей остановлена'
        });
    }
    catch (error) {
        console.error('❌ Ошибка остановки проверки:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка остановки проверки'
        });
    }
});
/**
 * GET /api/payment-poller/status
 * Статус автоматической проверки
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        // Проверяем права администратора
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Требуются права администратора.'
            });
        }
        return res.json({
            success: true,
            message: 'Статус сервиса проверки платежей',
            data: {
                service: 'Payment Checker',
                endpoints: [
                    'POST /api/payment-poller/check-all - Проверить все pending счета',
                    'POST /api/payment-poller/check-invoice/:id - Проверить конкретный счет',
                    'POST /api/payment-poller/start - Запустить автоматическую проверку',
                    'POST /api/payment-poller/stop - Остановить автоматическую проверку'
                ]
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка получения статуса:', error);
        return res.status(500).json({
            success: false,
            error: 'Ошибка получения статуса'
        });
    }
});
export default router;
//# sourceMappingURL=payment-poller.js.map