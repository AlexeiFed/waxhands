/**
 * @file: admin.ts
 * @description: Маршруты для административных функций
 * @dependencies: express, authenticateToken, adminController
 * @created: 2025-01-27
 */
import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getRefunds } from '../controllers/admin.js';
import { adminRegisterParent } from '../controllers/auth.js';
const router = Router();
// Все маршруты требуют аутентификации
router.use(authenticateToken);
// Получение списка возвратов
router.get('/refunds', getRefunds);
// Регистрация родителя и детей администратором
router.post('/register-parent', authorizeAdmin, adminRegisterParent);
export default router;
//# sourceMappingURL=admin.js.map