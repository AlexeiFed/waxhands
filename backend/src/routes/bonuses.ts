/**
 * @file: bonuses.ts
 * @description: API маршруты для управления бонусами
 * @dependencies: express, database/connection, middleware/auth
 * @created: 2025-01-25
 */

import express from 'express';
import { db as pool } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Получить данные о бонусах (доступно всем аутентифицированным пользователям)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM bonuses ORDER BY created_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            // Возвращаем дефолтные данные если нет в БД
            const defaultBonuses = {
                id: 'default',
                title: 'Всем кто будет делать ручку мы подарим билет в Приамурский зоосад, билет в клуб виртуальной реальности Врата',
                media: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return res.json({
                success: true,
                data: defaultBonuses
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при получении данных о бонусах:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Обновить данные о бонусах (только для админов)
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { title, media } = req.body;

        const userId = (req as any).user.id;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать заголовок бонусов'
            });
        }

        // Проверяем, есть ли уже данные о бонусах
        const existingBonuses = await pool.query(
            'SELECT id FROM bonuses ORDER BY created_at DESC LIMIT 1'
        );

        let result;
        if (existingBonuses.rows.length > 0) {
            // Обновляем существующие данные
            result = await pool.query(
                'UPDATE bonuses SET title = $1, media = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
                [title, JSON.stringify(media || []), existingBonuses.rows[0].id]
            );
        } else {
            // Создаем новые данные
            result = await pool.query(
                'INSERT INTO bonuses (title, media, created_by) VALUES ($1, $2, $3) RETURNING *',
                [title, JSON.stringify(media || []), userId]
            );
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении данных о бонусах:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

export default router;
