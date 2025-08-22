/**
 * @file: backend/src/routes/chat.ts
 * @description: Маршруты для API чата между пользователями и администраторами
 * @dependencies: ChatController, auth middleware
 * @created: 2024-12-19
 */
import { Router } from 'express';
import { ChatController } from '../controllers/chat';
import { authenticateToken } from '../middleware/auth';
const router = Router();
// Создать новый чат (только для пользователей)
router.post('/create', authenticateToken, ChatController.createChat);
// Получить чаты пользователя
router.get('/user/:userId', authenticateToken, ChatController.getUserChats);
// Получить все чаты (только для администраторов)
router.get('/admin/all', authenticateToken, (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Доступ запрещен' });
        return;
    }
    next();
}, ChatController.getAllChats);
// Получить сообщения чата
router.get('/:chatId/messages', authenticateToken, ChatController.getChatMessages);
// Отправить сообщение
router.post('/send', authenticateToken, ChatController.sendMessage);
// Отметить сообщения как прочитанные
router.post('/mark-read', authenticateToken, ChatController.markAsRead);
// Отметить конкретное сообщение как прочитанное
router.post('/message/read', authenticateToken, ChatController.markMessageAsRead);
// Обновить статус чата (только для администраторов)
router.put('/status', authenticateToken, (req, res, next) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Доступ запрещен' });
        return;
    }
    next();
}, ChatController.updateChatStatus);
// Получить количество непрочитанных сообщений
router.get('/user/:userId/unread', authenticateToken, ChatController.getUnreadCount);
export default router;
//# sourceMappingURL=chat.js.map