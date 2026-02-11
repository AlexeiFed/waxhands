/**
 * @file: paymentSettings.ts
 * @description: Маршруты для управления настройками оплаты Robokassa
 * @dependencies: express, auth middleware, paymentSettingsController
 * @created: 2025-11-09
 */

import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getPaymentSettingsController, updatePaymentSettingsController } from '../controllers/paymentSettings.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPaymentSettingsController);
router.post('/', authorizeAdmin, updatePaymentSettingsController);

export default router;








