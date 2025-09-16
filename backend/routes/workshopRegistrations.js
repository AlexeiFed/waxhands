/**
 * @file: workshopRegistrations.ts
 * @description: Маршруты для API записи на мастер-классы
 * @dependencies: workshopRegistrations controller, auth middleware
 * @created: 2024-12-19
 */
import { Router } from 'express';
import { getWorkshopRegistrations, getUserWorkshopRegistrations, createWorkshopRegistration, createGroupWorkshopRegistration, updateRegistrationStatus, getWorkshopStats, removeParticipant, checkRegistration } from '../controllers/workshopRegistrations.js';
import { authenticateToken } from '../middleware/auth.js';
const router = Router();
// Получить записи пользователя на мастер-классы (требует аутентификации)
router.get('/user/:userId', authenticateToken, getUserWorkshopRegistrations);
// Получить записи на мастер-класс (требует аутентификации)
router.get('/:workshopId', authenticateToken, getWorkshopRegistrations);
// Проверить существующую регистрацию (требует аутентификации)
router.post('/check', authenticateToken, checkRegistration);
// Создать новую запись на мастер-класс (требует аутентификации)
router.post('/', authenticateToken, createWorkshopRegistration);
// Создать групповую регистрацию на мастер-класс (несколько детей, один счет)
router.post('/group', authenticateToken, createGroupWorkshopRegistration);
// Обновить статус записи (требует аутентификации)
router.patch('/:id/status', authenticateToken, updateRegistrationStatus);
// Удалить участника из мастер-класса (требует аутентификации)
router.post('/remove-participant', authenticateToken, removeParticipant);
// Получить статистику по мастер-классу (требует аутентификации)
router.get('/:workshopId/stats', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const stats = await getWorkshopStats(workshopId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting workshop stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
export default router;
//# sourceMappingURL=workshopRegistrations.js.map