/**
 * @file: offers.ts
 * @description: API маршруты для управления офертами
 * @dependencies: express, Offer, CreateOfferRequest, UpdateOfferRequest
 * @created: 2024-12-19
 */
import express from 'express';
import { db as pool } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
const router = express.Router();
// Получить текущую активную оферту
router.get('/current', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM offers WHERE is_active = true ORDER BY created_at DESC LIMIT 1');
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Активная оферта не найдена'
            });
        }
        return res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Ошибка при получении текущей оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Получить все оферты (публичный доступ)
router.get('/', async (req, res) => {
    try {
        const { is_active, version, created_by } = req.query;
        let query = 'SELECT * FROM offers WHERE 1=1';
        const params = [];
        let paramCount = 1;
        if (is_active !== undefined) {
            query += ` AND is_active = $${paramCount}`;
            params.push(is_active);
            paramCount++;
        }
        if (version) {
            query += ` AND version = $${paramCount}`;
            params.push(version);
            paramCount++;
        }
        if (created_by) {
            query += ` AND created_by = $${paramCount}`;
            params.push(created_by);
            paramCount++;
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        return res.json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Ошибка при получении оферт:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Создать новую оферту (только для админа)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { title, content, version } = req.body;
        const userId = req.user.id;
        if (!title || !content || !version) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать название, содержимое и версию оферты'
            });
        }
        // Проверяем, существует ли уже оферта с такой версией
        const existingOffer = await pool.query('SELECT id FROM offers WHERE version = $1', [version]);
        if (existingOffer.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Оферта с такой версией уже существует'
            });
        }
        const result = await pool.query('INSERT INTO offers (title, content, version, created_by) VALUES ($1, $2, $3, $4) RETURNING *', [title, content, version, userId]);
        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Ошибка при создании оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Обновить оферту (только для админа)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, version } = req.body;
        // Проверяем, существует ли оферта
        const existingOffer = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
        if (existingOffer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Оферта не найдена'
            });
        }
        // Если меняется версия, проверяем уникальность
        if (version && version !== existingOffer.rows[0].version) {
            const versionCheck = await pool.query('SELECT id FROM offers WHERE version = $1 AND id != $2', [version, id]);
            if (versionCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Оферта с такой версией уже существует'
                });
            }
        }
        const updateFields = [];
        const params = [];
        let paramCount = 1;
        if (title) {
            updateFields.push(`title = $${paramCount}`);
            params.push(title);
            paramCount++;
        }
        if (content) {
            updateFields.push(`content = $${paramCount}`);
            params.push(content);
            paramCount++;
        }
        if (version) {
            updateFields.push(`version = $${paramCount}`);
            params.push(version);
            paramCount++;
        }
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        const result = await pool.query(`UPDATE offers SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`, [...params, id]);
        return res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Ошибка при обновлении оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Активировать оферту (только для админа)
router.patch('/:id/activate', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Проверяем, существует ли оферта
        const existingOffer = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
        if (existingOffer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Оферта не найдена'
            });
        }
        // Деактивируем все остальные оферты
        await pool.query('UPDATE offers SET is_active = false, updated_at = CURRENT_TIMESTAMP');
        // Активируем выбранную оферту
        const result = await pool.query('UPDATE offers SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
        return res.json({
            success: true,
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Ошибка при активации оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
// Удалить оферту (только для админа)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Проверяем, существует ли оферта
        const existingOffer = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
        if (existingOffer.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Оферта не найдена'
            });
        }
        // Нельзя удалить активную оферту
        if (existingOffer.rows[0].is_active) {
            return res.status(400).json({
                success: false,
                error: 'Нельзя удалить активную оферту. Сначала активируйте другую оферту'
            });
        }
        await pool.query('DELETE FROM offers WHERE id = $1', [id]);
        return res.json({
            success: true,
            message: 'Оферта успешно удалена'
        });
    }
    catch (error) {
        console.error('Ошибка при удалении оферты:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});
export default router;
//# sourceMappingURL=offers.js.map