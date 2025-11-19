/**
 * @file: invoices.ts
 * @description: Маршруты для API счетов мастер-классов
 * @dependencies: controllers/invoices.ts, middleware/auth.ts
 * @created: 2024-12-19
 */
import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { getInvoices, getInvoiceById, updateInvoice, updateInvoiceStatus, getInvoicesByDate, deleteInvoice, syncAllInvoicesWithParticipants } from '../controllers/invoices.js';
const router = Router();
// Получение списка счетов (требует аутентификации)
router.get('/', authenticateToken, getInvoices);
// Получение счета по ID (требует аутентификации)
router.get('/:id', authenticateToken, getInvoiceById);
// Получение статуса счета по ID (требует аутентификации)
router.get('/:id/status', authenticateToken, getInvoiceById);
// Обновление счета (стили, опции, сумма) (требует аутентификации)
router.patch('/:id', authenticateToken, updateInvoice);
// Обновление статуса счета (требует аутентификации)
router.patch('/:id/status', authenticateToken, updateInvoiceStatus);
// Получение счетов по дате (требует аутентификации)
router.get('/date/:date', authenticateToken, getInvoicesByDate);
// Удаление счета (требует аутентификации, родители могут удалять только свои счета)
router.delete('/:id', (req, res, next) => {
    console.log('🔍 DELETE /invoices/:id route hit:', {
        id: req.params.id,
        method: req.method,
        url: req.url,
        headers: req.headers
    });
    next();
}, authenticateToken, deleteInvoice);
// Синхронизация всех счетов с участниками (требует аутентификации и прав администратора)
router.post('/sync-participants', authenticateToken, authorizeAdmin, syncAllInvoicesWithParticipants);
export default router;
//# sourceMappingURL=invoices.js.map