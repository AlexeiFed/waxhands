import { Router } from 'express';
import { authenticateToken, authorizeResourceOwner } from '../middleware/auth.js';
const router = Router();
// TODO: Добавить контроллеры для заказов
// Пока что создаем заглушки для маршрутов
// Получить все заказы (для админов) или заказы пользователя
router.get('/', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Orders endpoint - to be implemented'
    });
});
// Получить заказ по ID
router.get('/:id', authenticateToken, authorizeResourceOwner('user_id'), (req, res) => {
    res.json({
        success: true,
        message: 'Get order by ID - to be implemented'
    });
});
// Создать заказ
router.post('/', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Create order - to be implemented'
    });
});
// Обновить заказ
router.put('/:id', authenticateToken, authorizeResourceOwner('user_id'), (req, res) => {
    res.json({
        success: true,
        message: 'Update order - to be implemented'
    });
});
// Удалить заказ
router.delete('/:id', authenticateToken, authorizeResourceOwner('user_id'), (req, res) => {
    res.json({
        success: true,
        message: 'Delete order - to be implemented'
    });
});
export default router;
//# sourceMappingURL=orders.js.map