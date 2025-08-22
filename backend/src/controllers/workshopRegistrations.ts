/**
 * @file: workshopRegistrations.ts
 * @description: Контроллер для управления записями на мастер-классы
 * @dependencies: database, types
 * @created: 2024-12-19
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { CreateWorkshopRegistrationRequest, WorkshopRegistration } from '../types/index.js';

// Получить записи пользователя на мастер-классы
export const getUserWorkshopRegistrations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const result = await pool.query(`
            SELECT wr.*, mce.date as "workshopDate", mce.time as "workshopTime", 
                   s.name as "schoolName", s.address as "schoolAddress", mce.class_group as "classGroup",
                   srv.name as "serviceName"
            FROM workshop_registrations wr
            JOIN master_class_events mce ON wr.workshop_id = mce.id
            LEFT JOIN schools s ON mce.school_id = s.id
            LEFT JOIN services srv ON mce.service_id = srv.id
            WHERE wr.user_id = $1
            ORDER BY mce.date ASC
        `, [userId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting user workshop registrations:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Получить все записи на мастер-класс
export const getWorkshopRegistrations = async (req: Request, res: Response) => {
    try {
        const { workshopId } = req.params;

        const result = await pool.query(`
            SELECT wr.*, u.name as "userName", u.class as "userClass", u.class_group as "userClassGroup", u.school_name as "schoolName"
            FROM workshop_registrations wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.workshop_id = $1
            ORDER BY wr.created_at DESC
        `, [workshopId]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting workshop registrations:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Создать новую запись на мастер-класс
export const createWorkshopRegistration = async (req: Request, res: Response) => {
    try {
        console.log('=== НАЧАЛО createWorkshopRegistration ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers);

        const { workshopId, userId, style, options, totalPrice }: CreateWorkshopRegistrationRequest = req.body;

        console.log('Создание записи на мастер-класс:', { workshopId, userId, style, options, totalPrice });

        // Валидация входных данных
        if (!workshopId || !userId || !style || !options || typeof totalPrice !== 'number') {
            console.error('❌ Неверные входные данные:', { workshopId, userId, style, options, totalPrice });
            return res.status(400).json({
                error: 'Invalid input data',
                details: {
                    workshopId: !!workshopId,
                    userId: !!userId,
                    style: !!style,
                    options: Array.isArray(options),
                    totalPrice: typeof totalPrice
                }
            });
        }

        console.log('🔌 Проверяем подключение к базе данных...');

        // Получаем информацию о пользователе
        console.log('👤 Получаем информацию о пользователе...');
        const userResult = await pool.query('SELECT name, class, class_group, school_name FROM users WHERE id = $1', [userId]);
        console.log('Информация о пользователе:', userResult.rows[0]);
        if (userResult.rows.length === 0) {
            console.error('❌ Пользователь не найден:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Проверяем, не записан ли уже пользователь на этот мастер-класс
        const existingResult = await pool.query(
            'SELECT id FROM workshop_registrations WHERE workshop_id = $1 AND user_id = $2',
            [workshopId, userId]
        );

        console.log('Проверка существующих записей в workshop_registrations:', existingResult.rows);

        if (existingResult.rows.length > 0) {
            console.log('Пользователь уже записан в workshop_registrations:', userId);
            return res.status(400).json({ error: 'User already registered for this workshop' });
        }

        // Дополнительно проверяем, не записан ли пользователь в participants мастер-класса
        const workshopResult = await pool.query(
            'SELECT participants FROM master_class_events WHERE id = $1',
            [workshopId]
        );

        if (workshopResult.rows.length > 0) {
            const participants = workshopResult.rows[0].participants || [];
            console.log('Текущие участники мастер-класса:', participants);
            // Проверяем по полю childId, которое используется в addParticipantToMasterClass
            const isAlreadyParticipant = participants.some((p: Record<string, unknown>) => p.childId === userId);

            if (isAlreadyParticipant) {
                console.log('Пользователь уже является участником мастер-класса:', userId);
                return res.status(400).json({ error: 'User already registered for this workshop' });
            }

            console.log('Пользователь не найден в participants, продолжаем регистрацию');
        }

        // Создаем запись
        console.log('Создаем запись в workshop_registrations...');
        const result = await pool.query(`
            INSERT INTO workshop_registrations (
                workshop_id, user_id, style, options, total_price, status
            ) VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING *
        `, [workshopId, userId, style, JSON.stringify(options), totalPrice]);
        console.log('Запись в workshop_registrations создана:', result.rows[0]);

        // Получаем информацию о пользователе для добавления в participants
        const user = userResult.rows[0];

        // Получаем информацию о стилях и опциях для статистики
        // Стили и опции хранятся в JSONB полях таблицы services
        let styleName = style; // По умолчанию используем переданное значение
        let optionsNames: string[] = [];

        try {
            // Получаем информацию о сервисе для извлечения названий стилей и опций
            const serviceResult = await pool.query(`
                SELECT s.styles, s.options 
                FROM services s 
                JOIN master_class_events mce ON s.id = mce.service_id 
                WHERE mce.id = $1
            `, [workshopId]);

            if (serviceResult.rows.length > 0) {
                const service = serviceResult.rows[0];
                const serviceStyles = service.styles || [];
                const serviceOptions = service.options || [];

                // Ищем название стиля по ID
                const foundStyle = serviceStyles.find((s: { id: string; name: string }) => s.id === style);
                if (foundStyle) {
                    styleName = foundStyle.name || style;
                }

                // Ищем названия опций по ID
                optionsNames = options
                    .map(optionId => {
                        const foundOption = serviceOptions.find((o: { id: string; name: string }) => o.id === optionId);
                        return foundOption?.name || optionId;
                    })
                    .filter(Boolean);
            }
        } catch (error) {
            console.warn('Не удалось получить названия стилей/опций из сервиса:', error);
            // Продолжаем работу с переданными значениями
        }

        // Проверяем, это детская регистрация (одиночная) или родительская (групповая)
        // Для детской регистрации участник будет добавлен в invoice controller
        // Для родительской групповой регистрации добавляем участника здесь

        // В данном случае это одиночная детская регистрация - НЕ добавляем участника
        console.log('Одиночная детская регистрация - участник будет добавлен при создании счета');

        // Для одиночной детской регистрации статистика обновляется в invoice controller
        // Для групповой родительской регистрации статистика обновляется здесь
        console.log('Статистика будет обновлена при создании счета для детской регистрации');

        // ДОБАВЛЯЕМ УЧАСТНИКА В МАСТЕР-КЛАСС СРАЗУ ПРИ СОЗДАНИИ РЕГИСТРАЦИИ
        console.log('🔍 Добавляем участника в мастер-класс при создании детской регистрации...');

        try {
            // Получаем информацию о мастер-классе
            const workshopResult = await pool.query(
                'SELECT participants, statistics FROM master_class_events WHERE id = $1',
                [workshopId]
            );

            if (workshopResult.rows.length > 0) {
                const workshop = workshopResult.rows[0];
                const currentParticipants = workshop.participants || [];
                const currentStats = workshop.statistics || {};

                // Создаем объект участника
                const participant = {
                    id: result.rows[0].id, // ID регистрации
                    childId: userId,
                    childName: user.name,
                    parentId: userId, // В детском интерфейсе parentId = childId
                    parentName: user.name,
                    selectedStyles: [styleName], // Используем найденное название стиля
                    selectedOptions: optionsNames, // Используем найденные названия опций
                    totalAmount: totalPrice,
                    isPaid: false,
                    hasReceived: false,
                    paymentMethod: undefined,
                    paymentDate: undefined,
                    notes: `Детская регистрация. ID: ${result.rows[0].id}. Участник: ${userId}`
                };

                console.log('🔍 Добавляем участника:', JSON.stringify(participant));

                // Обновляем поле participants в master_class_events
                const updateParticipantsResult = await pool.query(`
                    UPDATE master_class_events 
                    SET participants = COALESCE(participants, '[]'::jsonb) || $1::jsonb,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING id, participants
                `, [JSON.stringify([participant]), workshopId]);

                if (updateParticipantsResult.rows.length === 0) {
                    console.error('❌ Мастер-класс с ID не найден при обновлении participants:', workshopId);
                } else {
                    console.log('✅ Участник добавлен в мастер-класс:', {
                        masterClassId: workshopId,
                        newParticipants: updateParticipantsResult.rows[0].participants
                    });

                    // Обновляем статистику
                    const newStylesStats = { ...(currentStats.stylesStats || {}) };
                    const newOptionsStats = { ...(currentStats.optionsStats || {}) };

                    // Добавляем новые стили к существующим
                    [styleName].forEach((styleNameStr: string) => {
                        newStylesStats[styleNameStr] = (newStylesStats[styleNameStr] || 0) + 1;
                    });

                    // Добавляем новые опции к существующим
                    optionsNames.forEach((optionName: string) => {
                        newOptionsStats[optionName] = (newOptionsStats[optionName] || 0) + 1;
                    });

                    const updateStatsResult = await pool.query(`
                        UPDATE master_class_events 
                        SET statistics = jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            COALESCE(statistics, '{}'::jsonb),
                                            '{totalParticipants}',
                                            to_jsonb(COALESCE((statistics->>'totalParticipants')::int, 0) + 1)
                                        ),
                                        '{totalAmount}',
                                        to_jsonb(COALESCE((statistics->>'totalAmount')::int, 0) + $1)
                                    ),
                                    '{unpaidAmount}',
                                    to_jsonb(COALESCE((statistics->>'unpaidAmount')::int, 0) + $1)
                                ),
                                '{stylesStats}',
                                to_jsonb($2)
                            ),
                            '{optionsStats}',
                            to_jsonb($3)
                        ),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE id = $4
                        RETURNING id, statistics
                    `, [totalPrice, newStylesStats, newOptionsStats, workshopId]);

                    if (updateStatsResult.rows.length > 0) {
                        console.log('✅ Статистика обновлена:', {
                            masterClassId: workshopId,
                            newStatistics: updateStatsResult.rows[0].statistics
                        });
                    }
                }
            }
        } catch (participantError) {
            console.error('❌ Ошибка при добавлении участника в мастер-класс:', participantError);
            // Не прерываем создание регистрации, просто логируем ошибку
        }

        // Получаем созданную запись
        console.log('Получаем финальную запись для ответа...');
        const newRegistrationResult = await pool.query(`
            SELECT wr.*, u.name as "userName", u.class as "userClass", u.class_group as "userClassGroup", u.school_name as "schoolName"
            FROM workshop_registrations wr
            JOIN users u ON wr.user_id = u.id
            WHERE wr.id = $1
        `, [result.rows[0].id]);

        console.log('Запись на мастер-класс создана успешно:', newRegistrationResult.rows[0]);
        console.log('=== РЕГИСТРАЦИЯ ЗАВЕРШЕНА УСПЕШНО ===');
        return res.status(201).json(newRegistrationResult.rows[0]);
    } catch (error) {
        console.error('=== ОШИБКА ПРИ СОЗДАНИИ ЗАПИСИ НА МАСТЕР-КЛАСС ===');
        console.error('Детали ошибки:', error);
        console.error('Стек вызовов:', error instanceof Error ? error.stack : 'Неизвестно');
        console.error('Тип ошибки:', typeof error);
        console.error('Конструктор ошибки:', error?.constructor?.name);

        // Возвращаем более детальную информацию об ошибке
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
    }
};

// Создать групповую регистрацию на мастер-класс (несколько детей, один счет)
export const createGroupWorkshopRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== НАЧАЛО createGroupWorkshopRegistration ===');
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers);

        const { workshopId, parentId, children }: {
            workshopId: string;
            parentId: string;
            children: Array<{
                childId: string;
                childName: string;
                style: string;
                options: string[];
                totalPrice: number;
            }>;
        } = req.body;

        console.log('Создание групповой записи на мастер-класс:', {
            workshopId,
            parentId,
            childrenCount: children.length,
            children: children.map(c => ({ childId: c.childId, childName: c.childName }))
        });

        // Валидация входных данных
        if (!workshopId || !parentId || !children || !Array.isArray(children) || children.length === 0) {
            console.error('❌ Неверные входные данные:', { workshopId, parentId, children });
            res.status(400).json({
                error: 'Invalid input data',
                details: {
                    workshopId: !!workshopId,
                    parentId: !!parentId,
                    children: Array.isArray(children),
                    childrenLength: children?.length
                }
            });
            return;
        }

        console.log('🔌 Подключаемся к базе данных...');
        const client = await pool.connect();
        console.log('✅ Подключение к базе данных установлено');

        try {
            console.log('🔄 Начинаем транзакцию...');
            await client.query('BEGIN');
            console.log('✅ Транзакция начата');

            // Получаем информацию о родителе
            const parentResult = await client.query(
                'SELECT name, surname FROM users WHERE id = $1',
                [parentId]
            );

            if (parentResult.rows.length === 0) {
                await client.query('ROLLBACK');
                res.status(404).json({ error: 'Parent not found' });
                return;
            }

            const parent = parentResult.rows[0];
            const parentName = parent.surname ? `${parent.name} ${parent.surname}` : parent.name;

            // Получаем информацию о мастер-классе с данными школы
            const workshopResult = await client.query(`
                SELECT mce.date, mce.time, mce.class_group, s.name as school_name, s.address
                FROM master_class_events mce
                LEFT JOIN schools s ON mce.school_id = s.id
                WHERE mce.id = $1
            `, [workshopId]);

            if (workshopResult.rows.length === 0) {
                await client.query('ROLLBACK');
                res.status(404).json({ error: 'Workshop not found' });
                return;
            }

            const workshop = workshopResult.rows[0];

            // Извлекаем город из адреса школы (до первой запятой)
            const extractCityFromAddress = (address: string): string => {
                if (!address) return 'Не указан';
                const city = address.split(',')[0]?.trim();
                return city || 'Не указан';
            };

            const city = extractCityFromAddress(workshop.address);

            // Проверяем, не записаны ли уже дети на этот мастер-класс
            for (const child of children) {
                console.log(`🔍 Проверяем ребенка ${child.childName} (ID: ${child.childId}) на дублирование...`);

                const existingResult = await client.query(
                    'SELECT id FROM workshop_registrations WHERE workshop_id = $1 AND user_id = $2',
                    [workshopId, child.childId]
                );

                if (existingResult.rows.length > 0) {
                    console.log(`❌ Ребенок ${child.childName} уже зарегистрирован в workshop_registrations`);
                    await client.query('ROLLBACK');
                    res.status(400).json({
                        error: `Child ${child.childName} already registered for this workshop`
                    });
                    return;
                }

                // Проверяем в participants мастер-класса
                const workshopParticipantsResult = await client.query(
                    'SELECT participants FROM master_class_events WHERE id = $1',
                    [workshopId]
                );

                if (workshopParticipantsResult.rows[0]?.participants) {
                    const participants = workshopParticipantsResult.rows[0].participants;
                    const isAlreadyParticipant = participants.some((p: Record<string, unknown>) => p.childId === child.childId);

                    if (isAlreadyParticipant) {
                        console.log(`❌ Ребенок ${child.childName} уже является участником мастер-класса`);
                        await client.query('ROLLBACK');
                        res.status(400).json({
                            error: `Child ${child.childName} already registered for this workshop`
                        });
                        return;
                    }
                }

                console.log(`✅ Ребенок ${child.childName} не найден в дублирующих записях`);
            }

            // Создаем один счет за всех детей
            const totalAmount = children.reduce((sum, child) => sum + child.totalPrice, 0);

            // Получаем информацию о сервисе для извлечения названий и цен стилей и опций
            const invoiceServiceResult = await client.query(`
                SELECT s.styles, s.options 
                FROM services s 
                JOIN master_class_events mce ON s.id = mce.service_id 
                WHERE mce.id = $1
            `, [workshopId]);

            let invoiceServiceStyles: Array<{ id: string; name: string; price: number }> = [];
            let invoiceServiceOptions: Array<{ id: string; name: string; price: number }> = [];

            if (invoiceServiceResult.rows.length > 0) {
                invoiceServiceStyles = invoiceServiceResult.rows[0].styles || [];
                invoiceServiceOptions = invoiceServiceResult.rows[0].options || [];
            }

            // Собираем все уникальные стили и опции от всех детей для счета
            const allStyles = children.reduce((styles, child) => {
                if (child.style) {
                    const childStyles = child.style.split(', ').filter(Boolean);
                    styles.push(...childStyles);
                }
                return styles;
            }, [] as string[]);

            const allOptions = children.reduce((options, child) => {
                if (child.options && child.options.length > 0) {
                    options.push(...child.options);
                }
                return options;
            }, [] as string[]);

            // Создаем правильные объекты стилей и опций с названиями и ценами
            const selectedStyles = allStyles.map(styleId => {
                const style = invoiceServiceStyles.find((s: { id: string; name: string; price: number }) => s.id === styleId);
                return {
                    id: styleId,
                    name: style?.name || styleId,
                    price: style?.price || 0
                };
            });

            const selectedOptions = allOptions.map(optionId => {
                const option = invoiceServiceOptions.find((o: { id: string; name: string; price: number }) => o.id === optionId);
                return {
                    id: optionId,
                    name: option?.name || optionId,
                    price: option?.price || 0
                };
            });

            console.log('🔍 Создаем счет с правильными данными:', {
                selectedStyles,
                selectedOptions,
                totalAmount,
                parentName
            });

            const invoiceResult = await client.query(`
                INSERT INTO invoices (
                    master_class_id, workshop_date, city, school_name, class_group,
                    participant_name, participant_id, amount, selected_styles, selected_options
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `, [
                workshopId,
                workshop.date || new Date().toISOString().split('T')[0], // Используем workshop.date или текущую дату
                city, // Используем извлеченный город из адреса школы
                workshop.school_name || 'Не указано',
                workshop.class_group || 'Не указан',
                `${parentName} (${children.length} детей)`,
                parentId,
                totalAmount,
                JSON.stringify(selectedStyles),
                JSON.stringify(selectedOptions)
            ]);

            const invoice = invoiceResult.rows[0];
            console.log('Создан групповой счет:', invoice);

            // Создаем записи в workshop_registrations для каждого ребенка
            // Примечание: user_id в workshop_registrations содержит ID ребенка, а не родителя
            const registrations = [];
            for (const child of children) {
                const registrationResult = await client.query(`
                    INSERT INTO workshop_registrations (
                        workshop_id, user_id, style, options, total_price, status
                    ) VALUES ($1, $2, $3, $4, $5, 'pending')
                    RETURNING *
                `, [workshopId, child.childId, child.style, JSON.stringify(child.options || []), child.totalPrice]);

                registrations.push(registrationResult.rows[0]);
                console.log(`Создана регистрация для ${child.childName} (childId: ${child.childId}):`, registrationResult.rows[0]);
            }

            // Добавляем всех детей в participants мастер-класса
            // Используем новую структуру данных с объектами для стилей и опций
            const participants = children.map((child, index) => {
                // Формируем selectedStyles как массив объектов с id и name
                let selectedStyles: Array<{ id: string; name: string }> = [];
                if (child.style) {
                    const styleIds = child.style.split(', ').filter(Boolean);
                    selectedStyles = styleIds.map(styleId => {
                        const foundStyle = invoiceServiceStyles.find((s: Record<string, unknown>) => s.id === styleId);
                        return {
                            id: styleId,
                            name: foundStyle?.name || styleId
                        };
                    });
                }

                // Формируем selectedOptions как массив объектов с id и name
                let selectedOptions: Array<{ id: string; name: string }> = [];
                if (child.options && child.options.length > 0) {
                    selectedOptions = child.options.map(optionId => {
                        const foundOption = invoiceServiceOptions.find((o: Record<string, unknown>) => o.id === optionId);
                        return {
                            id: optionId,
                            name: foundOption?.name || optionId
                        };
                    });
                }

                return {
                    id: `${invoice.id}_${index}`, // Уникальный ID для каждого участника
                    childId: child.childId,
                    childName: child.childName,
                    parentId: parentId, // ID родителя
                    parentName: parentName,
                    selectedStyles,
                    selectedOptions,
                    totalAmount: child.totalPrice,
                    isPaid: false,
                    hasReceived: false,
                    paymentMethod: undefined,
                    paymentDate: undefined,
                    notes: `Групповая регистрация. Счет: ${invoice.id}. Родитель: ${parentId}`
                };
            });

            // Обновляем поле participants в master_class_events
            await client.query(`
                UPDATE master_class_events 
                SET participants = COALESCE(participants, '[]'::jsonb) || $1::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [JSON.stringify(participants), workshopId]);

            // Обновляем статистику в master_class_events (используем поле statistics)
            const currentStatsResult = await client.query(
                'SELECT statistics FROM master_class_events WHERE id = $1',
                [workshopId]
            );

            const currentStats = currentStatsResult.rows[0]?.statistics || {};
            const currentParticipants = currentStats.totalParticipants || 0;
            const currentRevenue = currentStats.totalAmount || 0;
            const currentStylesStats = currentStats.stylesStats || {};
            const currentOptionsStats = currentStats.optionsStats || {};

            // Собираем статистику по стилям и опциям от всех детей
            const newStylesStats = { ...currentStylesStats };
            const newOptionsStats = { ...currentOptionsStats };

            // Получаем информацию о сервисе для извлечения названий стилей и опций
            const serviceResult = await client.query(
                'SELECT styles, options FROM services WHERE id = (SELECT service_id FROM master_class_events WHERE id = $1)',
                [workshopId]
            );

            const serviceStyles = serviceResult.rows[0]?.styles || [];
            const serviceOptions = serviceResult.rows[0]?.options || [];

            // Создаем карты для стилей и опций
            const stylesMap: { [key: string]: string } = {};
            const optionsMap: { [key: string]: string } = {};

            serviceStyles.forEach((style: Record<string, unknown>) => {
                if (style.id && style.name) {
                    stylesMap[String(style.id)] = String(style.name);
                }
            });

            serviceOptions.forEach((option: Record<string, unknown>) => {
                if (option.id && option.name) {
                    optionsMap[String(option.id)] = String(option.name);
                }
            });

            // Теперь обновляем статистику по стилям и опциям
            for (const child of children) {
                // Добавляем стили ребенка к статистике
                if (child.style) {
                    const childStyles = child.style.split(', ').filter(Boolean);
                    childStyles.forEach(styleId => {
                        const styleName = stylesMap[styleId] || styleId;
                        newStylesStats[styleName] = (newStylesStats[styleName] || 0) + 1;
                    });
                }

                // Добавляем опции ребенка к статистике
                if (child.options && child.options.length > 0) {
                    child.options.forEach(optionId => {
                        const optionName = optionsMap[optionId] || optionId;
                        newOptionsStats[optionName] = (newOptionsStats[optionName] || 0) + 1;
                    });
                }
            }

            const newStats = {
                ...currentStats,
                totalParticipants: currentParticipants + children.length,
                totalAmount: currentRevenue + totalAmount,
                unpaidAmount: (currentStats.unpaidAmount || 0) + totalAmount,
                stylesStats: newStylesStats,
                optionsStats: newOptionsStats
            };

            // Обновляем статистику по частям, чтобы избежать ошибок типизации
            const finalStats = {
                ...currentStats,
                totalParticipants: currentParticipants + children.length,
                totalAmount: currentRevenue + totalAmount,
                unpaidAmount: (currentStats.unpaidAmount || 0) + totalAmount,
                stylesStats: newStylesStats,
                optionsStats: newOptionsStats
            };

            await client.query(`
                UPDATE master_class_events 
                SET statistics = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [JSON.stringify(finalStats), workshopId]);

            await client.query('COMMIT');

            console.log('=== ГРУППОВАЯ РЕГИСТРАЦИЯ ЗАВЕРШЕНА УСПЕШНО ===');
            console.log('Создан счет:', invoice.id);
            console.log('Создано регистраций:', registrations.length);
            console.log('Добавлено участников:', participants.length);

            res.status(201).json({
                invoice,
                registrations,
                participants: participants.length
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('=== ОШИБКА ПРИ СОЗДАНИИ ГРУППОВОЙ ЗАПИСИ НА МАСТЕР-КЛАСС ===');
        console.error('Детали ошибки:', error);
        console.error('Стек вызовов:', error instanceof Error ? error.stack : 'Неизвестно');
        console.error('Тип ошибки:', typeof error);
        console.error('Конструктор ошибки:', error?.constructor?.name);

        // Возвращаем более детальную информацию об ошибке
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
    }
};

// Обновить статус записи
export const updateRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.query(`
            UPDATE workshop_registrations 
            SET status = $1
            WHERE id = $2
        `, [status, id]);

        return res.json({ message: 'Статус записи успешно обновлен' });
    } catch (error) {
        console.error('Ошибка при обновлении статуса записи:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Получить статистику по мастер-классу
export const getWorkshopStats = async (workshopId: string) => {
    try {
        // Получаем все регистрации для мастер-класса
        const registrationsResult = await pool.query(`
            SELECT * FROM workshop_registrations 
            WHERE workshop_id = $1
        `, [workshopId]);

        const registrations = registrationsResult.rows;

        // Подсчитываем статистику
        const totalRegistrations = registrations.length;
        const confirmedRegistrations = registrations.filter((r: Record<string, unknown>) => r.status === 'confirmed').length;
        const totalRevenue = registrations.reduce((sum: number, r: Record<string, unknown>) => sum + (parseFloat(String(r.total_price)) || 0), 0);

        // Получаем информацию о мастер-классе
        const workshopResult = await pool.query(`
            SELECT * FROM master_class_events 
            WHERE id = $1
        `, [workshopId]);

        const workshop = workshopResult.rows[0];

        return {
            workshopId,
            workshopTitle: workshop?.notes || 'Неизвестный мастер-класс',
            totalRegistrations,
            confirmedRegistrations,
            pendingRegistrations: totalRegistrations - confirmedRegistrations,
            totalRevenue,
            maxParticipants: 0, // Поле max_participants не существует в таблице master_class_events
            currentParticipants: totalRegistrations,
            isFull: false // Пока не реализована логика ограничения участников
        };
    } catch (error) {
        console.error('Ошибка при получении статистики мастер-класса:', error);
        throw new Error('Failed to get workshop stats');
    }
};

// Проверить, зарегистрирован ли пользователь на мастер-класс
export const checkRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { workshopId, userId } = req.body;

        if (!workshopId || !userId) {
            res.status(400).json({
                error: 'Missing required fields',
                details: { workshopId: !!workshopId, userId: !!userId }
            });
            return;
        }

        console.log('Проверка регистрации:', { workshopId, userId });

        // Проверяем в workshop_registrations
        const existingResult = await pool.query(
            'SELECT id FROM workshop_registrations WHERE workshop_id = $1 AND user_id = $2',
            [workshopId, userId]
        );

        // Проверяем в participants мастер-класса
        const workshopResult = await pool.query(
            'SELECT participants FROM master_class_events WHERE id = $1',
            [workshopId]
        );

        let isInParticipants = false;
        if (workshopResult.rows.length > 0) {
            const participants = workshopResult.rows[0].participants || [];
            isInParticipants = participants.some((p: Record<string, unknown>) => p.childId === userId);
        }

        const alreadyRegistered = existingResult.rows.length > 0 || isInParticipants;

        console.log('Результат проверки:', {
            inWorkshopRegistrations: existingResult.rows.length > 0,
            inParticipants: isInParticipants,
            alreadyRegistered
        });

        res.json({
            alreadyRegistered,
            details: {
                inWorkshopRegistrations: existingResult.rows.length > 0,
                inParticipants: isInParticipants
            }
        });

    } catch (error) {
        console.error('Ошибка при проверке регистрации:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

// Удалить участника из мастер-класса
export const removeParticipant = async (req: Request, res: Response) => {
    try {
        const { workshopId, userId } = req.body;

        console.log('Удаление участника из мастер-класса:', { workshopId, userId });

        // Получаем информацию о записи участника
        const registrationResult = await pool.query(
            'SELECT * FROM workshop_registrations WHERE workshop_id = $1 AND user_id = $2',
            [workshopId, userId]
        );

        if (registrationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Участник не найден в мастер-классе' });
        }

        const registration = registrationResult.rows[0];

        // Удаляем запись из workshop_registrations
        await pool.query(
            'DELETE FROM workshop_registrations WHERE workshop_id = $1 AND user_id = $2',
            [workshopId, userId]
        );

        console.log('Запись из workshop_registrations удалена');

        // Удаляем участника из поля participants в master_class_events
        await pool.query(`
            UPDATE master_class_events 
            SET participants = participants - jsonb_path_query_array(participants, '$[*] ? (@.childId == $1)'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [userId, workshopId]);

        console.log('Участник удален из participants');

        // Обновляем статистику в master_class_events
        await pool.query(`
            UPDATE master_class_events 
            SET statistics = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        COALESCE(statistics, '{}'::jsonb),
                        '{totalParticipants}',
                        to_jsonb(GREATEST(COALESCE((statistics->>'totalParticipants')::int, 0) - 1, 0))
                    ),
                    '{totalAmount}',
                    to_jsonb(GREATEST(COALESCE((statistics->>'totalAmount')::int, 0) - $1, 0))
                ),
                '{unpaidAmount}',
                to_jsonb(GREATEST(COALESCE((statistics->>'unpaidAmount')::int, 0) - $1, 0))
            ),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [registration.total_price, workshopId]);

        console.log('Статистика обновлена после удаления участника');

        return res.json({
            success: true,
            message: 'Участник успешно удален из мастер-класса'
        });

    } catch (error) {
        console.error('Ошибка при удалении участника:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
