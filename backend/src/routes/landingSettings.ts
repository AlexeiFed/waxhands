/**
 * @file: landingSettings.ts
 * @description: Маршруты для управления настройками лендинга
 * @dependencies: express, auth middleware, landingSettingsController
 * @created: 2026-01-19
 */

import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getLandingSettingsController, updateLandingSettingsController } from '../controllers/landingSettings.js';

const router = Router();

// Публичный доступ для получения настроек (для лендинга)
router.get('/public', getLandingSettingsController);

// Защищенные маршруты для админа
router.use(authenticateToken);
router.get('/', getLandingSettingsController);
router.post('/', authorizeAdmin, updateLandingSettingsController);

export default router;

