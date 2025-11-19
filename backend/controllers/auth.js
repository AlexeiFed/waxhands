import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/connection.js';
// Функция нормализации телефона - приводит к формату без + и пробелов
const normalizePhone = (phone) => {
    if (!phone)
        return '';
    // Убираем все символы кроме цифр
    return phone.replace(/\D/g, '');
};
export const login = async (req, res) => {
    try {
        const credentials = req.body;
        // Очищаем пробелы из полей логина и приводим к нижнему регистру
        if (credentials.name)
            credentials.name = credentials.name.trim();
        if (credentials.surname)
            credentials.surname = credentials.surname.trim().toLowerCase();
        if (credentials.phone) {
            credentials.phone = credentials.phone.trim();
            // Нормализуем телефон для поиска
            credentials.phone = normalizePhone(credentials.phone);
        }
        if (credentials.role === 'admin') {
            // Логика для администратора - проверяем в базе данных
            const adminQuery = 'SELECT * FROM users WHERE role = \'admin\' AND name = $1';
            const adminResult = await pool.query(adminQuery, [credentials.name]);
            const adminUser = adminResult.rows[0];
            if (!adminUser) {
                res.status(401).json({
                    success: false,
                    error: 'Администратор не найден',
                    details: 'Проверьте правильность имени администратора'
                });
                return;
            }
            // Проверяем пароль
            if (adminUser.password_hash && credentials.password) {
                const isValidPassword = await bcrypt.compare(credentials.password, adminUser.password_hash);
                if (!isValidPassword) {
                    res.status(401).json({
                        success: false,
                        error: 'Неверный пароль администратора',
                        details: 'Проверьте правильность введенного пароля'
                    });
                    return;
                }
            }
            // Создаем JWT токен для администратора
            const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
            const jwtOptions = { expiresIn: '7d' };
            const token = jwt.sign({ userId: adminUser.id, role: adminUser.role }, jwtSecret, jwtOptions);
            res.json({
                success: true,
                data: {
                    user: adminUser,
                    token
                }
            });
            return;
        }
        // Логика для остальных ролей
        let query = '';
        let params = [];
        if (credentials.role === 'child') {
            // Для детей ищем только по имени и фамилии
            // Убираем проверку по школе и классу - дети могут быть в разных школах
            query = `
        SELECT * FROM users 
        WHERE role = 'child' 
        AND name = $1 
        AND surname = $2
      `;
            params = [
                credentials.name || '',
                credentials.surname || ''
            ];
        }
        else {
            // Для родителей и исполнителей ищем по фамилии и телефону
            // Корректная обработка NULL значений для phone
            if (credentials.phone) {
                // Ищем по нормализованному телефону (убираем все символы кроме цифр)
                // Сравниваем фамилию без учета регистра (LOWER)
                query = `SELECT * FROM users 
                         WHERE role = $1 
                         AND LOWER(TRIM(surname)) = $2 
                         AND regexp_replace(TRIM(phone), '[^0-9]', '', 'g') = $3`;
                params = [credentials.role, credentials.surname || '', credentials.phone];
                // Детальное логирование для отладки
                console.log('🔍 Login attempt:', {
                    role: credentials.role,
                    surname: credentials.surname,
                    surname_original: req.body.surname,
                    phone_original: req.body.phone,
                    phone_normalized: credentials.phone,
                    query_params: params
                });
            }
            else {
                query = 'SELECT * FROM users WHERE role = $1 AND LOWER(TRIM(surname)) = $2 AND (phone IS NULL OR phone = \'\')';
                params = [credentials.role, credentials.surname || ''];
            }
        }
        const result = await pool.query(query, params);
        const user = result.rows[0];
        // Логируем результат поиска
        console.log('📊 Query result:', {
            found: !!user,
            userId: user?.id,
            userName: user?.name,
            userSurname: user?.surname
        });
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Пользователь не найден',
                details: `Проверьте правильность введенных данных: роль "${credentials.role}", фамилия "${credentials.surname}", ${credentials.phone ? `телефон "${credentials.phone}"` : 'телефон не указан'}`
            });
            return;
        }
        // Проверяем пароль для пользователей с паролем
        if (user.password_hash && credentials.password) {
            const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    error: 'Неверный пароль',
                    details: 'Проверьте правильность введенного пароля'
                });
                return;
            }
        }
        // Создаем JWT токен
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        const jwtOptions = { expiresIn: '7d' };
        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, jwtOptions);
        // Убираем пароль из ответа
        const { password_hash, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при авторизации',
            details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : 'Попробуйте позже'
        });
    }
};
// Регистрация родителя и детей администратором (без токена JWT)
export const adminRegisterParent = async (req, res) => {
    try {
        const userData = req.body;
        // Нормализуем данные перед регистрацией
        if (userData.name)
            userData.name = userData.name.trim();
        if (userData.surname)
            userData.surname = userData.surname.trim();
        if (userData.phone)
            userData.phone = userData.phone.trim();
        // Проверяем уникальность телефона с нормализацией
        if (userData.phone) {
            const normalizedPhone = normalizePhone(userData.phone);
            const existingUser = await pool.query('SELECT id, name, surname FROM users WHERE regexp_replace(TRIM(phone), \'[^0-9]\', \'\', \'g\') = $1', [normalizedPhone]);
            if (existingUser.rows.length > 0) {
                console.log('⚠️ Duplicate phone found:', {
                    attemptedPhone: userData.phone,
                    normalizedPhone: normalizedPhone,
                    existingUser: existingUser.rows[0]
                });
                res.status(400).json({
                    success: false,
                    error: 'User with this phone number already exists',
                    details: existingUser.rows[0]
                });
                return;
            }
        }
        // Начинаем транзакцию
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            if (!userData.children || userData.children.length === 0) {
                await client.query('ROLLBACK');
                res.status(400).json({
                    success: false,
                    error: 'Children data is required'
                });
                return;
            }
            // Нормализуем данные детей
            userData.children.forEach(child => {
                if (child.name)
                    child.name = child.name.trim();
                if (child.surname)
                    child.surname = child.surname.trim();
            });
            // Получаем школу первого ребенка для родителя
            const firstChild = userData.children[0];
            const parentSchoolId = firstChild.schoolId || null;
            let parentSchoolName = null;
            if (parentSchoolId) {
                try {
                    const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [parentSchoolId]);
                    parentSchoolName = schoolResult.rows[0]?.name || null;
                }
                catch (error) {
                    console.log('School not found for id:', parentSchoolId);
                }
            }
            // 1. Создаем родителя со школой первого ребенка
            const parentResult = await client.query(`
                INSERT INTO users (name, surname, phone, role, school_id, school_name, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userData.name, userData.surname, userData.phone, 'parent', parentSchoolId, parentSchoolName]);
            const parent = parentResult.rows[0];
            const parentId = parent.id;
            console.log('✅ Родитель создан админом:', {
                parentId,
                name: parent.name,
                surname: parent.surname,
                phone: parent.phone
            });
            // 2. Создаем детей
            const childrenUsers = [];
            for (const childData of userData.children) {
                // Проверяем уникальность для каждого ребенка только по имени и фамилии
                const existingChild = await client.query(`
                    SELECT id FROM users 
                    WHERE role = 'child' 
                    AND name = $1 
                    AND surname = $2
                `, [childData.name, childData.surname]);
                if (existingChild.rows.length > 0) {
                    await client.query('ROLLBACK');
                    res.status(400).json({
                        success: false,
                        error: `Child ${childData.name} ${childData.surname} already exists`
                    });
                    return;
                }
                // Получаем название школы
                let schoolName = null;
                if (childData.schoolId) {
                    try {
                        const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [childData.schoolId]);
                        schoolName = schoolResult.rows[0]?.name || null;
                    }
                    catch (error) {
                        console.log('School not found for id:', childData.schoolId);
                    }
                }
                // Создаем ребенка
                const childResult = await client.query(`
                    INSERT INTO users (name, surname, age, role, school_id, school_name, class, class_group, parent_id, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `, [
                    childData.name,
                    childData.surname,
                    childData.age || null,
                    'child',
                    childData.schoolId,
                    schoolName,
                    childData.class,
                    childData.class,
                    parentId
                ]);
                childrenUsers.push(childResult.rows[0]);
                console.log('✅ Ребенок создан:', {
                    childId: childResult.rows[0].id,
                    name: childData.name,
                    surname: childData.surname,
                    school: schoolName,
                    class: childData.class
                });
            }
            await client.query('COMMIT');
            // Формируем ответ с данными родителя и детей (БЕЗ токена JWT)
            const responseUser = {
                ...parent,
                children: childrenUsers
            };
            res.status(201).json({
                success: true,
                data: {
                    parent: responseUser,
                    children: childrenUsers
                },
                message: 'Parent and children registered successfully by admin'
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('❌ Admin register parent error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
export const register = async (req, res) => {
    try {
        const userData = req.body;
        // Нормализуем данные перед регистрацией
        if (userData.name)
            userData.name = userData.name.trim();
        if (userData.surname)
            userData.surname = userData.surname.trim();
        if (userData.phone)
            userData.phone = userData.phone.trim();
        if (userData.email)
            userData.email = userData.email.trim().toLowerCase();
        // Проверяем уникальность телефона с нормализацией
        if (userData.phone) {
            const normalizedPhone = normalizePhone(userData.phone);
            const existingUser = await pool.query('SELECT id, name, surname FROM users WHERE regexp_replace(TRIM(phone), \'[^0-9]\', \'\', \'g\') = $1', [normalizedPhone]);
            if (existingUser.rows.length > 0) {
                console.log('⚠️ Duplicate phone found:', {
                    attemptedPhone: userData.phone,
                    normalizedPhone: normalizedPhone,
                    existingUser: existingUser.rows[0]
                });
                res.status(400).json({
                    success: false,
                    error: 'User with this phone number already exists'
                });
                return;
            }
        }
        // Начинаем транзакцию
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            if (userData.role === 'parent' && userData.children && userData.children.length > 0) {
                // Семейная регистрация: создаем родителя и детей
                // Нормализуем данные детей
                userData.children.forEach(child => {
                    if (child.name)
                        child.name = child.name.trim();
                    if (child.surname)
                        child.surname = child.surname.trim();
                });
                // Получаем школу первого ребенка для родителя
                const firstChild = userData.children[0];
                const parentSchoolId = firstChild.schoolId || null;
                let parentSchoolName = null;
                if (parentSchoolId) {
                    try {
                        const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [parentSchoolId]);
                        parentSchoolName = schoolResult.rows[0]?.name || null;
                    }
                    catch (error) {
                        console.log('School not found for id:', parentSchoolId);
                    }
                }
                // 1. Создаем родителя со школой первого ребенка
                const parentResult = await client.query(`
                    INSERT INTO users (name, surname, phone, role, school_id, school_name, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `, [userData.name, userData.surname, userData.phone, 'parent', parentSchoolId, parentSchoolName]);
                const parent = parentResult.rows[0];
                const parentId = parent.id;
                // 2. Создаем детей
                const childrenUsers = [];
                for (const childData of userData.children) {
                    // Проверяем уникальность для каждого ребенка только по имени и фамилии
                    // Убираем проверку по школе и классу - дети могут быть в разных школах
                    const existingChild = await client.query(`
                        SELECT id FROM users 
                        WHERE role = 'child' 
                        AND name = $1 
                        AND surname = $2
                    `, [childData.name, childData.surname]);
                    if (existingChild.rows.length > 0) {
                        await client.query('ROLLBACK');
                        res.status(400).json({
                            success: false,
                            error: `Child ${childData.name} ${childData.surname} already exists`
                        });
                        return;
                    }
                    // Получаем название школы
                    let schoolName = null;
                    if (childData.schoolId) {
                        try {
                            const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [childData.schoolId]);
                            schoolName = schoolResult.rows[0]?.name || null;
                        }
                        catch (error) {
                            console.log('School not found for id:', childData.schoolId);
                        }
                    }
                    // Создаем ребенка
                    const childResult = await client.query(`
                        INSERT INTO users (name, surname, age, role, school_id, school_name, class, class_group, parent_id, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        RETURNING *
                    `, [
                        childData.name,
                        childData.surname,
                        childData.age || null, // Добавляем возраст
                        'child',
                        childData.schoolId,
                        schoolName,
                        childData.class,
                        childData.class,
                        parentId
                    ]);
                    childrenUsers.push(childResult.rows[0]);
                }
                // 3. Создаем JWT токен для родителя
                const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
                const jwtOptions = { expiresIn: '7d' };
                const token = jwt.sign({ userId: parent.id, role: parent.role }, jwtSecret, jwtOptions);
                // 4. Формируем ответ с данными родителя и детей
                const responseUser = {
                    ...parent,
                    children: childrenUsers
                };
                res.status(201).json({
                    success: true,
                    data: {
                        user: responseUser,
                        token
                    }
                });
            }
            else if (userData.role === 'child') {
                // Регистрация одного ребенка
                // Проверяем уникальность для ребенка только по имени и фамилии
                // Убираем проверку по школе и классу - ребенок может быть в любой школе
                const existingChild = await client.query(`
                    SELECT id FROM users 
                    WHERE role = 'child' 
                    AND name = $1 
                    AND surname = $2
                `, [userData.name, userData.surname]);
                if (existingChild.rows.length > 0) {
                    await client.query('ROLLBACK');
                    res.status(400).json({
                        success: false,
                        error: 'Child with these details already exists'
                    });
                    return;
                }
                // Получаем название школы
                let schoolName = null;
                if (userData.schoolId) {
                    try {
                        const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [userData.schoolId]);
                        schoolName = schoolResult.rows[0]?.name || null;
                    }
                    catch (error) {
                        console.log('School not found for id:', userData.schoolId);
                    }
                }
                // Создаем ребенка
                const result = await client.query(`
                    INSERT INTO users (name, surname, age, role, school_id, school_name, class, class_group, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `, [
                    userData.name,
                    userData.surname,
                    userData.age || null, // Добавляем возраст
                    'child',
                    userData.schoolId,
                    schoolName,
                    userData.class,
                    userData.class
                ]);
                const newUser = result.rows[0];
                // Создаем JWT токен
                const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
                const jwtOptions = { expiresIn: '7d' };
                const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, jwtOptions);
                res.status(201).json({
                    success: true,
                    data: {
                        user: newUser,
                        token
                    }
                });
            }
            else {
                // Обычная регистрация для других ролей
                let passwordHash = null;
                if (userData.password) {
                    passwordHash = await bcrypt.hash(userData.password, 12);
                }
                // Получаем название школы
                let schoolName = null;
                if (userData.schoolId) {
                    try {
                        const schoolResult = await client.query('SELECT name FROM schools WHERE id = $1', [userData.schoolId]);
                        schoolName = schoolResult.rows[0]?.name || null;
                    }
                    catch (error) {
                        console.log('School not found for id:', userData.schoolId);
                    }
                }
                // Создаем пользователя
                const result = await client.query(`
                    INSERT INTO users (name, surname, role, phone, email, password_hash, school_id, school_name, class, class_group, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING *
                `, [
                    userData.name || null,
                    userData.surname || null,
                    userData.role,
                    userData.phone || null,
                    userData.email || null,
                    passwordHash,
                    userData.schoolId || null,
                    schoolName,
                    userData.class || null,
                    userData.class || null
                ]);
                const newUser = result.rows[0];
                // Создаем JWT токен
                const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
                const jwtOptions = { expiresIn: '7d' };
                const token = jwt.sign({ userId: newUser.id, role: newUser.role }, jwtSecret, jwtOptions);
                res.status(201).json({
                    success: true,
                    data: {
                        user: newUser,
                        token
                    }
                });
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        console.error('Registration data:', JSON.stringify(req.body, null, 2));
        // Более детальная информация об ошибке
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
    }
};
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        // Специальная обработка для администратора
        if (userRole === 'admin' && userId === '00000000-0000-0000-0000-000000000001') {
            const adminUser = {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Администратор',
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            res.json({
                success: true,
                data: adminUser
            });
            return;
        }
        // Для остальных пользователей ищем в базе данных
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
            class: user.class_group || user.class, // Приоритет class_group
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            surname: user.surname,
            phone: user.phone
        };
        res.json({
            success: true,
            data: formattedUser
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const updateData = req.body;
        // Убираем поля, которые нельзя обновлять
        const { id, role, created_at, updated_at, ...allowedUpdates } = updateData;
        // Хешируем пароль если он обновляется
        if (allowedUpdates.password) {
            allowedUpdates.password_hash = await bcrypt.hash(allowedUpdates.password, 12);
            delete allowedUpdates.password;
        }
        // Если обновляется school_id, получаем название школы
        if (allowedUpdates.school_id) {
            const schoolResult = await pool.query('SELECT name FROM schools WHERE id = $1', [allowedUpdates.school_id]);
            if (schoolResult.rows.length > 0) {
                allowedUpdates.school_name = schoolResult.rows[0].name;
                console.log('🏫 Updated school_name to:', allowedUpdates.school_name);
            }
            else {
                console.log('⚠️ School not found for ID:', allowedUpdates.school_id);
            }
        }
        // Если обновляется class, также обновляем class_group
        if (allowedUpdates.class) {
            allowedUpdates.class_group = allowedUpdates.class;
            console.log('📚 Updated class_group to:', allowedUpdates.class_group);
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
    `, [userId, ...values]);
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
            age: updatedUser.age,
            schoolName: updatedUser.school_name,
            schoolId: updatedUser.school_id,
            class: updatedUser.class_group || updatedUser.class, // Приоритет class_group
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at,
            surname: updatedUser.surname,
            phone: updatedUser.phone
        };
        res.json({
            success: true,
            data: formattedUser
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
//# sourceMappingURL=auth.js.map