import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';

const router = Router();

// Простой webhook для ЮMoney
router.post('/yumoney', async (req: Request, res: Response) => {
    try {
        console.log('🔔 Webhook от ЮMoney получен:', JSON.stringify(req.body, null, 2));

        res.json({
            success: true,
            message: 'Webhook received successfully'
        } as ApiResponse);

    } catch (error) {
        console.error('❌ Ошибка обработки webhook\'а:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        } as ApiResponse);
    }
});

export default router;

