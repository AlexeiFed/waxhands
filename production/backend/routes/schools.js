import { Router } from 'express';
import { getAllSchools, getSchoolById, createSchool, updateSchool, deleteSchool, getSchoolClasses, searchSchools } from '../controllers/schools.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { db } from '../database/connection.js';
const router = Router();
// Публичные маршруты
router.get('/', getAllSchools);
router.get('/search', searchSchools);
// Новый маршрут для получения школ с адресами для фильтрации
router.get('/with-addresses', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const query = `
            SELECT id, name, address, classes
            FROM schools 
            ORDER BY name ASC
        `;
        const result = await db.query(query);
        res.json({
            success: true,
            data: result.rows,
            message: 'Школы загружены успешно'
        });
    }
    catch (error) {
        console.error('Ошибка при получении школ:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить школы'
        });
    }
});
router.get('/:id', getSchoolById);
router.get('/:id/classes', getSchoolClasses);
// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireRole('admin'), createSchool);
router.put('/:id', authenticateToken, requireRole('admin'), updateSchool);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteSchool);
export default router;
//# sourceMappingURL=schools.js.map