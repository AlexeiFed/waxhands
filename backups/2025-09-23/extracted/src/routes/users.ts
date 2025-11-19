import { Router } from 'express';
import { authenticateToken, authorizeAdmin, authorizeParentOrAdmin } from '../middleware/auth.js';
import { getUsers, getUserById, updateUser, deleteUser, createUser, getChildrenByParentId, getCurrentUser } from '../controllers/users.js';

const router = Router();

// Получить информацию о текущем пользователе (для всех аутентифицированных)
router.get('/me', authenticateToken, getCurrentUser);

// Получить всех пользователей (только для админов)
router.get('/', authenticateToken, authorizeAdmin, getUsers);

// Создать нового пользователя (только для админов)
router.post('/', authenticateToken, authorizeAdmin, createUser);

// Получить детей по ID родителя (родители имеют доступ к своим детям)
router.get('/:parentId/children', authenticateToken, authorizeParentOrAdmin, getChildrenByParentId);

// Получить пользователя по ID
router.get('/:id', authenticateToken, getUserById);

// Обновить пользователя
router.put('/:id', authenticateToken, updateUser);

// Удалить пользователя (только для админов)
router.delete('/:id', authenticateToken, authorizeAdmin, deleteUser);

export default router; 