/**
 * @file: invoices.ts
 * @description: Маршруты для API счетов мастер-классов
 * @dependencies: controllers/invoices.ts, middleware/auth.ts
 * @created: 2024-12-19
 */

import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus,
    getInvoicesByDate,
    deleteInvoice,
    syncAllInvoicesWithParticipants
} from '../controllers/invoices.js';

const router = Router();

// Получение списка счетов (требует аутентификации)
router.get('/', authenticateToken, getInvoices);

// Получение счета по ID (требует аутентификации)
router.get('/:id', authenticateToken, getInvoiceById);

// Обновление статуса счета (требует аутентификации)
router.patch('/:id/status', authenticateToken, updateInvoiceStatus);

// Получение счетов по дате (требует аутентификации)
router.get('/date/:date', authenticateToken, getInvoicesByDate);

// Удаление счета (требует аутентификации и прав администратора)
router.delete('/:id', authenticateToken, authorizeAdmin, deleteInvoice);

// Синхронизация всех счетов с участниками (требует аутентификации и прав администратора)
router.post('/sync-participants', authenticateToken, authorizeAdmin, syncAllInvoicesWithParticipants);

export default router;
