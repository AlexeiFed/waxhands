import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getMasterClassEvents, createMasterClassEvent, createMultipleMasterClassEvents, updateMasterClassEvent, deleteMasterClassEvent, updateParticipantPaymentStatus, getMasterClassEventById } from '../controllers/masterClasses.js';
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
router.get('/:id', getMasterClassEventById);
router.put('/:id', authenticateToken, authorizeAdmin, updateMasterClassEvent);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteMasterClassEvent);
// Обновление статуса оплаты участника
router.patch('/:masterClassId/participants/:participantId/payment-status', authenticateToken, authorizeAdmin, updateParticipantPaymentStatus);
// Роуты для мастер-классов (шаблонов) удалены - больше не используются
export default router;
//# sourceMappingURL=masterClasses.js.map