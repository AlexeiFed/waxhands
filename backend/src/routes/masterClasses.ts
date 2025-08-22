import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getMasterClassEvents, getMasterClassEventById, createMasterClassEvent, updateMasterClassEvent, deleteMasterClassEvent, updateParticipantPaymentStatus } from '../controllers/masterClasses.js';

const router = Router();

// --- Мастер-классы (события) ---
router.get('/', getMasterClassEvents);
router.get('/:id', getMasterClassEventById);
router.post('/', authenticateToken, authorizeAdmin, createMasterClassEvent);
router.put('/:id', authenticateToken, authorizeAdmin, updateMasterClassEvent);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteMasterClassEvent);

// Обновление статуса оплаты участника
router.patch('/:masterClassId/participants/:participantId/payment-status', authenticateToken, authorizeAdmin, updateParticipantPaymentStatus);

// Роуты для мастер-классов (шаблонов) удалены - больше не используются

export default router;