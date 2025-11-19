import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getMasterClassEvents, createMasterClassEvent, createMultipleMasterClassEvents, updateMasterClassEvent, deleteMasterClassEvent, deleteSchoolMasterClasses, updateParticipantPaymentStatus, getMasterClassEventById, updateParticipantData, markParticipantAsCashPayment } from '../controllers/masterClasses.js';
const router = Router();
// Middleware для логирования всех запросов к мастер-классам
router.use((req, res, next) => {
    console.log(`📝 MasterClasses route: ${req.method} ${req.path}`, {
        body: req.body,
        headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers['authorization'] ? 'Bearer ...' : 'No auth'
        }
    });
    next();
});
// --- Мастер-классы (события) ---
router.get('/', getMasterClassEvents);
router.post('/', authenticateToken, authorizeAdmin, createMasterClassEvent);
router.post('/multiple', authenticateToken, authorizeAdmin, createMultipleMasterClassEvents);
// Удаление всех мастер-классов школы за дату (должно быть ПЕРЕД /:id)
router.delete('/school/:schoolId/date/:date', authenticateToken, authorizeAdmin, deleteSchoolMasterClasses);
router.get('/:id', getMasterClassEventById);
router.put('/:id', authenticateToken, authorizeAdmin, updateMasterClassEvent);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteMasterClassEvent);
// Обновление статуса оплаты участника
router.patch('/:masterClassId/participants/:participantId/payment-status', authenticateToken, authorizeAdmin, updateParticipantPaymentStatus);
// Оплата наличными (для администратора)
router.patch('/:masterClassId/participants/:participantId/cash-payment', authenticateToken, authorizeAdmin, markParticipantAsCashPayment);
// Обновление данных участника (для родителей)
router.patch('/:id/update-participant-data', authenticateToken, updateParticipantData);
// Роуты для мастер-классов (шаблонов) удалены - больше не используются
export default router;
//# sourceMappingURL=masterClasses.js.map