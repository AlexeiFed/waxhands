import pool from '../database/connection.js';
import { wsManager } from '../websocket-server.js';
// Тестовая функция для проверки компиляции
export const testFunction = async (req, res) => {
    res.json({ success: true, message: 'Test function works' });
};
// Удалено - таблица master_classes больше не используется
// Удалено - таблица master_classes больше не используется
// Удалено - таблица master_classes больше не используется
// Удалено - таблица master_classes больше не используется
// Удалено - таблица master_classes больше не используется
// --- Новые обработчики для событий мастер-классов ---
export const getMasterClassEvents = async (req, res) => {
    try {
        const { schoolId, classGroup, date, userId } = req.query;
        let query;
        let countQuery;
        let params = [];
        let userSchoolId = null;
        let userClassGroup = null;
        // Если передан userId (для детского дашборда), показываем все мастер-классы с приоритетом
        if (userId) {
            // Получаем школу и класс ребенка
            const userQuery = `
                SELECT school_id, COALESCE(class_group, class) as class_group 
                FROM users 
                WHERE id = $1
            `;
            const userResult = await pool.query(userQuery, [userId]);
            if (userResult.rows.length > 0) {
                userSchoolId = userResult.rows[0].school_id;
                userClassGroup = userResult.rows[0].class_group;
                console.log('Child dashboard filter:', { userSchoolId, userClassGroup });
                // Проверяем есть ли и школа и класс
                if (userSchoolId && userClassGroup) {
                    // Строгая фильтрация: только точное совпадение школы И класса
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
                }
                else {
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
            }
            else {
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
                params = [];
            }
        }
        else {
            // Для админского интерфейса - обычная фильтрация
            const filters = [];
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
        let countParams = [];
        if (userId) {
            // Для детского дашборда используем те же параметры фильтрации что и для основного запроса
            if (userSchoolId && userClassGroup) {
                countParams = [userSchoolId, userClassGroup];
            }
            else {
                countParams = [];
            }
        }
        else {
            countParams = params; // Используем все параметры для count
        }
        const [listResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, countParams)
        ]);
        // Расширенная отладочная информация для детского дашборда
        if (userId) {
            // Получаем все мастер-классы для сравнения
            const allMasterClassesResult = await pool.query(`
                SELECT mce.*, s.name as school_name
                FROM master_class_events mce
                LEFT JOIN schools s ON mce.school_id = s.id
                WHERE mce.date >= CURRENT_DATE
                ORDER BY mce.date ASC
            `);
            console.log('=== CHILD DASHBOARD DEBUG ===');
            console.log('User data:', { userId, userSchoolId, userClassGroup });
            console.log('All future master classes:');
            allMasterClassesResult.rows.forEach((mc, index) => {
                const schoolMatch = mc.school_id === userSchoolId;
                const classMatch = mc.class_group === userClassGroup;
                console.log(`${index + 1}. ${mc.notes || 'Мастер-класс'}`);
                console.log(`   School ID: ${mc.school_id} (matches: ${schoolMatch})`);
                console.log(`   Class Group: ${mc.class_group} (matches: ${classMatch})`);
                console.log(`   Date: ${mc.date}`);
                console.log(`   School Name: ${mc.school_name}`);
                console.log(`   Both match: ${schoolMatch && classMatch}`);
                console.log('');
            });
            console.log('Filtered result:', {
                foundMasterClasses: listResult.rows.length,
                total: parseInt(countResult.rows[0].count),
                query: query.replace(/\s+/g, ' ').trim(),
                params
            });
            if (listResult.rows.length > 0) {
                console.log('Found matching master classes:');
                listResult.rows.forEach((mc, index) => {
                    console.log(`${index + 1}. ${mc.notes || 'Мастер-класс'} - ${mc.date}`);
                });
            }
            console.log('=== END DEBUG ===');
        }
        // Форматируем даты для правильной передачи на фронтенд
        const formattedMasterClasses = listResult.rows.map(mc => {
            // Отладочная информация для понимания проблемы с датами
            console.log('getMasterClassEvents: форматируем дату:', {
                originalDate: mc.date,
                originalDateType: typeof mc.date,
                isDate: mc.date instanceof Date,
                toISOString: mc.date instanceof Date ? mc.date.toISOString() : 'N/A',
                toLocaleDateString: mc.date instanceof Date ? mc.date.toLocaleDateString() : 'N/A'
            });
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
    }
    catch (error) {
        console.error('Get master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
export const getMasterClassEventByIdNew = async (req, res) => {
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
                        executorMap.set(executor.id, `${executor.name} ${executor.surname}`);
                    });
                    // Заменяем ID на имена
                    masterClass.executor_names = executorIds.map((executorId) => executorMap.get(executorId) || executorId);
                    masterClass.executors_original = executorIds; // Сохраняем оригинальные ID
                }
            }
            catch (executorError) {
                console.error('Error fetching executor names:', executorError);
                // В случае ошибки оставляем оригинальные ID
                masterClass.executor_names = masterClass.executors;
            }
        }
        res.json({ success: true, data: masterClass });
    }
    catch (error) {
        console.error('Get master class event error:', error);
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
        // Обрабатываем участников, если они есть
        if (masterClass.participants && Array.isArray(masterClass.participants)) {
            // Участники уже содержат примечания из createGroupWorkshopRegistration и addParticipantToMasterClass
            console.log('Участники мастер-класса:', masterClass.participants.length);
            masterClass.participants.forEach((participant, index) => {
                console.log(`Участник ${index + 1}:`, {
                    childName: participant.childName,
                    notes: participant.notes,
                    hasNotes: !!participant.notes
                });
            });
        }
        res.json({ success: true, data: masterClass });
    }
    catch (error) {
        console.error('Get master class event error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
export const createMasterClassEvent = async (req, res) => {
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
        }
        catch (checkError) {
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
    }
    catch (error) {
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
export const createMultipleMasterClassEvents = async (req, res) => {
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
        }
        catch (checkError) {
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
            }
            catch (error) {
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
        }
        else {
            res.status(201).json({
                success: true,
                data: results,
                message: `Успешно создано ${results.length} мастер-классов`
            });
        }
    }
    catch (error) {
        console.error('Create multiple master class events error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
export const updateMasterClassEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body || {};
        // Ограничим набор полей
        const allowed = {};
        if (update.date !== undefined)
            allowed.date = update.date;
        if (update.time !== undefined)
            allowed.time = update.time;
        if (update.schoolId !== undefined)
            allowed.school_id = update.schoolId;
        if (update.classGroup !== undefined)
            allowed.class_group = update.classGroup;
        if (update.serviceId !== undefined)
            allowed.service_id = update.serviceId;
        if (update.executors !== undefined)
            allowed.executors = update.executors;
        if (update.notes !== undefined)
            allowed.notes = update.notes;
        if (update.participants !== undefined)
            allowed.participants = update.participants;
        if (update.statistics !== undefined)
            allowed.statistics = update.statistics;
        const fields = Object.keys(allowed);
        if (fields.length === 0) {
            res.status(400).json({ success: false, error: 'No valid fields to update' });
            return;
        }
        const setClause = fields.map((f, i) => {
            if (f === 'schoolId')
                return `school_id = $${i + 2}`;
            if (f === 'classGroup')
                return `class_group = $${i + 2}`;
            if (f === 'executors')
                return `executors = $${i + 2}`;
            if (f === 'participants')
                return `participants = $${i + 2}`;
            if (f === 'statistics')
                return `statistics = $${i + 2}`;
            return `${f} = $${i + 2}`;
        }).join(', ');
        const values = fields.map((f) => {
            if (f === 'executors' || f === 'participants' || f === 'statistics') {
                return JSON.stringify(allowed[f]);
            }
            else {
                return allowed[f];
            }
        });
        const result = await pool.query(`UPDATE master_class_events SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, ...values]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Master class event not found' });
            return;
        }
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Master class event updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating master class event:', error);
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
        const statistics = masterClass.statistics || {};
        // Находим и обновляем участника
        const participantIndex = participants.findIndex((p) => p.id === participantId);
        if (participantIndex === -1) {
            res.status(404).json({ success: false, error: 'Participant not found' });
            return;
        }
        const oldPaymentStatus = participants[participantIndex].isPaid;
        participants[participantIndex].isPaid = isPaid;
        // Обновляем статистику
        let paidAmount = statistics.paidAmount || 0;
        let unpaidAmount = statistics.unpaidAmount || 0;
        if (oldPaymentStatus && !isPaid) {
            // Было оплачено, стало не оплачено
            paidAmount -= participants[participantIndex].totalAmount || 0;
            unpaidAmount += participants[participantIndex].totalAmount || 0;
        }
        else if (!oldPaymentStatus && isPaid) {
            // Было не оплачено, стало оплачено
            paidAmount += participants[participantIndex].totalAmount || 0;
            unpaidAmount -= participants[participantIndex].totalAmount || 0;
        }
        // Обновляем мастер-класс
        const updateResult = await pool.query(`UPDATE master_class_events 
             SET participants = $1, 
                 statistics = jsonb_set(
                     COALESCE(statistics, '{}'::jsonb),
                     '{paidAmount}', to_jsonb($2)
                 ),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`, [JSON.stringify(participants), paidAmount, masterClassId]);
        if (updateResult.rows.length === 0) {
            res.status(500).json({ success: false, error: 'Failed to update master class' });
            return;
        }
        res.json({
            success: true,
            data: updateResult.rows[0],
            message: 'Participant payment status updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating participant payment status:', error);
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
//# sourceMappingURL=masterClasses.js.map