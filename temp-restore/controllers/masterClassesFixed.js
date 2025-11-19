import pool from '../database/connection.js';
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
//# sourceMappingURL=masterClassesFixed.js.map