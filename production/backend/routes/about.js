/**
 * @file: about.ts
 * @description: Маршруты для управления контентом страницы "О нас"
 * @dependencies: controllers/about.ts, middleware/auth.ts
 * @created: 2024-12-19
 */
import { Router } from 'express';
import { AboutController } from '../controllers/about';
import { authenticateToken, requireRole } from '../middleware/auth';
const router = Router();
// Публичные маршруты (для родителей)
router.get('/content', AboutController.getContent);
router.get('/media', AboutController.getMedia);
// Защищенные маршруты (только для админов)
router.put('/content/:id', authenticateToken, requireRole('admin'), AboutController.updateContent);
router.post('/media', authenticateToken, requireRole('admin'), AboutController.addMedia);
router.put('/media/:id', authenticateToken, requireRole('admin'), AboutController.updateMedia);
router.delete('/media/:id', authenticateToken, requireRole('admin'), AboutController.deleteMedia);
router.post('/media/reorder', authenticateToken, requireRole('admin'), AboutController.reorderMedia);
export default router;
//# sourceMappingURL=about.js.map