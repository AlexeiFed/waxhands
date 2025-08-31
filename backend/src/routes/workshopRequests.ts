/**
 * @file: backend/src/routes/workshopRequests.ts
 * @description: Маршруты для API заявок на проведение мастер-классов
 * @dependencies: express, WorkshopRequestsController, auth middleware
 * @created: 2024-12-19
 */

import express, { Request, Response } from 'express';
import { WorkshopRequestsController } from '../controllers/workshopRequests.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

// Расширенный интерфейс Request с пользователем
interface AuthenticatedRequest extends Omit<Request, 'user'> {
    user?: {
        userId: string;
        role: string;
    };
}

const router = express.Router();

// Создание новой заявки (только для родителей)
router.post('/',
    authenticateToken,
    requireRole('parent'),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { school_name, class_group, desired_date, notes } = req.body;
            const parent_id = req.user?.userId;

            if (!parent_id) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не аутентифицирован'
                });
            }

            // Валидация
            if (!school_name || !class_group || !desired_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Необходимо указать школу, класс и желаемую дату'
                });
            }

            // Проверка формата даты
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(desired_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный формат даты. Используйте YYYY-MM-DD'
                });
            }

            const result = await WorkshopRequestsController.createRequest({
                parent_id,
                school_name,
                class_group,
                desired_date,
                notes
            });

            if (result.success) {
                return res.status(201).json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Middleware для предотвращения кэширования
const noCache = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
};

// Получение заявок родителя (для родителей)
router.get('/parent/:parentId',
    authenticateToken,
    requireRole('parent'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { parentId } = req.params;
            const requestingUserId = req.user?.userId;

            // Проверяем, что родитель запрашивает свои заявки
            if (requestingUserId !== parentId) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещен: можно получить только свои заявки'
                });
            }

            console.log('🔍 GET /workshop-requests/parent/:parentId: Запрос от родителя:', {
                parentId,
                requestingUserId,
                role: req.user?.role
            });

            if (!parentId) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан идентификатор родителя'
                });
            }

            const result = await WorkshopRequestsController.getRequestsByParentId(parentId);

            console.log('📡 GET /workshop-requests/parent/:parentId: Результат контроллера:', {
                success: result.success,
                dataLength: result.data?.length || 0,
                error: result.error
            });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ Ошибка при получении заявок родителя:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Получение всех заявок (только для админов)
router.get('/',
    authenticateToken,
    requireRole('admin'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            console.log('🔍 GET /workshop-requests: Запрос от пользователя:', {
                userId: req.user?.userId,
                role: req.user?.role,
                userAgent: req.headers['user-agent']
            });

            const result = await WorkshopRequestsController.getAllRequests();

            console.log('📡 GET /workshop-requests: Результат контроллера:', {
                success: result.success,
                dataLength: result.data?.length || 0,
                error: result.error
            });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ Ошибка при получении заявок:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Получение заявок родителя
router.get('/my',
    authenticateToken,
    requireRole('parent'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const parent_id = req.user?.userId;

            if (!parent_id) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не аутентифицирован'
                });
            }

            const result = await WorkshopRequestsController.getRequestsByParentId(parent_id);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Ошибка при получении заявок родителя:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Получение статистики заявок родителя (для родителей)
router.get('/stats/parent/:parentId',
    authenticateToken,
    requireRole('parent'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { parentId } = req.params;
            const requestingUserId = req.user?.userId;

            // Проверяем, что родитель запрашивает свою статистику
            if (requestingUserId !== parentId) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещен: можно получить только свою статистику'
                });
            }

            console.log('📊 GET /stats/parent/:parentId: Запрос статистики от родителя:', {
                parentId,
                requestingUserId,
                role: req.user?.role
            });

            if (!parentId) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан идентификатор родителя'
                });
            }

            const result = await WorkshopRequestsController.getRequestsStatsByParentId(parentId);

            console.log('📊 GET /stats/parent/:parentId: Результат контроллера:', result);

            if (result.success) {
                console.log('✅ GET /stats/parent/:parentId: Отправляем успешный ответ:', result);
                return res.json(result);
            } else {
                console.error('❌ GET /stats/parent/:parentId: Ошибка контроллера:', result);
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ GET /stats/parent/:parentId: Ошибка при получении статистики родителя:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Получение статистики заявок (только для админов)
router.get('/stats/overview',
    authenticateToken,
    requireRole('admin'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            console.log('📊 GET /stats/overview: Запрос статистики заявок от пользователя:', {
                userId: req.user?.userId,
                role: req.user?.role,
                userAgent: req.headers['user-agent']
            });

            const result = await WorkshopRequestsController.getRequestsStats();
            console.log('📊 GET /stats/overview: Результат контроллера:', result);

            if (result.success) {
                console.log('✅ GET /stats/overview: Отправляем успешный ответ:', result);
                return res.json(result);
            } else {
                console.error('❌ GET /stats/overview: Ошибка контроллера:', result);
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('❌ GET /stats/overview: Ошибка при получении статистики заявок:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Получение заявки по ID
router.get('/:id',
    authenticateToken,
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан идентификатор заявки'
                });
            }

            const request = await WorkshopRequestsController.getRequestById(id);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    error: 'Заявка не найдена'
                });
            }

            // Проверяем права доступа
            if (req.user?.role !== 'admin' && request.parent_id !== req.user?.userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Доступ запрещен'
                });
            }

            return res.json({
                success: true,
                data: request
            });
        } catch (error) {
            console.error('Ошибка при получении заявки:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Обновление статуса заявки (только для админов)
router.patch('/:id/status',
    authenticateToken,
    requireRole('admin'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status, admin_notes } = req.body;
            const admin_id = req.user?.userId;

            // Валидация статуса
            if (status && !['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный статус заявки'
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан идентификатор заявки'
                });
            }

            const result = await WorkshopRequestsController.updateRequestStatus(id, {
                status,
                admin_notes
            });

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса заявки:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

// Удаление заявки (только для админов)
router.delete('/:id',
    authenticateToken,
    requireRole('admin'),
    noCache,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Не указан идентификатор заявки'
                });
            }

            const result = await WorkshopRequestsController.deleteRequest(id);

            if (result.success) {
                return res.json(result);
            } else {
                return res.status(500).json(result);
            }
        } catch (error) {
            console.error('Ошибка при удалении заявки:', error);
            return res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }
);

export default router;
