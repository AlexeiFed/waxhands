import { Request, Response } from 'express';
import pool from '../database/connection.js';
import bcrypt from 'bcryptjs';

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

        // Загружаем всех пользователей с их связями
        const usersWithRelations = await Promise.all(usersResult.rows.map(async user => {
            const { password_hash, ...userWithoutPassword } = user;

            let children: any[] = [];
            let parent: any = null;

            // Если это родитель, загружаем его детей
            if (user.role === 'parent') {
                try {
                    const childrenResult = await pool.query(`
                        SELECT id, name, surname, age, school_id, school_name, class, class_group, created_at, updated_at
                        FROM users 
                        WHERE role = 'child' AND parent_id = $1
                        ORDER BY name ASC
                    `, [user.id]);

                    children = childrenResult.rows.map(child => ({
                        id: child.id,
                        name: child.name,
                        surname: child.surname,
                        age: child.age,
                        schoolId: child.school_id,
                        schoolName: child.school_name,
                        class: child.class_group || child.class,
                        role: 'child',
                        parentId: user.id,
                        createdAt: child.created_at,
                        updatedAt: child.updated_at
                    }));
                } catch (error) {
                    console.error('Error loading children for parent:', user.id, error);
                }
            }

            // Если это ребенок, загружаем его родителя
            if (user.role === 'child' && user.parent_id) {
                try {
                    const parentResult = await pool.query(`
                        SELECT id, name, surname, email, phone, role, created_at, updated_at
                        FROM users 
                        WHERE id = $1
                    `, [user.parent_id]);

                    if (parentResult.rows.length > 0) {
                        const parentData = parentResult.rows[0];
                        parent = {
                            id: parentData.id,
                            name: parentData.name,
                            surname: parentData.surname,
                            email: parentData.email,
                            phone: parentData.phone,
                            role: parentData.role,
                            createdAt: parentData.created_at,
                            updatedAt: parentData.updated_at
                        };
                    }
                } catch (error) {
                    console.error('Error loading parent for child:', user.id, error);
                }
            }

            // Преобразуем snake_case в camelCase для фронтенда
            return {
                ...userWithoutPassword,
                age: user.age, // Добавляем поле возраста
                schoolName: user.school_name,
                schoolId: user.school_id,
                class: user.class_group || user.class, // Приоритет class_group
                parentId: user.parent_id,
                children: children,
                parent: parent,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            };
        }));

        console.log('✅ Returning users with relations:', usersWithRelations.length);

        res.json({
            success: true,
            data: {
                users: usersWithRelations,
                total: parseInt(countResult.rows[0].count),
                page: Number(page),
                limit: userLimit || usersWithRelations.length // Если лимит не указан, возвращаем количество полученных записей
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

        // Преобразуем camelCase поля в snake_case для базы данных
        const transformedUpdates: Record<string, unknown> = {};

        if (allowedUpdates.schoolId !== undefined) {
            transformedUpdates.school_id = allowedUpdates.schoolId;
            // Получаем название школы
            const schoolResult = await pool.query('SELECT name FROM schools WHERE id = $1', [allowedUpdates.schoolId]);
            if (schoolResult.rows.length > 0) {
                transformedUpdates.school_name = schoolResult.rows[0].name;
            }
        }

        if (allowedUpdates.class !== undefined) {
            transformedUpdates.class_group = allowedUpdates.class;
        }

        // Добавляем остальные поля
        if (allowedUpdates.name !== undefined) transformedUpdates.name = allowedUpdates.name;
        if (allowedUpdates.surname !== undefined) transformedUpdates.surname = allowedUpdates.surname;
        if (allowedUpdates.age !== undefined) transformedUpdates.age = allowedUpdates.age;
        if (allowedUpdates.email !== undefined) transformedUpdates.email = allowedUpdates.email;
        if (allowedUpdates.phone !== undefined) transformedUpdates.phone = allowedUpdates.phone;

        // Строим динамический запрос
        const fields = Object.keys(transformedUpdates);
        const values = Object.values(transformedUpdates);
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
        const userRole = (req as any).user?.role;
        const userId = (req as any).user?.userId;

        // Если это родитель, проверяем, что он удаляет своего ребенка
        if (userRole === 'parent') {
            const childCheck = await pool.query(
                'SELECT id FROM users WHERE id = $1 AND parent_id = $2',
                [id, userId]
            );

            if (childCheck.rows.length === 0) {
                res.status(403).json({
                    success: false,
                    error: 'You can only delete your own children'
                });
                return;
            }
        }

        // Удаляем связанные счета перед удалением пользователя
        const deleteInvoicesResult = await pool.query(
            'DELETE FROM invoices WHERE participant_id = $1 RETURNING id',
            [id]
        );

        if (deleteInvoicesResult.rowCount && deleteInvoicesResult.rowCount > 0) {
            console.log('✅ Удалены счета для пользователя:', deleteInvoicesResult.rows.map((r: Record<string, unknown>) => r.id));
        }

        // Удаляем пользователя
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
            const schoolId = userData.schoolId || userData.school_id;
            if (schoolId) {
                const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [schoolId]);
                schoolName = schoolResult.rows[0]?.name || null;
            }

            // Хешируем пароль, если он передан
            let passwordHash = null;
            if (userData.password) {
                passwordHash = await bcrypt.hash(userData.password, 12);
            } else if (userData.password_hash) {
                passwordHash = userData.password_hash;
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
                passwordHash,
                userData.age || null,
                userData.schoolId || userData.school_id || null,
                schoolName, // Используем полученное schoolName из базы данных
                userData.class || null,
                userData.class_group || null,
                userData.parentId || userData.parent_id || null
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