import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { wsManager } from '../websocket-server.js';

// Тестовая функция для проверки компиляции
export const testFunction = async (req: Request, res: Response): Promise<void> => {
    res.json({ success: true, message: 'Test function works' });
};

// Удалено - таблица master_classes больше не используется

// Удалено - таблица master_classes больше не используется

// Удалено - таблица master_classes больше не используется

// Удалено - таблица master_classes больше не используется

// Удалено - таблица master_classes больше не используется

// --- Новые обработчики для событий мастер-классов ---
export const getMasterClassEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { schoolId, classGroup, date, userId } = req.query;

        let query: string;
        let countQuery: string;
        let params: (string | number)[] = [];
        let userSchoolId: string | null = null;
        let userClassGroup: string | null = null;

        // Если передан userId, определяем роль пользователя
        if (userId) {
            // Получаем роль пользователя
            const userQuery = `
                SELECT role, school_id, COALESCE(class_group, class) as class_group 
                FROM users 
                WHERE id = $1
            `;
            const userResult = await pool.query(userQuery, [userId]);

            if (userResult.rows.length > 0) {
                const userRole = userResult.rows[0].role;
                userSchoolId = userResult.rows[0].school_id;
                userClassGroup = userResult.rows[0].class_group;

                console.log('User filter:', { userId, userRole, userSchoolId, userClassGroup });

                if (userRole === 'parent') {
                    // Для родителя: показываем только будущие мастер-классы с точным совпадением школы и класса его детей
                    query = `
                        SELECT DISTINCT mce.*, 
                               s.name as school_name,
                               srv.name as service_name,
                               s.address as school_address
                        FROM master_class_events mce
                        LEFT JOIN schools s ON mce.school_id = s.id
                        LEFT JOIN services srv ON mce.service_id = srv.id
                        WHERE mce.date >= CURRENT_DATE
                          AND EXISTS (
                              SELECT 1 FROM users u 
                              WHERE u.parent_id = $1 
                                AND u.school_id = mce.school_id 
                                AND COALESCE(u.class_group, u.class) = mce.class_group
                          )
                        ORDER BY mce.date ASC, mce.time ASC
                    `;
                    countQuery = `
                        SELECT COUNT(DISTINCT mce.id) 
                        FROM master_class_events mce
                        WHERE mce.date >= CURRENT_DATE
                          AND EXISTS (
                              SELECT 1 FROM users u 
                              WHERE u.parent_id = $1 
                                AND u.school_id = mce.school_id 
                                AND COALESCE(u.class_group, u.class) = mce.class_group
                          )
                    `;
                    params = [userId as string];
                } else if (userRole === 'child') {
                    // Для детей: строгая фильтрация по школе и классу
                    if (userSchoolId && userClassGroup) {
                        query = `
                            SELECT mce.*, 
                                   s.name as school_name,
                                   srv.name as service_name,
                                   s.address as school_address
                            FROM master_class_events mce
                            LEFT JOIN schools s ON mce.school_id = s.id
                            LEFT JOIN services srv ON mce.service_id = srv.id
                            WHERE mce.date >= CURRENT_DATE
                              AND mce.school_id = $1 
                              AND mce.class_group = $2
                            ORDER BY mce.date ASC, mce.time ASC
                        `;
                        countQuery = `
                            SELECT COUNT(*) 
                            FROM master_class_events mce
                            WHERE mce.date >= CURRENT_DATE
                              AND mce.school_id = $1 
                              AND mce.class_group = $2
                        `;
                        params = [userSchoolId, userClassGroup];
                    } else {
                        // Если нет данных о школе или классе, показываем все будущие мастер-классы
                        console.log('Недостаточно данных для фильтрации: school_id =', userSchoolId, 'class_group =', userClassGroup);
                        query = `
                            SELECT mce.*, 
                                   s.name as school_name,
                                   srv.name as service_name,
                                   s.address as school_address
                            FROM master_class_events mce
                            LEFT JOIN schools s ON mce.school_id = s.id
                            LEFT JOIN services srv ON mce.service_id = srv.id
                            WHERE mce.date >= CURRENT_DATE
                            ORDER BY mce.date ASC, mce.time ASC
                        `;
                        countQuery = `
                            SELECT COUNT(*) 
                            FROM master_class_events mce
                            WHERE mce.date >= CURRENT_DATE
                        `;
                        params = [];
                    }
                } else {
                    // Для других ролей (admin, executor) - показываем все мастер-классы
                    query = `
                        SELECT mce.*, 
                               s.name as school_name,
                               srv.name as service_name,
                               s.address as school_address
                        FROM master_class_events mce
                        LEFT JOIN schools s ON mce.school_id = s.id
                        LEFT JOIN services srv ON mce.service_id = srv.id
                        ORDER BY mce.date ASC, mce.time ASC
                    `;
                    countQuery = `SELECT COUNT(*) FROM master_class_events mce`;
                    params = [];
                }
            } else {
                // Если пользователь не найден, показываем все мастер-классы
                query = `
                    SELECT mce.*, 
                           s.name as school_name,
                           srv.name as service_name,
                           s.address as school_address
                    FROM master_class_events mce
                    LEFT JOIN schools s ON mce.school_id = s.id
                    LEFT JOIN services srv ON mce.service_id = srv.id
                    ORDER BY mce.date ASC, mce.time ASC
                `;
                countQuery = `SELECT COUNT(*) FROM master_class_events mce`;
                params = [];
            }
        } else {
            // Для админского интерфейса - показываем ВСЕ мастер-классы (включая прошедшие)
            const filters: string[] = [];
            params = [];

            if (schoolId && typeof schoolId === 'string') {
                params.push(schoolId);
                filters.push(`mce.school_id = $${params.length}`);
            }
            if (classGroup && typeof classGroup === 'string') {
                params.push(classGroup);
                filters.push(`mce.class_group = $${params.length}`);
            }
            if (date && typeof date === 'string') {
                params.push(date);
                filters.push(`mce.date = $${params.length}`);
            }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            query = `
                SELECT mce.*, 
                       s.name as school_name,
                       srv.name as service_name,
                       s.address as school_address
                FROM master_class_events mce
                LEFT JOIN schools s ON mce.school_id = s.id
                LEFT JOIN services srv ON mce.service_id = srv.id
                ${whereClause}
                ORDER BY mce.date ASC, mce.time ASC
            `;
            countQuery = `SELECT COUNT(*) FROM master_class_events mce ${whereClause}`;
        }

        // Используем те же параметры для count что и для основного запроса
        const countParams = params;

        const [listResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);

        // Минимальная отладочная информация для детского дашборда
        if (userId) {
            console.log('Child dashboard filter:', {
                userId,
                userSchoolId,
                userClassGroup,
                foundMasterClasses: listResult.rows.length
            });
        }

        // Форматируем даты для правильной передачи на фронтенд
        const formattedMasterClasses = listResult.rows.map(mc => {
            return {
                ...mc,
                // Убираем проблемное преобразование через toISOString(), которое может смещать дату
                // date: mc.date instanceof Date ? mc.date.toISOString().split('T')[0] : mc.date
                date: mc.date instanceof Date ? mc.date.toLocaleDateString('en-CA') : mc.date
            };
        });

        res.json({
            success: true,
            data: {
                masterClasses: formattedMasterClasses,
                total: parseInt(countResult.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getMasterClassEventByIdNew = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        // Получаем мастер-класс с JOIN'ами для получения имен и данных школы
        const result = await pool.query(`
            SELECT 
                mce.*,
                s.name as school_name,
                s.address as school_address,
                s.teacher as school_teacher,
                s.teacher_phone as school_teacher_phone,
                srv.name as service_name
            FROM master_class_events mce
            LEFT JOIN schools s ON mce.school_id = s.id
            LEFT JOIN services srv ON mce.service_id = srv.id
            WHERE mce.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }

        const masterClass = result.rows[0];

        // Преобразуем ID исполнителей в имена
        if (masterClass.executors && Array.isArray(masterClass.executors)) {
            try {
                const executorIds = masterClass.executors;
                if (executorIds.length > 0) {
                    const executorQuery = `
                        SELECT id, name, surname 
                        FROM users 
                        WHERE id = ANY($1) AND role = 'executor'
                    `;
                    const executorResult = await pool.query(executorQuery, [executorIds]);

                    // Создаем маппинг ID -> имя
                    const executorMap = new Map();
                    executorResult.rows.forEach(executor => {
                        executorMap.set(executor.id, `${executor.name} ${executor.surname}`);
                    });

                    // Заменяем ID на имена
                    masterClass.executor_names = executorIds.map((executorId: string) => executorMap.get(executorId) || executorId);
                    masterClass.executors_original = executorIds; // Сохраняем оригинальные ID
                }
            } catch (executorError) {
                console.error('Error fetching executor names:', executorError);
                // В случае ошибки оставляем оригинальные ID
                masterClass.executor_names = masterClass.executors;
            }
        }

        res.json({ success: true, data: masterClass });
    } catch (error) {
        console.error('Get master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getMasterClassEventById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        // Получаем мастер-класс с JOIN'ами для получения имен и данных школы
        const result = await pool.query(`
            SELECT 
                mce.*,
                s.name as school_name,
                s.address as school_address,
                s.teacher as school_teacher,
                s.teacher_phone as school_teacher_phone,
                srv.name as service_name
            FROM master_class_events mce
            LEFT JOIN schools s ON mce.school_id = s.id
            LEFT JOIN services srv ON mce.service_id = srv.id
            WHERE mce.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }

        const masterClass = result.rows[0];

        // Преобразуем ID исполнителей в имена
        if (masterClass.executors && Array.isArray(masterClass.executors)) {
            try {
                const executorIds = masterClass.executors;
                if (executorIds.length > 0) {
                    const executorQuery = `
                        SELECT id, name, surname 
                        FROM users 
                        WHERE id = ANY($1) AND role = 'executor'
                    `;
                    const executorResult = await pool.query(executorQuery, [executorIds]);

                    // Создаем маппинг ID -> имя
                    const executorMap = new Map();
                    executorResult.rows.forEach(executor => {
                        executorMap.set(executor.id, `${executor.name} ${executor.surname}`.trim());
                    });

                    // Заменяем ID на имена
                    masterClass.executor_names = executorIds.map((executorId: string) => executorMap.get(executorId) || executorId);
                    masterClass.executors_original = executorIds; // Сохраняем оригинальные ID

                    // Добавляем полные данные исполнителей для фронтенда
                    masterClass.executors_full = executorResult.rows.map(executor => ({
                        id: executor.id,
                        name: executor.name,
                        surname: executor.surname,
                        fullName: `${executor.name} ${executor.surname}`.trim()
                    }));
                }
            } catch (executorError) {
                console.error('Error fetching executor names:', executorError);
                // В случае ошибки оставляем оригинальные ID
                masterClass.executor_names = masterClass.executors;
                masterClass.executors_full = [];
            }
        }

        // Добавляем данные школы для фронтенда
        masterClass.school_data = {
            teacher: masterClass.school_teacher || 'Учитель не указан',
            teacherPhone: masterClass.school_teacher_phone || 'Телефон не указан'
        };

        // Обрабатываем участников, если они есть
        if (masterClass.participants && Array.isArray(masterClass.participants)) {
            console.log('Участники мастер-класса:', masterClass.participants.length);

            // Получаем дополнительные данные участников (школа и телефон родителя)
            try {
                const participantIds = masterClass.participants
                    .map((p: Record<string, unknown>) => p.parentId)
                    .filter(Boolean);

                const childIds = masterClass.participants
                    .map((p: Record<string, unknown>) => p.childId)
                    .filter(Boolean);

                if (participantIds.length > 0 || childIds.length > 0) {
                    // Получаем данные родителей
                    const parentData = new Map();
                    if (participantIds.length > 0) {
                        const parentQuery = `
                            SELECT id, name, surname, phone 
                            FROM users 
                            WHERE id = ANY($1)
                        `;
                        const parentResult = await pool.query(parentQuery, [participantIds]);
                        parentResult.rows.forEach(parent => {
                            parentData.set(parent.id, {
                                phone: parent.phone || ''
                            });
                        });
                    }

                    // Получаем данные детей (школа)
                    const childData = new Map();
                    if (childIds.length > 0) {
                        const childQuery = `
                            SELECT u.id, u.name, u.surname, u.school_id, s.name as school_name 
                            FROM users u
                            LEFT JOIN schools s ON u.school_id = s.id
                            WHERE u.id = ANY($1)
                        `;
                        const childResult = await pool.query(childQuery, [childIds]);
                        childResult.rows.forEach(child => {
                            childData.set(child.id, {
                                schoolName: child.school_name || ''
                            });
                        });
                    }

                    // Обогащаем данные участников
                    masterClass.participants = masterClass.participants.map((participant: Record<string, unknown>) => {
                        const parentInfo = participantIds.length > 0 ? parentData.get(participant.parentId) : null;
                        const childInfo = childIds.length > 0 ? childData.get(participant.childId) : null;

                        return {
                            ...participant,
                            parentPhone: parentInfo?.phone || '',
                            schoolName: childInfo?.schoolName || ''
                        };
                    });
                }
            } catch (participantError) {
                console.error('Ошибка получения дополнительных данных участников:', participantError);
            }

            masterClass.participants.forEach((participant: Record<string, unknown>, index: number) => {
                console.log(`Участник ${index + 1}:`, {
                    childName: participant.childName,
                    schoolName: participant.schoolName,
                    parentPhone: participant.parentPhone,
                    notes: participant.notes,
                    hasNotes: !!participant.notes
                });
            });
        }

        res.json({ success: true, data: masterClass });
    } catch (error) {
        console.error('Get master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const createMasterClassEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, time, schoolId, classGroup, serviceId, executors = [], notes = '', participants = [], statistics = undefined } = req.body;

        // Отладочная информация для понимания проблемы с датами
        console.log('createMasterClassEvent: получены данные:', {
            date,
            dateType: typeof date,
            parsedDate: date ? new Date(date) : null,
            parsedDateISO: date ? new Date(date).toISOString() : null,
            parsedDateLocal: date ? new Date(date).toLocaleDateString() : null
        });

        // Проверка обязательных полей
        if (!date || !time || !schoolId || !classGroup || !serviceId) {
            console.error('createMasterClassEvent: отсутствуют обязательные поля:', { date, time, schoolId, classGroup, serviceId });
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
                details: { date: !!date, time: !!time, schoolId: !!schoolId, classGroup: !!classGroup, serviceId: !!serviceId }
            });
            return;
        }

        // Проверка существования школы и услуги
        try {
            const schoolCheck = await pool.query('SELECT id FROM schools WHERE id = $1', [schoolId]);
            if (schoolCheck.rows.length === 0) {
                console.error('createMasterClassEvent: школа не найдена:', schoolId);
                res.status(400).json({ success: false, error: 'School not found' });
                return;
            }

            const serviceCheck = await pool.query('SELECT id FROM services WHERE id = $1', [serviceId]);
            if (serviceCheck.rows.length === 0) {
                console.error('createMasterClassEvent: услуга не найдена:', serviceId);
                res.status(400).json({ success: false, error: 'Service not found' });
                return;
            }
        } catch (checkError) {
            console.error('createMasterClassEvent: ошибка проверки школы/услуги:', checkError);
            res.status(500).json({ success: false, error: 'Database check error' });
            return;
        }

        const defaultStats = {
            totalParticipants: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            stylesStats: {},
            optionsStats: {}
        };

        console.log('createMasterClassEvent: выполняем INSERT с параметрами:', {
            date, time, schoolId, classGroup, serviceId,
            executors: JSON.stringify(executors),
            participants: JSON.stringify(participants),
            statistics: JSON.stringify(statistics ?? defaultStats)
        });

        const result = await pool.query(`
            INSERT INTO master_class_events (date, time, school_id, class_group, service_id, executors, notes, participants, statistics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [date, time, schoolId, classGroup, serviceId, JSON.stringify(executors), notes, JSON.stringify(participants), JSON.stringify(statistics ?? defaultStats)]);

        console.log('createMasterClassEvent: успешно создан мастер-класс:', result.rows[0]);

        // Отправляем WebSocket уведомление о создании мастер-класса
        wsManager.notifyMasterClassUpdate(result.rows[0].id, 'created');
        console.log('📡 WebSocket уведомление отправлено для:', result.rows[0].id);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Create master class event error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace',
            name: error instanceof Error ? error.name : 'Unknown error type'
        });
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Новая функция для массового создания мастер-классов
export const createMultipleMasterClassEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date, time, schoolId, classGroups, serviceId, executors = [], notes = '', participants = [], statistics = undefined } = req.body;

        // Валидация входных данных
        if (!Array.isArray(classGroups) || classGroups.length === 0) {
            res.status(400).json({
                success: false,
                error: 'classGroups должен быть массивом с хотя бы одним элементом'
            });
            return;
        }

        // Проверка обязательных полей
        if (!date || !time || !schoolId || !serviceId) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields',
                details: { date: !!date, time: !!time, schoolId: !!schoolId, serviceId: !!serviceId }
            });
            return;
        }

        // Проверка существования школы и услуги
        try {
            const schoolCheck = await pool.query('SELECT id FROM schools WHERE id = $1', [schoolId]);
            if (schoolCheck.rows.length === 0) {
                res.status(400).json({ success: false, error: 'School not found' });
                return;
            }

            const serviceCheck = await pool.query('SELECT id FROM services WHERE id = $1', [serviceId]);
            if (serviceCheck.rows.length === 0) {
                res.status(400).json({ success: false, error: 'Service not found' });
                return;
            }
        } catch (checkError) {
            console.error('createMultipleMasterClassEvents: ошибка проверки школы/услуги:', checkError);
            res.status(500).json({ success: false, error: 'Database check error' });
            return;
        }

        console.log('createMultipleMasterClassEvents: получены данные:', {
            date,
            dateType: typeof date,
            parsedDate: date ? new Date(date) : null,
            time,
            schoolId,
            classGroups,
            serviceId,
            executors,
            notes
        });

        const defaultStats = {
            totalParticipants: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            stylesStats: {},
            optionsStats: {}
        };

        const results = [];
        const errors = [];

        // Создаем мастер-класс для каждого класса
        for (const classGroup of classGroups) {
            try {
                const result = await pool.query(`
                    INSERT INTO master_class_events (date, time, school_id, class_group, service_id, executors, notes, participants, statistics)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `, [
                    date,
                    time,
                    schoolId,
                    classGroup,
                    serviceId,
                    JSON.stringify(executors),
                    notes,
                    JSON.stringify(participants),
                    JSON.stringify(statistics ?? defaultStats)
                ]);

                results.push(result.rows[0]);
                console.log(`Создан мастер-класс для класса ${classGroup}`);
            } catch (error) {
                console.error(`Ошибка создания мастер-класса для класса ${classGroup}:`, error);
                errors.push({
                    classGroup,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        if (errors.length > 0) {
            res.status(207).json({
                success: true,
                data: results,
                warnings: {
                    message: `Создано ${results.length} из ${classGroups.length} мастер-классов`,
                    errors
                }
            });
        } else {
            res.status(201).json({
                success: true,
                data: results,
                message: `Успешно создано ${results.length} мастер-классов`
            });
        }
    } catch (error) {
        console.error('Create multiple master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const updateMasterClassEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const update = req.body || {};

        // Ограничим набор полей
        const allowed: Record<string, string | number | string[] | Record<string, unknown>[] | Record<string, unknown>> = {};
        if (update.date !== undefined) allowed.date = update.date;
        if (update.time !== undefined) allowed.time = update.time;
        if (update.schoolId !== undefined) allowed.school_id = update.schoolId;
        if (update.classGroup !== undefined) allowed.class_group = update.classGroup;
        if (update.serviceId !== undefined) allowed.service_id = update.serviceId;
        if (update.executors !== undefined) allowed.executors = update.executors as string[];
        if (update.notes !== undefined) allowed.notes = update.notes;
        if (update.participants !== undefined) allowed.participants = update.participants as Record<string, unknown>[];
        if (update.statistics !== undefined) allowed.statistics = update.statistics as Record<string, unknown>;

        const fields = Object.keys(allowed);
        if (fields.length === 0) {
            res.status(400).json({ success: false, error: 'No valid fields to update' });
            return;
        }

        const setClause = fields.map((f, i) => {
            if (f === 'schoolId') return `school_id = $${i + 2}`;
            if (f === 'classGroup') return `class_group = $${i + 2}`;
            if (f === 'executors') return `executors = $${i + 2}`;
            if (f === 'participants') return `participants = $${i + 2}`;
            if (f === 'statistics') return `statistics = $${i + 2}`;
            return `${f} = $${i + 2}`;
        }).join(', ');

        const values = fields.map((f) => {
            if (f === 'executors' || f === 'participants' || f === 'statistics') {
                return JSON.stringify(allowed[f]);
            } else {
                return allowed[f];
            }
        });

        const result = await pool.query(
            `UPDATE master_class_events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id, ...values]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Master class event updated successfully'
        });

    } catch (error) {
        console.error('Error updating master class event:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Обновить статус получения услуги участником
export const updateParticipantServiceReceived = async (req: Request, res: Response): Promise<void> => {
    try {
        const { masterClassId, participantId } = req.params;
        const { hasReceived } = req.body;

        console.log('🔄 updateParticipantServiceReceived called:', {
            masterClassId,
            participantId,
            hasReceived
        });

        if (typeof hasReceived !== 'boolean') {
            res.status(400).json({ success: false, error: 'hasReceived must be a boolean' });
            return;
        }

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query(`
            SELECT participants
            FROM master_class_events
            WHERE id = $1
        `, [masterClassId]);

        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const participants = masterClassResult.rows[0].participants || [];

        // Находим участника
        const participantIndex = participants.findIndex((p: { id: string }) => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        // Обновляем статус получения услуги
        participants[participantIndex].hasReceived = hasReceived;

        // Сохраняем обновленных участников
        const updateResult = await pool.query(`
            UPDATE master_class_events
            SET participants = $1::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [JSON.stringify(participants), masterClassId]);

        console.log('✅ Service received status updated:', {
            masterClassId,
            participantId,
            hasReceived
        });

        res.json({
            success: true,
            data: updateResult.rows[0]
        });
    } catch (error) {
        console.error('❌ Error updating service received status:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Обновить статус оплаты участника мастер-класса
export const updateParticipantPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { masterClassId, participantId } = req.params;
        const { isPaid } = req.body;

        if (typeof isPaid !== 'boolean') {
            res.status(400).json({ success: false, error: 'isPaid must be a boolean' });
            return;
        }

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query(
            'SELECT participants, statistics FROM master_class_events WHERE id = $1',
            [masterClassId]
        );

        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const masterClass = masterClassResult.rows[0];
        const participants = masterClass.participants || [];
        const statistics = masterClass.statistics || {};

        // Находим и обновляем участника
        const participantIndex = participants.findIndex((p: { id: string }) => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        const oldPaymentStatus = participants[participantIndex].isPaid;
        participants[participantIndex].isPaid = isPaid;

        // Обновляем статистику
        let paidAmount = Number(statistics.paidAmount) || 0;
        let unpaidAmount = Number(statistics.unpaidAmount) || 0;

        if (oldPaymentStatus && !isPaid) {
            // Было оплачено, стало не оплачено
            paidAmount -= Number(participants[participantIndex].totalAmount) || 0;
            unpaidAmount += Number(participants[participantIndex].totalAmount) || 0;
        } else if (!oldPaymentStatus && isPaid) {
            // Было не оплачено, стало оплачено
            paidAmount += Number(participants[participantIndex].totalAmount) || 0;
            unpaidAmount -= Number(participants[participantIndex].totalAmount) || 0;
        }

        // Убеждаемся, что значения не отрицательные
        paidAmount = Math.max(0, paidAmount);
        unpaidAmount = Math.max(0, unpaidAmount);

        // Обновляем мастер-класс
        const updateResult = await pool.query(
            `UPDATE master_class_events 
             SET participants = $1::jsonb, 
                 statistics = jsonb_set(
                     COALESCE(statistics, '{}'::jsonb),
                     '{paidAmount}', to_jsonb($2::numeric)
                 ),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [JSON.stringify(participants), paidAmount, masterClassId]
        );

        if (updateResult.rows.length === 0) {
            res.status(500).json({ success: false, error: 'Failed to update master class' });
            return;
        }

        // Обновляем статус счета в таблице invoices
        const participant = participants[participantIndex];
        const newStatus = isPaid ? 'paid' : 'pending';

        // Ищем счет по masterClassId и participantId (родителю)
        const invoiceResult = await pool.query(
            'SELECT id FROM invoices WHERE master_class_id = $1 AND participant_id = $2',
            [masterClassId, participant.parentId || participant.parent_id]
        );

        if (invoiceResult.rows.length > 0) {
            const invoiceId = invoiceResult.rows[0].id;
            await pool.query(
                'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newStatus, invoiceId]
            );
            console.log(`🔄 Обновлен статус счета ${invoiceId}: ${newStatus}`);
        } else {
            console.log(`⚠️ Счет не найден для masterClassId: ${masterClassId}, participantId: ${participant.parentId || participant.parent_id}`);
        }

        // Отправляем WebSocket уведомление об обновлении мастер-класса
        if (wsManager) {
            wsManager.notifyMasterClassUpdate(masterClassId, 'payment_status_updated');
            console.log('📡 WebSocket уведомление отправлено для обновления статуса оплаты:', masterClassId);
        } else {
            console.log('⚠️ WebSocket manager не инициализирован, пропускаем уведомление');
        }

        res.json({
            success: true,
            data: updateResult.rows[0],
            message: 'Participant payment status updated successfully'
        });

    } catch (error) {
        console.error('Error updating participant payment status:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Оплата наличными (для администратора)
export const markParticipantAsCashPayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { masterClassId, participantId } = req.params;

        console.log('💵 Обработка наличной оплаты:', { masterClassId, participantId });

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query(
            'SELECT participants, statistics FROM master_class_events WHERE id = $1',
            [masterClassId]
        );

        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const masterClass = masterClassResult.rows[0];
        const participants = masterClass.participants || [];
        const statistics = masterClass.statistics || {};

        // Находим участника
        const participantIndex = participants.findIndex((p: { id: string }) => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        const participant = participants[participantIndex];
        const oldPaymentStatus = participant.isPaid;
        const participantAmount = Number(participant.totalAmount) || 0;

        // Обновляем данные участника
        participants[participantIndex].isPaid = true;
        participants[participantIndex].paymentMethod = 'cash';
        participants[participantIndex].paymentDate = new Date().toISOString();

        // Обновляем статистику
        let paidAmount = Number(statistics.paidAmount) || 0;
        let unpaidAmount = Number(statistics.unpaidAmount) || 0;
        let cashAmount = Number(statistics.cashAmount) || 0;

        if (!oldPaymentStatus) {
            // Было не оплачено, стало оплачено наличными
            paidAmount += participantAmount;
            unpaidAmount -= participantAmount;
            cashAmount += participantAmount;
        } else {
            // Уже было оплачено, просто переводим в наличные (если было не наличными)
            if (participant.paymentMethod !== 'cash') {
                cashAmount += participantAmount;
            }
        }

        // Убеждаемся, что значения не отрицательные
        paidAmount = Math.max(0, paidAmount);
        unpaidAmount = Math.max(0, unpaidAmount);
        cashAmount = Math.max(0, cashAmount);

        // Обновляем статистику
        statistics.paidAmount = paidAmount;
        statistics.unpaidAmount = unpaidAmount;
        statistics.cashAmount = cashAmount;

        console.log('📊 Обновленная статистика:', {
            paidAmount,
            unpaidAmount,
            cashAmount
        });

        // Обновляем мастер-класс
        const updateResult = await pool.query(
            `UPDATE master_class_events 
             SET participants = $1::jsonb, 
                 statistics = $2::jsonb,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [JSON.stringify(participants), JSON.stringify(statistics), masterClassId]
        );

        if (updateResult.rows.length === 0) {
            res.status(500).json({ success: false, error: 'Failed to update master class' });
            return;
        }

        // Обновляем статус счета в таблице invoices
        const newStatus = 'paid';

        // Ищем счет по masterClassId и participantId (родителю)
        const invoiceResult = await pool.query(
            'SELECT id FROM invoices WHERE master_class_id = $1 AND participant_id = $2',
            [masterClassId, participant.parentId || participant.parent_id]
        );

        if (invoiceResult.rows.length > 0) {
            const invoiceId = invoiceResult.rows[0].id;
            await pool.query(
                'UPDATE invoices SET status = $1, payment_method = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [newStatus, 'cash', invoiceId]
            );
            console.log(`💵 Счет ${invoiceId} помечен как оплаченный наличными`);
        } else {
            console.log(`⚠️ Счет не найден для masterClassId: ${masterClassId}, participantId: ${participant.parentId || participant.parent_id}`);
        }

        // Отправляем WebSocket уведомление об обновлении мастер-класса
        if (wsManager) {
            wsManager.notifyMasterClassUpdate(masterClassId, 'cash_payment_confirmed');
            console.log('📡 WebSocket уведомление отправлено для подтверждения наличной оплаты:', masterClassId);
        } else {
            console.log('⚠️ WebSocket manager не инициализирован, пропускаем уведомление');
        }

        res.json({
            success: true,
            data: updateResult.rows[0],
            message: 'Participant marked as cash payment successfully'
        });

    } catch (error) {
        console.error('❌ Error marking participant as cash payment:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Обновить данные участника мастер-класса (для родителей)
export const updateParticipantData = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: masterClassId } = req.params;
        const { participantId, selectedStyles, selectedOptions, notes } = req.body;

        console.log('🔄 updateParticipantData called:', {
            masterClassId,
            participantId,
            selectedStyles,
            selectedOptions,
            notes
        });

        if (!participantId) {
            res.status(400).json({ success: false, error: 'participantId is required' });
            return;
        }

        // Получаем текущий мастер-класс с услугой для расчета стоимости
        const masterClassResult = await pool.query(`
            SELECT mce.participants, mce.statistics, s.styles, s.options
            FROM master_class_events mce
            LEFT JOIN services s ON mce.service_id = s.id
            WHERE mce.id = $1
        `, [masterClassId]);

        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const masterClass = masterClassResult.rows[0];
        const participants = masterClass.participants || [];
        const statistics = masterClass.statistics || {};
        const serviceStyles = masterClass.styles || [];
        const serviceOptions = masterClass.options || [];

        // Находим участника (сначала ищем точное совпадение, потом по realParticipantId)
        const realParticipantId = participantId.split('_')[0];
        let participantIndex = participants.findIndex((p: { id: string }) => p.id === participantId);
        if (participantIndex === -1) {
            participantIndex = participants.findIndex((p: { id: string }) => p.id === realParticipantId);
        }
        if (participantIndex === -1) {
            console.log('❌ Participant not found:', { participantId, realParticipantId, participants: participants.map(p => p.id) });
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        console.log('✅ Participant found at index:', participantIndex);

        const oldTotalAmount = participants[participantIndex].totalAmount || 0;

        // Обновляем данные участника
        if (selectedStyles !== undefined) {
            participants[participantIndex].selectedStyles = selectedStyles;
        }
        if (selectedOptions !== undefined) {
            participants[participantIndex].selectedOptions = selectedOptions;
        }
        if (notes !== undefined) {
            participants[participantIndex].notes = notes;
        }

        // Пересчитываем totalAmount для участника
        let newTotalAmount = 0;

        // Считаем стоимость стилей
        if (participants[participantIndex].selectedStyles) {
            participants[participantIndex].selectedStyles.forEach((styleItem: string | { id: string; quantity?: number }) => {
                if (!styleItem) return;
                const styleId = typeof styleItem === 'string' ? styleItem : styleItem.id;
                const quantity = typeof styleItem === 'object' && styleItem.quantity ? styleItem.quantity : 1;
                const style = serviceStyles.find((s: { id: string; price?: number }) => s.id === styleId);
                if (style) {
                    newTotalAmount += (style.price || 0) * quantity;
                }
            });
        }

        // Считаем стоимость опций
        if (participants[participantIndex].selectedOptions) {
            participants[participantIndex].selectedOptions.forEach((optionItem: string | { id: string; quantity?: number }) => {
                if (!optionItem) return;
                const optionId = typeof optionItem === 'string' ? optionItem : optionItem.id;
                const quantity = typeof optionItem === 'object' && optionItem.quantity ? optionItem.quantity : 1;
                const option = serviceOptions.find((o: { id: string; price?: number }) => o.id === optionId);
                if (option) {
                    newTotalAmount += (option.price || 0) * quantity;
                }
            });
        }

        // Обновляем totalAmount участника
        participants[participantIndex].totalAmount = newTotalAmount;

        // Обновляем статистику мастер-класса
        const totalAmount = participants.reduce((sum: number, p: { totalAmount?: number }) => sum + (p.totalAmount || 0), 0);
        const paidAmount = participants
            .filter((p: { isPaid?: boolean }) => p.isPaid)
            .reduce((sum: number, p: { totalAmount?: number }) => sum + (p.totalAmount || 0), 0);
        const unpaidAmount = totalAmount - paidAmount;

        // Подсчитываем наличные
        const cashAmount = participants
            .filter((p: { isPaid?: boolean; paymentMethod?: string }) => p.isPaid && p.paymentMethod === 'cash')
            .reduce((sum: number, p: { totalAmount?: number }) => sum + (p.totalAmount || 0), 0);

        const newStatistics = {
            ...statistics,
            totalAmount,
            paidAmount,
            unpaidAmount,
            cashAmount,
            totalParticipants: participants.length
        };

        // Обновляем мастер-класс
        const updateResult = await pool.query(
            'UPDATE master_class_events SET participants = $1, statistics = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [JSON.stringify(participants), JSON.stringify(newStatistics), masterClassId]
        );

        if (updateResult.rows.length === 0) {
            res.status(500).json({ success: false, error: 'Failed to update master class' });
            return;
        }

        // Обновляем сумму в счете, если она изменилась
        if (oldTotalAmount !== newTotalAmount) {
            console.log('💰 Updating invoice amounts:', {
                oldTotalAmount,
                newTotalAmount,
                masterClassId,
                participantId
            });

            try {
                // Извлекаем реальный participant_id (убираем _0, _1 и т.д.)
                const realParticipantId = participantId.split('_')[0];
                console.log('🔍 Real participant ID:', realParticipantId);

                // В таблице invoices participant_id уже содержит ID родителя
                // realParticipantId уже является ID родителя
                const parentId = realParticipantId;
                console.log('👨‍👩‍👧‍👦 Parent ID (direct):', parentId);

                // Обновляем amount для счета родителя
                const updateAmountResult = await pool.query(
                    'UPDATE invoices SET amount = $1 WHERE master_class_id = $2 AND participant_id = $3',
                    [newTotalAmount.toString(), masterClassId, parentId]
                );

                console.log('✅ Updated participant amount, affected rows:', updateAmountResult.rowCount);

                // Пересчитываем total_amount для всех счетов этого мастер-класса
                const invoiceResult = await pool.query(
                    'SELECT id, participant_id FROM invoices WHERE master_class_id = $1',
                    [masterClassId]
                );

                console.log('📊 Found invoices to update:', invoiceResult.rows.length);

                for (const invoice of invoiceResult.rows) {
                    // Ищем участника по родителю (invoice.participant_id уже содержит ID родителя)
                    const participant = participants.find((p: { id: string; totalAmount?: number; parentId?: string; parent_id?: string }) => {
                        return p.parentId === invoice.participant_id || p.parent_id === invoice.participant_id;
                    });

                    if (participant) {
                        console.log('🔄 Updating invoice:', {
                            invoiceId: invoice.id,
                            participantId: invoice.participant_id,
                            newAmount: participant.totalAmount
                        });

                        await pool.query(
                            'UPDATE invoices SET amount = $1 WHERE id = $2',
                            [participant.totalAmount.toString(), invoice.id]
                        );
                    }
                }
                console.log('✅ All invoices for master class updated successfully.');
            } catch (invoiceError) {
                console.error('❌ Error updating invoices:', invoiceError);
                // Не прерываем выполнение, так как основное обновление уже прошло
            }
        }

        res.json({
            success: true,
            data: updateResult.rows[0],
            message: 'Participant data updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating participant data:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            masterClassId: req.params.id,
            participantId: req.body.participantId
        });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const deleteMasterClassEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM master_class_events WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }
        res.json({ success: true, message: 'Master class event deleted successfully' });
    } catch (error) {
        console.error('Delete master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Удаление всех мастер-классов школы за определенную дату
export const deleteSchoolMasterClasses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { schoolId, date } = req.params;

        console.log(`🗑️ Удаление мастер-классов школы ${schoolId} за дату ${date}`);

        // Удаляем все мастер-классы школы за указанную дату
        const result = await pool.query(
            'DELETE FROM master_class_events WHERE school_id = $1 AND date = $2 RETURNING id',
            [schoolId, date]
        );

        const deletedCount = result.rows.length;

        if (deletedCount === 0) {
            res.status(404).json({
                success: false,
                error: 'No master classes found for this school and date'
            });
            return;
        }

        console.log(`✅ Удалено ${deletedCount} мастер-классов`);

        // Отправляем WebSocket уведомление об удалении для каждого удаленного мастер-класса
        if (wsManager) {
            result.rows.forEach(row => {
                wsManager.notifyMasterClassUpdate(row.id, 'deleted');
            });
            console.log(`📡 WebSocket уведомления отправлены для ${deletedCount} мастер-классов`);
        }

        res.json({
            success: true,
            message: `Successfully deleted ${deletedCount} master class(es)`,
            data: { deletedCount }
        });
    } catch (error) {
        console.error('❌ Delete school master classes error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Пересчет статистики мастер-класса на основе текущих участников
export const recalculateMasterClassStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        console.log('🔄 Пересчет статистики мастер-класса:', id);

        // Получаем мастер-класс с участниками
        const result = await pool.query(
            'SELECT participants FROM master_class_events WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const participants = result.rows[0].participants || [];

        // Пересчитываем статистику с нуля
        const statistics: {
            totalParticipants: number;
            totalAmount: number;
            paidAmount: number;
            unpaidAmount: number;
            cashAmount: number;
            stylesStats: Record<string, number>;
            optionsStats: Record<string, number>;
        } = {
            totalParticipants: participants.length,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            cashAmount: 0,
            stylesStats: {},
            optionsStats: {}
        };

        // Подсчитываем суммы и статистику по стилям/опциям
        participants.forEach((participant: {
            totalAmount?: number;
            isPaid?: boolean;
            paymentMethod?: string;
            selectedStyles?: (string | { id: string })[];
            selectedOptions?: (string | { id: string })[];
        }) => {
            const amount = participant.totalAmount || 0;
            statistics.totalAmount += amount;

            if (participant.isPaid) {
                statistics.paidAmount += amount;
                if (participant.paymentMethod === 'cash') {
                    statistics.cashAmount += amount;
                }
            } else {
                statistics.unpaidAmount += amount;
            }

            // Подсчитываем стили
            if (participant.selectedStyles && Array.isArray(participant.selectedStyles)) {
                participant.selectedStyles.forEach((style: string | { id: string }) => {
                    const styleId = typeof style === 'string' ? style : style.id;
                    statistics.stylesStats[styleId] = (statistics.stylesStats[styleId] || 0) + 1;
                });
            }

            // Подсчитываем опции
            if (participant.selectedOptions && Array.isArray(participant.selectedOptions)) {
                participant.selectedOptions.forEach((option: string | { id: string }) => {
                    const optionId = typeof option === 'string' ? option : option.id;
                    statistics.optionsStats[optionId] = (statistics.optionsStats[optionId] || 0) + 1;
                });
            }
        });

        // Обновляем статистику в БД
        await pool.query(
            'UPDATE master_class_events SET statistics = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(statistics), id]
        );

        console.log('✅ Статистика пересчитана:', statistics);

        // Отправляем WebSocket уведомление
        if (wsManager) {
            wsManager.notifyMasterClassUpdate(id, 'statistics_recalculated');
        }

        res.json({
            success: true,
            message: 'Statistics recalculated successfully',
            data: { statistics }
        });
    } catch (error) {
        console.error('❌ Recalculate statistics error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};