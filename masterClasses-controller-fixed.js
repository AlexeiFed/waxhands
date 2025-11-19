import pool from '../database/connection.js';
import { wsManager } from '../websocket-server.js';

// Тестовая функция для проверки компиляции
export const testFunction = async (req, res) => {
    res.json({ success: true, message: 'Test function works' });
};

// --- Новые обработчики для событий мастер-классов ---
export const getMasterClassEvents = async (req, res) => {
    try {
        const { schoolId, classGroup, date, userId } = req.query;
        let query;
        let countQuery;
        let params = [];
        let userSchoolId = null;
        let userClassGroup = null;

        // Если передан userId, определяем тип пользователя и показываем соответствующие мастер-классы
        if (userId) {
            // Получаем информацию о пользователе (роль, школа, класс)
            const userQuery = `
                SELECT role, school_id, COALESCE(class_group, class) as class_group 
                FROM users 
                WHERE id = $1
            `;
            const userResult = await pool.query(userQuery, [userId]);
            if (userResult.rows.length > 0) {
                const user = userResult.rows[0];
                userSchoolId = user.school_id;
                userClassGroup = user.class_group;
                console.log('User dashboard filter:', { userId, role: user.role, userSchoolId, userClassGroup });
                
                if (user.role === 'child') {
                    // Для детей: показываем мастер-классы их школы и класса
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
                        // Если нет школы или класса, показываем все доступные мастер-классы
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
                    }
                } else if (user.role === 'parent') {
                    // Для родителей: показываем мастер-классы, где зарегистрированы их дети
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
                              SELECT 1 FROM jsonb_array_elements(mce.participants) AS participant
                              WHERE participant->>'parentId' = $1
                          )
                        ORDER BY mce.date ASC, mce.time ASC
                    `;
                    countQuery = `
                        SELECT COUNT(DISTINCT mce.id) 
                        FROM master_class_events mce
                        WHERE mce.date >= CURRENT_DATE 
                          AND EXISTS (
                              SELECT 1 FROM jsonb_array_elements(mce.participants) AS participant
                              WHERE participant->>'parentId' = $1
                          )
                    `;
                    params = [userId];
                } else {
                    // Для других ролей (админ, исполнитель) показываем все мастер-классы
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
                    WHERE mce.date >= CURRENT_DATE
                    ORDER BY mce.date ASC, mce.time ASC
                `;
                countQuery = `
                    SELECT COUNT(*) 
                    FROM master_class_events mce
                    WHERE mce.date >= CURRENT_DATE
                `;
            }
        } else {
            // Обычная фильтрация для админов
            query = `
                SELECT mce.*, 
                       s.name as school_name,
                       srv.name as service_name,
                       s.address as school_address
                FROM master_class_events mce
                LEFT JOIN schools s ON mce.school_id = s.id
                LEFT JOIN services srv ON mce.service_id = srv.id
                WHERE 1=1
            `;
            countQuery = `
                SELECT COUNT(*) 
                FROM master_class_events mce
                WHERE 1=1
            `;

            if (schoolId) {
                query += ' AND mce.school_id = $' + (params.length + 1);
                countQuery += ' AND mce.school_id = $' + (params.length + 1);
                params.push(schoolId);
            }

            if (classGroup) {
                query += ' AND mce.class_group = $' + (params.length + 1);
                countQuery += ' AND mce.class_group = $' + (params.length + 1);
                params.push(classGroup);
            }

            if (date) {
                query += ' AND mce.date = $' + (params.length + 1);
                countQuery += ' AND mce.date = $' + (params.length + 1);
                params.push(date);
            }

            query += ' ORDER BY mce.date ASC, mce.time ASC';
        }

        console.log('Executing query:', query);
        console.log('Query parameters:', params);

        const [eventsResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, params)
        ]);

        const events = eventsResult.rows.map(event => {
            // Преобразуем ID исполнителей в имена
            if (event.executors && Array.isArray(event.executors)) {
                try {
                    const executorIds = event.executors;
                    if (executorIds.length > 0) {
                        // Синхронно получаем имена исполнителей
                        const executorQuery = `
                            SELECT id, name, surname
                            FROM users
                            WHERE id = ANY($1) AND role = 'executor'
                        `;
                        // Здесь нужно использовать async/await, но мы в map
                        // Пока оставляем как есть, имена будут получены отдельно
                    }
                } catch (executorError) {
                    console.error('Error processing executors:', executorError);
                }
            }

            return {
                ...event,
                schoolName: event.school_name || 'Школа не указана',
                serviceName: event.service_name || 'Услуга не указана',
                city: event.school_address ? event.school_address.split(',')[0].trim() : 'Не указан'
            };
        });

        // Получаем имена исполнителей для всех событий
        const allExecutorIds = [...new Set(events.flatMap(event => event.executors || []))];
        if (allExecutorIds.length > 0) {
            try {
                const executorQuery = `
                    SELECT id, name, surname
                    FROM users
                    WHERE id = ANY($1) AND role = 'executor'
                `;
                const executorResult = await pool.query(executorQuery, [allExecutorIds]);
                const executorMap = new Map();
                executorResult.rows.forEach(executor => {
                    executorMap.set(executor.id, `${executor.name} ${executor.surname}`.trim());
                });

                // Обновляем события с именами исполнителей
                events.forEach(event => {
                    if (event.executors && Array.isArray(event.executors)) {
                        event.executor_names = event.executors.map(executorId =>
                            executorMap.get(executorId) || executorId
                        );
                    }
                });
            } catch (executorError) {
                console.error('Error fetching executor names:', executorError);
            }
        }

        res.json({
            success: true,
            data: events,
            total: countResult.rows[0].count
        });
    } catch (error) {
        console.error('Get master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getMasterClassEventById = async (req, res) => {
    try {
        const id = req.params.id;
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
                    masterClass.executor_names = executorIds.map((executorId) => executorMap.get(executorId) || executorId);
                    masterClass.executors_original = executorIds; // Сохраняем оригинальные ID
                    // Добавляем полные данные исполнителей для фронтенда
                    masterClass.executors_full = executorResult.rows.map(executor => ({
                        id: executor.id,
                        name: executor.name,
                        surname: executor.surname,
                        fullName: `${executor.name} ${executor.surname}`.trim()
                    }));
                }
            }
            catch (executorError) {
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
        res.json({ success: true, data: masterClass });
    }
    catch (error) {
        console.error('Get master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const createMasterClassEvent = async (req, res) => {
    try {
        const { date, time, schoolId, classGroup, serviceId, executors, notes } = req.body;
        const result = await pool.query(`
            INSERT INTO master_class_events (date, time, school_id, class_group, service_id, executors, notes, participants, statistics)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [date, time, schoolId, classGroup, serviceId, executors, notes, [], {}]);
        res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        console.error('Create master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const createMultipleMasterClassEvents = async (req, res) => {
    try {
        const { events } = req.body;
        if (!Array.isArray(events) || events.length === 0) {
            res.status(400).json({ success: false, error: 'Events array is required' });
            return;
        }
        const createdEvents = [];
        for (const event of events) {
            const { date, time, schoolId, classGroup, serviceId, executors, notes } = event;
            const result = await pool.query(`
                INSERT INTO master_class_events (date, time, school_id, class_group, service_id, executors, notes, participants, statistics)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [date, time, schoolId, classGroup, serviceId, executors, notes, [], {}]);
            createdEvents.push(result.rows[0]);
        }
        res.status(201).json({ success: true, data: createdEvents });
    }
    catch (error) {
        console.error('Create multiple master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const updateMasterClassEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, schoolId, classGroup, serviceId, executors, notes } = req.body;
        const result = await pool.query(`
            UPDATE master_class_events 
            SET date = $1, time = $2, school_id = $3, class_group = $4, service_id = $5, executors = $6, notes = $7
            WHERE id = $8
            RETURNING *
        `, [date, time, schoolId, classGroup, serviceId, executors, notes, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }
        res.json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        console.error('Update master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Обновить статус оплаты участника мастер-класса
export const updateParticipantPaymentStatus = async (req, res) => {
    try {
        const { masterClassId, participantId } = req.params;
        const { isPaid } = req.body;

        if (typeof isPaid !== 'boolean') {
            res.status(400).json({ success: false, error: 'isPaid must be a boolean' });
            return;
        }

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query('SELECT participants, statistics FROM master_class_events WHERE id = $1', [masterClassId]);
        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const masterClass = masterClassResult.rows[0];
        const participants = masterClass.participants || [];

        // Находим участника
        const participantIndex = participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        // Обновляем статус оплаты
        participants[participantIndex].isPaid = isPaid;

        // Обновляем статистику
        const statistics = masterClass.statistics || {};
        statistics.totalParticipants = participants.length;
        statistics.paidParticipants = participants.filter(p => p.isPaid).length;
        statistics.unpaidParticipants = participants.filter(p => !p.isPaid).length;

        // Сохраняем в базу данных
        await pool.query(
            'UPDATE master_class_events SET participants = $1, statistics = $2 WHERE id = $3',
            [participants, statistics, masterClassId]
        );

        res.json({ success: true, message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Error updating participant payment status:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

// Обновление данных участника мастер-класса (для родителей и админов)
export const updateParticipantData = async (req, res) => {
    try {
        const { masterClassId } = req.params;
        const { participantId, selectedStyles, selectedOptions, notes } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        console.log('🔍 updateParticipantData called:', {
            masterClassId,
            participantId,
            userId,
            userRole,
            selectedStyles: selectedStyles?.length,
            selectedOptions: selectedOptions?.length,
            notes: notes?.length
        });

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query('SELECT participants FROM master_class_events WHERE id = $1', [masterClassId]);
        if (masterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found' });
            return;
        }

        const masterClass = masterClassResult.rows[0];
        const participants = masterClass.participants || [];

        // Находим участника
        const participantIndex = participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }

        const participant = participants[participantIndex];

        // Если это родитель, проверяем, что участник принадлежит ему
        if (userRole === 'parent' && participant.parentId !== userId) {
            res.status(403).json({
                success: false,
                error: 'You can only update your own children\'s data'
            });
            return;
        }

        // Обновляем данные участника
        const updatedParticipant = {
            ...participant,
            selectedStyles: selectedStyles || participant.selectedStyles,
            selectedOptions: selectedOptions || participant.selectedOptions,
            notes: notes !== undefined ? notes : participant.notes
        };

        // Обновляем массив участников
        participants[participantIndex] = updatedParticipant;

        // Сохраняем в базу данных
        await pool.query(
            'UPDATE master_class_events SET participants = $1 WHERE id = $2',
            [participants, masterClassId]
        );

        console.log('✅ Participant data updated:', participantId);

        // Получаем обновленные данные мастер-класса
        const updatedMasterClassResult = await pool.query(`
            SELECT mce.*, 
                   s.name as school_name,
                   srv.name as service_name,
                   s.address as school_address
            FROM master_class_events mce
            LEFT JOIN schools s ON mce.school_id = s.id
            LEFT JOIN services srv ON mce.service_id = srv.id
            WHERE mce.id = $1
        `, [masterClassId]);

        if (updatedMasterClassResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class not found after update' });
            return;
        }

        const updatedMasterClass = updatedMasterClassResult.rows[0];

        res.json({
            success: true,
            message: 'Participant data updated successfully',
            data: updatedMasterClass
        });

    } catch (error) {
        console.error('Error updating participant data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const deleteMasterClassEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM master_class_events WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }
        res.json({ success: true, message: 'Master class event deleted successfully' });
    }
    catch (error) {
        console.error('Delete master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
