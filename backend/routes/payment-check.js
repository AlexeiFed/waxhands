/**
 * @file: payment-check.ts
 * @description: API маршруты для проверки статуса платежей через OAuth2 API ЮMoney
 * @dependencies: Router, yumoneyOAuthService, authenticateToken
 * @created: 2025-01-26
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import yumoneyOAuthService from '../services/yumoneyOAuthService.js';
import pool from '../database/connection.js';
const router = Router();
// Проверка статуса платежа по метке (для всех авторизованных пользователей)
router.get('/status/:label', authenticateToken, async (req, res) => {
    try {
        const { label } = req.params;
        if (!label) {
            return res.status(400).json({
                success: false,
                error: 'Label parameter is required'
            });
        }
        console.log(`🔍 Проверяем статус платежа по метке: ${label}`);
        const paymentInfo = await yumoneyOAuthService.checkPaymentByLabel(label);
        if (paymentInfo) {
            console.log(`✅ Платеж найден: ${paymentInfo.operation_id}, статус: ${paymentInfo.status}`);
            return res.json({
                success: true,
                data: paymentInfo
            });
        }
        else {
            console.log(`⚠️ Платеж по метке ${label} не найден`);
            return res.json({
                success: false,
                message: 'Payment not found',
                data: null
            });
        }
    }
    catch (error) {
        console.error('❌ Ошибка проверки статуса платежа:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Проверка статуса платежа по operation_id (для всех авторизованных пользователей)
router.get('/operation/:operationId', authenticateToken, async (req, res) => {
    try {
        const { operationId } = req.params;
        if (!operationId) {
            return res.status(400).json({
                success: false,
                error: 'Operation ID parameter is required'
            });
        }
        console.log(`🔍 Проверяем статус платежа по operation_id: ${operationId}`);
        const paymentInfo = await yumoneyOAuthService.getPaymentInfo(operationId);
        if (paymentInfo) {
            console.log(`✅ Платеж найден: ${paymentInfo.operation_id}, статус: ${paymentInfo.status}`);
            return res.json({
                success: true,
                data: paymentInfo
            });
        }
        else {
            console.log(`⚠️ Платеж по operation_id ${operationId} не найден`);
            return res.json({
                success: false,
                message: 'Payment not found',
                data: null
            });
        }
    }
    catch (error) {
        console.error('❌ Ошибка проверки статуса платежа:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Создание платежной формы для счета (для всех авторизованных пользователей)
router.post('/create-form', authenticateToken, async (req, res) => {
    try {
        const { invoiceId, amount, description } = req.body;
        if (!invoiceId || !amount || !description) {
            return res.status(400).json({
                success: false,
                error: 'invoiceId, amount, and description are required'
            });
        }
        console.log(`🔧 Создаем платежную форму для счета: ${invoiceId}`);
        // Получаем label из БД перед созданием формы
        const labelResult = await pool.query('SELECT payment_label FROM invoices WHERE id = $1', [invoiceId]);
        let existingLabel = '';
        if (labelResult.rows.length > 0 && labelResult.rows[0].payment_label) {
            existingLabel = labelResult.rows[0].payment_label;
            console.log(`🏷️ Найден существующий label: ${existingLabel}`);
        }
        const paymentFormUrl = await yumoneyOAuthService.createPaymentForm(invoiceId, amount, description);
        console.log(`✅ Платежная форма создана для счета ${invoiceId}`);
        return res.json({
            success: true,
            data: {
                paymentFormUrl,
                invoiceId,
                amount,
                description,
                payment_label: existingLabel
            }
        });
    }
    catch (error) {
        console.error('❌ Ошибка создания платежной формы:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Проверка здоровья API ЮMoney (только для админов)
router.get('/health', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin role required.'
            });
        }
        console.log('🏥 Проверяем здоровье API ЮMoney...');
        const isHealthy = await yumoneyOAuthService.checkApiHealth();
        if (isHealthy) {
            console.log('✅ API ЮMoney работает');
            return res.json({
                success: true,
                data: {
                    status: 'healthy',
                    message: 'YuMoney API is working correctly'
                }
            });
        }
        else {
            console.log('❌ API ЮMoney недоступен');
            return res.json({
                success: false,
                data: {
                    status: 'unhealthy',
                    message: 'YuMoney API is not accessible'
                }
            });
        }
    }
    catch (error) {
        console.error('❌ Ошибка проверки здоровья API ЮMoney:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=payment-check.js.map