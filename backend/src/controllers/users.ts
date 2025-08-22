import { Request, Response } from 'express';
import pool from '../database/connection.js';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔍 getUsers called with query:', req.query);
        const { page = 1, limit, role } = req.query;

        // Если лимит не указан, возвращаем всех пользователей (для администраторов)
        const userLimit = limit ? Number(limit) : undefined;
        const offset = userLimit ? (Number(page) - 1) * userLimit : 0;

        let query = 'SELECT * FROM users';
        let countQuery = 'SELECT COUNT(*) FROM users';
        const params: unknown[] = [];

        if (role) {
            query += ' WHERE role = $1';
            countQuery += ' WHERE role = $1';
            params.push(role);
        }

        // Добавляем лимит только если он указан
        if (userLimit) {
            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(userLimit, offset);
        } else {
            query += ' ORDER BY created_at DESC';
        }

        console.log('📝 Executing query:', query);
        console.log('📝 Executing count query:', countQuery);
        console.log('📝 Query parameters:', params);

        const [usersResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, role ? [role] : [])
        ]);

        console.log('📊 Users result rows:', usersResult.rows.length);
        console.log('📊 Count result:', countResult.rows[0]);

        const users = usersResult.rows.map(user => {
            const { password_hash, ...userWithoutPassword } = user;

            // Преобразуем snake_case в camelCase для фронтенда
            return {
                ...userWithoutPassword,
                age: user.age, // Добавляем поле возраста
                schoolName: user.school_name,
                schoolId: user.school_id,
                class: user.class_group || user.class, // Приоритет class_group
                createdAt: user.created_at,
                updatedAt: user.updated_at
            };
        });

        console.log('✅ Returning users:', users.length);

        res.json({
            success: true,
            data: {
                users,
                total: parseInt(countResult.rows[0].count),
                page: Number(page),
                limit: userLimit || users.length // Если лимит не указан, возвращаем количество полученных записей
            }
        });
    } catch (error) {
        console.error('❌ Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }

        const user = result.rows[0];
        const { password_hash, ...userWithoutPassword } = user;

        // Преобразуем snake_case в camelCase для фронтенда
        const formattedUser = {
            ...userWithoutPassword,
            age: user.age, // Добавляем поле возраста
            schoolName: user.school_name,
            schoolId: user.school_id,
            class: user.class_group || user.class, // Приоритет class_group
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };

        res.json({
            success: true,
            data: formattedUser
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Убираем поля, которые нельзя обновлять
        const { id: userId, role, created_at, updated_at, ...allowedUpdates } = updateData;

        // Если обновляется school_id, получаем название школы
        if (allowedUpdates.school_id) {
            const schoolResult = await pool.query('SELECT name FROM schools WHERE id = $1', [allowedUpdates.school_id]);
            if (schoolResult.rows.length > 0) {
                allowedUpdates.school_name = schoolResult.rows[0].name;
            }
        }

        // Строим динамический запрос
        const fields = Object.keys(allowedUpdates);
        const values = Object.values(allowedUpdates);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

        const result = await pool.query(`
            UPDATE users 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, ...values]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }

        const updatedUser = result.rows[0];
        const { password_hash, ...userWithoutPassword } = updatedUser;

        // Преобразуем snake_case в camelCase для фронтенда
        const formattedUser = {
            ...userWithoutPassword,
            age: updatedUser.age, // Добавляем поле возраста
            schoolName: updatedUser.school_name,
            schoolId: updatedUser.school_id,
            class: updatedUser.class_group || updatedUser.class, // Приоритет class_group
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at
        };

        res.json({
            success: true,
            data: formattedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const getChildrenByParentId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { parentId } = req.params;

        const result = await pool.query(`
            SELECT id, name, surname, age, school_id, school_name, class, class_group, created_at, updated_at
            FROM users 
            WHERE role = 'child' AND parent_id = $1
            ORDER BY name ASC
        `, [parentId]);

        // Преобразуем snake_case в camelCase для фронтенда
        const children = result.rows.map(child => ({
            id: child.id,
            name: child.name,
            surname: child.surname,
            age: child.age,
            schoolId: child.school_id,
            schoolName: child.school_name,
            class: child.class_group || child.class,
            createdAt: child.created_at,
            updatedAt: child.updated_at
        }));

        res.json({
            success: true,
            data: children
        });
    } catch (error) {
        console.error('Error getting children by parent ID:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Получить информацию о текущем пользователе
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }

        const user = result.rows[0];
        const { password_hash, ...userWithoutPassword } = user;

        // Преобразуем snake_case в camelCase для фронтенда
        const formattedUser = {
            ...userWithoutPassword,
            age: user.age,
            schoolName: user.school_name,
            schoolId: user.school_id,
            class: user.class_group || user.class,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };

        res.json({
            success: true,
            data: formattedUser
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData = req.body;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Получаем название школы, если указан schoolId
            let schoolName = null;
            if (userData.schoolId) {
                const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [userData.schoolId]);
                schoolName = schoolResult.rows[0]?.name || null;
            }

            // Создаем пользователя
            const result = await client.query(`
                INSERT INTO users (name, surname, role, phone, email, password_hash, age, school_id, school_name, class, class_group, parent_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `, [
                userData.name,
                userData.surname || null,
                userData.role,
                userData.phone || null,
                userData.email || null,
                userData.password_hash || null,
                userData.age || null,
                userData.school_id || null,
                userData.school_name || null,
                userData.class || null,
                userData.class_group || null,
                userData.parent_id || null
            ]);

            const newUser = result.rows[0];

            await client.query('COMMIT');

            // Преобразуем snake_case в camelCase для фронтенда
            const formattedUser = {
                ...newUser,
                age: newUser.age,
                schoolName: newUser.school_name,
                schoolId: newUser.school_id,
                createdAt: newUser.created_at,
                updatedAt: newUser.updated_at
            };

            res.status(201).json({
                success: true,
                data: formattedUser
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}; 