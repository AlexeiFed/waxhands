import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { School, PaginationParams, PaginatedResponse } from '../types/index.js';
import { wsManager } from '../websocket-server.js';

export const getAllSchools = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sortBy = 'name', sortOrder = 'asc' } = req.query as unknown as PaginationParams;

        // Получаем общее количество школ
        const countResult = await pool.query('SELECT COUNT(*) FROM schools');
        const total = parseInt(countResult.rows[0].count);

        // Получаем все школы без пагинации
        const result = await pool.query(`
      SELECT * FROM schools 
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
    `);

        const schools = result.rows.map(school => ({
            ...school,
            classes: school.classes || [],
            teacherPhone: school.teacher_phone, // Маппинг для фронтенда
            paymentDisabled: school.payment_disabled || false
        }));

        // Возвращаем структуру, соответствующую ожиданиям frontend
        res.json({
            success: true,
            data: {
                schools: schools,
                total: total
            }
        });

    } catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const getSchoolById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'School not found'
            });
            return;
        }

        const school = result.rows[0];
        school.classes = school.classes || [];
        school.teacherPhone = school.teacher_phone; // Маппинг для фронтенда
        school.paymentDisabled = school.payment_disabled || false;

        res.json({
            success: true,
            data: school
        });

    } catch (error) {
        console.error('Get school error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const createSchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, address, classes, teacher, teacherPhone, notes } = req.body;

        // Проверяем обязательные поля
        if (!name || !address) {
            res.status(400).json({
                success: false,
                error: 'Name and address are required'
            });
            return;
        }

        const result = await pool.query(`
      INSERT INTO schools (name, address, classes, teacher, teacher_phone, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, address, JSON.stringify(classes || []), teacher, teacherPhone, notes]);

        const newSchool = result.rows[0];
        newSchool.classes = newSchool.classes || [];
        newSchool.teacherPhone = newSchool.teacher_phone; // Маппинг для фронтенда
        newSchool.paymentDisabled = newSchool.payment_disabled || false;

        res.status(201).json({
            success: true,
            data: newSchool
        });

    } catch (error) {
        console.error('Create school error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const updateSchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;



        // Убираем поля, которые нельзя обновлять
        const { id: _, created_at, updated_at, ...rawUpdates } = updateData;

        // Маппинг полей фронтенда на поля базы данных
        const fieldMapping: Record<string, string> = {
            'teacherPhone': 'teacher_phone'
        };

        const allowedUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(rawUpdates)) {
            const dbField = fieldMapping[key] || key;
            allowedUpdates[dbField] = value;
        }



        // Обрабатываем classes как JSON
        if (allowedUpdates.classes) {
            allowedUpdates.classes = JSON.stringify(allowedUpdates.classes);
        }

        // Строим динамический запрос
        const fields = Object.keys(allowedUpdates);
        const values = Object.values(allowedUpdates);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');



        const result = await pool.query(`
      UPDATE schools 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, ...values]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'School not found'
            });
            return;
        }

        const updatedSchool = result.rows[0];
        updatedSchool.classes = updatedSchool.classes || [];
        updatedSchool.teacherPhone = updatedSchool.teacher_phone; // Маппинг для фронтенда
        updatedSchool.paymentDisabled = updatedSchool.payment_disabled || false;

        res.json({
            success: true,
            data: updatedSchool
        });

    } catch (error) {
        console.error('Update school error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const deleteSchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Проверяем, есть ли пользователи, связанные с этой школой
        const usersResult = await pool.query('SELECT COUNT(*) FROM users WHERE school_id = $1', [id]);
        const userCount = parseInt(usersResult.rows[0].count);

        if (userCount > 0) {
            res.status(400).json({
                success: false,
                error: `Cannot delete school. There are ${userCount} users associated with this school.`
            });
            return;
        }

        const result = await pool.query('DELETE FROM schools WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'School not found'
            });
            return;
        }

        res.json({
            success: true,
            message: 'School deleted successfully'
        });

    } catch (error) {
        console.error('Delete school error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const getSchoolClasses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT classes FROM schools WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'School not found'
            });
            return;
        }

        const classes = result.rows[0].classes || [];

        res.json({
            success: true,
            data: classes
        });

    } catch (error) {
        console.error('Get school classes error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const searchSchools = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        const searchTerm = `%${q}%`;

        const result = await pool.query(`
      SELECT * FROM schools 
      WHERE name ILIKE $1 OR address ILIKE $1 OR teacher ILIKE $1
      ORDER BY name
    `, [searchTerm]);

        const schools = result.rows.map(school => ({
            ...school,
            classes: school.classes || [],
            paymentDisabled: school.payment_disabled || false
        }));

        res.json({
            success: true,
            data: schools
        });

    } catch (error) {
        console.error('Search schools error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const toggleSchoolPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 toggleSchoolPayment called:', {
            id: req.params.id,
            body: req.body,
            paymentDisabled: req.body?.paymentDisabled,
            type: typeof req.body?.paymentDisabled
        });

        const { id } = req.params;
        const { paymentDisabled } = req.body;

        if (typeof paymentDisabled !== 'boolean') {
            console.error('❌ Invalid paymentDisabled type:', typeof paymentDisabled, paymentDisabled);
            res.status(400).json({
                success: false,
                error: 'paymentDisabled must be a boolean'
            });
            return;
        }

        console.log('✅ Updating school payment:', { id, paymentDisabled });

        const result = await pool.query(`
            UPDATE schools 
            SET payment_disabled = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [paymentDisabled, id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'School not found'
            });
            return;
        }

        const updatedSchool = result.rows[0];
        updatedSchool.classes = updatedSchool.classes || [];
        updatedSchool.teacherPhone = updatedSchool.teacher_phone;
        updatedSchool.paymentDisabled = updatedSchool.payment_disabled || false;

        // Отправляем WebSocket уведомление об изменении оплаты школы
        if (wsManager) {
            wsManager.notifyMasterClassUpdate(id, 'school_payment_changed');
            console.log('📡 WebSocket уведомление отправлено для изменения оплаты школы:', id);
        }

        res.json({
            success: true,
            data: updatedSchool
        });

    } catch (error) {
        console.error('Toggle school payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}; 