/**
 * @file: contacts.ts
 * @description: API маршруты для управления контактными данными
 * @dependencies: express, database/connection, middleware/auth
 * @created: 2025-01-13
 */

import express from 'express';
import { db as pool } from '../database/connection.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Получить контактные данные (доступно всем аутентифицированным пользователям)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM contacts ORDER BY created_at DESC LIMIT 1'
        );

        if (result.rows.length === 0) {
            // Возвращаем дефолтные данные если нет в БД
            const defaultContacts = {
                id: 'default',
                company_name: 'Студия МК «Восковые ручки»',
                legal_status: 'самозанятый',
                inn: '272210695289',
                phone: '8914-545-06-06',
                email: 'pavelt80@mail.ru',
                address: '',
                website: 'waxhands.ru',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            return res.json({
                success: true,
                data: defaultContacts
            });
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при получении контактных данных:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Обновить контактные данные (только для админов)
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const {
            company_name,
            legal_status,
            inn,
            phone,
            email,
            address,
            website
        } = req.body;

        const userId = (req as any).user.id;

        if (!company_name || !legal_status || !inn || !phone || !email) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо указать все обязательные поля: название компании, правовой статус, ИНН, телефон и email'
            });
        }

        // Проверяем, есть ли уже контактные данные
        const existingContacts = await pool.query(
            'SELECT id FROM contacts ORDER BY created_at DESC LIMIT 1'
        );

        let result;
        if (existingContacts.rows.length > 0) {
            // Обновляем существующие данные
            result = await pool.query(
                'UPDATE contacts SET company_name = $1, legal_status = $2, inn = $3, phone = $4, email = $5, address = $6, website = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
                [company_name, legal_status, inn, phone, email, address || '', website || '', existingContacts.rows[0].id]
            );
        } else {
            // Создаем новые данные
            result = await pool.query(
                'INSERT INTO contacts (company_name, legal_status, inn, phone, email, address, website, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [company_name, legal_status, inn, phone, email, address || '', website || '', userId]
            );
        }

        return res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении контактных данных:', error);
        return res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

export default router;
