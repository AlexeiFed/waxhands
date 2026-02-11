import { Router } from 'express';
import {
    getAllSchools,
    getSchoolById,
    createSchool,
    updateSchool,
    deleteSchool,
    getSchoolClasses,
    searchSchools,
    toggleSchoolPayment
} from '../controllers/schools.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { db } from '../database/connection.js';

const router = Router();

// Middleware для логирования всех запросов к школам
router.use((req, res, next) => {
    console.log(`📝 Schools route: ${req.method} ${req.path}`, {
        params: req.params,
        body: req.body,
        query: req.query
    });
    next();
});

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
    } catch (error) {
        console.error('Ошибка при получении школ:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить школы'
        });
    }
});

// Эндпоинт для получения уникальных городов из адресов школ
router.get('/cities', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT 
                CASE 
                    WHEN position(',' in address) > 0 
                    THEN trim(substring(address from 1 for position(',' in address) - 1))
                    ELSE address
                END as city
            FROM schools 
            WHERE address IS NOT NULL AND address != ''
            ORDER BY city ASC
        `;

        const result = await db.query(query);
        const cities = result.rows.map(row => row.city).filter(city => city && city.trim() !== '');

        res.json({
            success: true,
            data: cities,
            message: 'Города загружены успешно'
        });
    } catch (error) {
        console.error('Ошибка при получении городов:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить города'
        });
    }
});

// Эндпоинт для получения школ по городу
router.get('/by-city/:city', async (req, res) => {
    try {
        const { city } = req.params;

        const query = `
            SELECT id, name, address, classes
            FROM schools 
            WHERE address LIKE $1
            ORDER BY name ASC
        `;

        const result = await db.query(query, [`${city}%`]);

        res.json({
            success: true,
            data: result.rows,
            message: 'Школы по городу загружены успешно'
        });
    } catch (error) {
        console.error('Ошибка при получении школ по городу:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить школы по городу'
        });
    }
});

// Специфичные маршруты должны быть ДО общих маршрутов с :id
router.get('/:id/classes', getSchoolClasses);
router.patch('/:id/payment', authenticateToken, requireRole('admin'), toggleSchoolPayment);

// Общие маршруты с :id
router.get('/:id', getSchoolById);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireRole('admin'), createSchool);
router.put('/:id', authenticateToken, requireRole('admin'), updateSchool);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteSchool);

export default router; 