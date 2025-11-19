import { Router } from 'express';
const router = Router();
// Простой webhook для ЮMoney
router.post('/yumoney', async (req, res) => {
    try {
        console.log('🔔 Webhook от ЮMoney получен:', JSON.stringify(req.body, null, 2));
        res.json({
            success: true,
            message: 'Webhook received successfully'
        });
    }
    catch (error) {
        console.error('❌ Ошибка обработки webhook\'а:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=payment-webhook-simple.js.map