/**
 * @file: invoices.ts
 * @description: Контроллер для управления счетами мастер-классов
 * @dependencies: types/index.ts, database/connection.ts
 * @created: 2024-12-19
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { Invoice, CreateInvoiceRequest, InvoiceFilters, ApiResponse } from '../types/index.js';
import { wsManager } from '../websocket-server.js';

// Функция для добавления участника в мастер-класс
const addParticipantToMasterClass = async (client: any, invoice: Invoice) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log('🔄 Добавляем участника в мастер-класс:', {
        masterClassId: invoice.master_class_id,
        participantId: invoice.participant_id,
        participantName: invoice.participant_name,
        amount: invoice.amount,
        invoiceId: invoice.id
    });

    // Проверяем обязательные поля
    if (!invoice.master_class_id || !invoice.participant_id || !invoice.id) {
        throw new Error(`Отсутствуют обязательные поля: master_class_id=${invoice.master_class_id}, participant_id=${invoice.participant_id}, invoice_id=${invoice.id}`);
    }

    // Создаем объект участника для добавления в master_class_events.participants
    // Преобразуем стили и опции в единый формат строк для отображения галочек
    console.log('🔍 Разбираем стили и опции:', {
        selected_styles: invoice.selected_styles,
        selected_styles_type: typeof invoice.selected_styles,
        selected_options: invoice.selected_options,
        selected_options_type: typeof invoice.selected_options
    });

    // Парсим JSON, если это строка
    let parsedStyles = invoice.selected_styles;
    if (typeof parsedStyles === 'string') {
        try {
            parsedStyles = JSON.parse(parsedStyles);
        } catch (e) {
            console.error('Ошибка парсинга стилей:', e);
            parsedStyles = [];
        }
    }

    let parsedOptions = invoice.selected_options;
    if (typeof parsedOptions === 'string') {
        try {
            parsedOptions = JSON.parse(parsedOptions);
        } catch (e) {
            console.error('Ошибка парсинга опций:', e);
            parsedOptions = [];
        }
    }

    const stylesArray = Array.isArray(parsedStyles)
        ? parsedStyles.map((style: string | { id?: string; name?: string }) => {
            if (typeof style === 'string') {
                return { id: style, name: style };
            } else {
                return {
                    id: style?.id || style?.name || 'Unknown',
                    name: style?.name || style?.id || 'Unknown'
                };
            }
        })
        : [];

    const optionsArray = Array.isArray(parsedOptions)
        ? parsedOptions.map((option: string | { id?: string; name?: string }) => {
            if (typeof option === 'string') {
                return { id: option, name: option };
            } else {
                return {
                    id: option?.id || option?.name || 'Unknown',
                    name: option?.name || option?.id || 'Unknown'
                };
            }
        })
        : [];

    console.log('✅ Обработанные стили и опции:', {
        stylesArray,
        optionsArray
    });

    // Получаем информацию о ребенке и родителе
    console.log('🔍 Получаем информацию о родителе:', invoice.participant_id);
    const parentResult = await client.query(
        'SELECT name, surname FROM users WHERE id = $1',
        [invoice.participant_id]
    );

    console.log('🔍 Результат запроса родителя:', parentResult.rows[0] || null);

    const parentId = invoice.participant_id; // ID родителя из счета
    let parentName = invoice.participant_name;

    if (parentResult.rows.length > 0) {
        const parent = parentResult.rows[0];
        // Формируем полное имя родителя: имя + фамилия
        parentName = parent.surname ? `${parent.name} ${parent.surname}` : parent.name;
        console.log('🔍 Имя родителя:', parentName);
    } else {
        console.log('⚠️ Родитель не найден в базе данных');
    }

    // Для индивидуальной регистрации нам нужен ID ребенка
    // Но в счете у нас только ID родителя, поэтому создаем участника с parentId
    // childId будет установлен как parentId (временное решение)
    const participant = {
        id: invoice.id,
        childId: invoice.participant_id, // Временно = ID родителя
        childName: invoice.participant_name, // Имя из счета
        parentId: parentId,
        parentName: parentName,
        selectedStyles: stylesArray,
        selectedOptions: optionsArray,
        totalAmount: invoice.amount,
        isPaid: false,
        hasReceived: false,
        paymentMethod: undefined,
        paymentDate: undefined,
        notes: invoice.notes || undefined
    };

    console.log('🔍 Добавляем участника в мастер-класс:', {
        masterClassId: invoice.master_class_id,
        participantId: invoice.participant_id,
        participantName: invoice.participant_name,
        participantData: participant
    });

    // Проверяем существование мастер-класса перед добавлением участника
    console.log('🔍 Проверяем существование мастер-класса:', invoice.master_class_id);
    const masterClassCheckResult = await client.query(
        'SELECT id FROM master_class_events WHERE id = $1',
        [invoice.master_class_id]
    );

    if (masterClassCheckResult.rows.length === 0) {
        throw new Error(`Мастер-класс с ID ${invoice.master_class_id} не найден`);
    }

    console.log('✅ Мастер-класс найден, добавляем участника:', JSON.stringify(participant));

    // Обновляем поле participants в master_class_events
    console.log('🔍 Обновляем поле participants для мастер-класса:', invoice.master_class_id);

    console.log('🔍 SQL запрос для обновления participants:', {
        query: `UPDATE master_class_events SET participants = COALESCE(participants, '[]'::jsonb) || $1::jsonb WHERE id = $2`,
        participantData: JSON.stringify([participant]),
        masterClassId: invoice.master_class_id
    });

    const updateParticipantsResult = await client.query(`
        UPDATE master_class_events 
        SET participants = COALESCE(participants, '[]'::jsonb) || $1::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, participants
    `, [JSON.stringify([participant]), invoice.master_class_id]);

    if (updateParticipantsResult.rows.length === 0) {
        throw new Error(`Мастер-класс с ID ${invoice.master_class_id} не найден`);
    }

    console.log('✅ Участники обновлены:', {
        masterClassId: invoice.master_class_id,
        newParticipants: updateParticipantsResult.rows[0].participants,
        rowsAffected: updateParticipantsResult.rowCount
    });

    // Проверяем, что участник действительно добавлен
    const verifyResult = await client.query(
        'SELECT participants FROM master_class_events WHERE id = $1',
        [invoice.master_class_id]
    );
    console.log('🔍 Проверка participants после обновления:', verifyResult.rows[0]?.participants);

    // Обновляем статистику в master_class_events
    console.log('🔍 Обновляем статистику для мастер-класса:', invoice.master_class_id);

    // Получаем текущую статистику для правильного суммирования
    const currentStatsResult = await client.query(
        'SELECT statistics FROM master_class_events WHERE id = $1',
        [invoice.master_class_id]
    );

    if (currentStatsResult.rows.length === 0) {
        throw new Error(`Мастер-класс с ID ${invoice.master_class_id} не найден при обновлении статистики`);
    }

    const currentStats = currentStatsResult.rows[0]?.statistics || {};
    const currentStylesStats = currentStats.stylesStats || {};
    const currentOptionsStats = currentStats.optionsStats || {};

    console.log('📊 Текущая статистика:', currentStats);

    // Создаем новые статистики с суммированием
    const newStylesStats = { ...currentStylesStats };
    const newOptionsStats = { ...currentOptionsStats };

    // Добавляем новые стили к существующим (используем преобразованные массивы)
    stylesArray.forEach((style: { id: string; name: string }) => {
        newStylesStats[style.name] = (newStylesStats[style.name] || 0) + 1;
    });

    // Добавляем новые опции к существующим (используем преобразованные массивы)
    optionsArray.forEach((option: { id: string; name: string }) => {
        newOptionsStats[option.name] = (newOptionsStats[option.name] || 0) + 1;
    });

    // Преобразуем amount в число для корректного SQL запроса
    const numericAmount = typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount;
    console.log('📊 Обновляем статистику:', {
        newStylesStats,
        newOptionsStats,
        amount: numericAmount,
        currentStylesStats,
        currentOptionsStats
    });

    const updateStatsResult = await client.query(`
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
    `, [numericAmount, newStylesStats, newOptionsStats, invoice.master_class_id]);

    if (updateStatsResult.rows.length === 0) {
        throw new Error(`Мастер-класс с ID ${invoice.master_class_id} не найден при обновлении статистики`);
    }

    console.log('✅ Статистика обновлена:', {
        masterClassId: invoice.master_class_id,
        newStatistics: updateStatsResult.rows[0].statistics
    });

    console.log('Статистика мастер-класса обновлена');
};

export const createInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 createInvoice: Начало обработки запроса');
        console.log('🔄 createInvoice: Заголовки запроса:', req.headers);
        console.log('🔄 createInvoice: Пользователь из токена:', req.user);

        const invoiceData: CreateInvoiceRequest = req.body;

        console.log('🔄 createInvoice: Полученные данные:', invoiceData);
        console.log('🔄 createInvoice: Дата мастер-класса:', invoiceData.workshop_date);
        console.log('🔄 createInvoice: Тип даты:', typeof invoiceData.workshop_date);
        console.log('🔄 createInvoice: Все обязательные поля:', {
            master_class_id: !!invoiceData.master_class_id,
            participant_id: !!invoiceData.participant_id,
            amount: !!invoiceData.amount,
            workshop_date: !!invoiceData.workshop_date,
            city: !!invoiceData.city,
            school_name: !!invoiceData.school_name,
            class_group: !!invoiceData.class_group,
            participant_name: !!invoiceData.participant_name
        });

        // Валидация данных
        if (!invoiceData.master_class_id || !invoiceData.participant_id || !invoiceData.amount) {
            res.status(400).json({
                success: false,
                error: 'Необходимы все обязательные поля'
            } as ApiResponse);
            return;
        }

        console.log('🔍 Подключаемся к БД...');
        const client = await pool.connect();
        console.log('✅ Подключение к БД установлено');

        // Проверяем структуру таблицы invoices
        try {
            const tableInfoResult = await client.query(`
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'invoices' 
                    ORDER BY ordinal_position
                `);
            console.log('🔍 Структура таблицы invoices:', tableInfoResult.rows);

            // Проверяем существующие записи
            const existingInvoicesResult = await client.query('SELECT COUNT(*) as count FROM invoices');
            console.log('🔍 Существующие записи в invoices:', existingInvoicesResult.rows[0]);
        } catch (tableError) {
            console.error('❌ Ошибка при проверке структуры таблицы:', tableError);
        }

        try {
            console.log('🔍 Начинаем транзакцию...');
            await client.query('BEGIN');
            console.log('✅ Транзакция начата');

            // Преобразуем дату в правильный формат для PostgreSQL
            let workshopDate: Date;
            try {
                if (typeof invoiceData.workshop_date === 'string') {
                    workshopDate = new Date(invoiceData.workshop_date);
                    if (isNaN(workshopDate.getTime())) {
                        throw new Error('Неверный формат даты');
                    }
                } else {
                    workshopDate = invoiceData.workshop_date;
                }
            } catch (dateError) {
                console.error('Ошибка парсинга даты:', dateError);
                res.status(400).json({
                    success: false,
                    error: 'Неверный формат даты мастер-класса'
                } as ApiResponse);
                return;
            }

            // Создаем счет
            const createQuery = `
                INSERT INTO invoices (
                    master_class_id, workshop_date, city, school_name, class_group,
                    participant_name, participant_id, amount, selected_styles, selected_options, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const values = [
                invoiceData.master_class_id,
                workshopDate,
                invoiceData.city,
                invoiceData.school_name,
                invoiceData.class_group,
                invoiceData.participant_name,
                invoiceData.participant_id,
                invoiceData.amount,
                JSON.stringify(invoiceData.selected_styles),
                JSON.stringify(invoiceData.selected_options),
                invoiceData.notes || ''
            ];

            console.log('SQL запрос:', createQuery);
            console.log('Значения для вставки:', values);
            console.log('Типы значений:', values.map(v => typeof v));

            const result = await client.query(createQuery, values);
            const newInvoice = result.rows[0];
            console.log('✅ Счет успешно создан в БД:', newInvoice);
            console.log('🔍 Проверяем данные счета:', {
                id: newInvoice.id,
                participant_id: newInvoice.participant_id,
                master_class_id: newInvoice.master_class_id,
                amount: newInvoice.amount,
                created_at: newInvoice.created_at
            });

            // Проверяем, что счет действительно сохранен в БД
            const verifyInvoiceResult = await client.query(
                'SELECT * FROM invoices WHERE id = $1',
                [newInvoice.id]
            );
            console.log('🔍 Проверка счета в БД после создания:', {
                found: verifyInvoiceResult.rows.length > 0,
                invoiceData: verifyInvoiceResult.rows[0] || null
            });

            // Добавляем участника в мастер-класс и обновляем статистику
            try {
                console.log('🔄 Добавляем участника в мастер-класс...');
                await addParticipantToMasterClass(client, newInvoice);
                console.log('✅ Участник добавлен в мастер-класс и статистика обновлена');
            } catch (participantError) {
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при добавлении участника:', participantError);
                console.error('❌ Стек ошибки участника:', participantError instanceof Error ? participantError.stack : 'Неизвестно');
                console.error('❌ Счет создан, но участник не добавлен в мастер-класс!');

                // Откатываем транзакцию, поскольку участник не добавлен
                console.log('🔄 Откатываем транзакцию из-за ошибки участника...');
                await client.query('ROLLBACK');
                console.log('✅ Транзакция отменена');

                // Перебрасываем ошибку
                throw new Error(`Не удалось добавить участника в мастер-класс: ${participantError instanceof Error ? participantError.message : String(participantError)}`);
            }

            console.log('🔍 Выполняем COMMIT транзакции...');
            await client.query('COMMIT');
            console.log('✅ Транзакция зафиксирована успешно');

            // Проверяем счет после COMMIT
            const afterCommitResult = await client.query(
                'SELECT * FROM invoices WHERE id = $1',
                [newInvoice.id]
            );
            console.log('🔍 Проверка счета после COMMIT:', {
                found: afterCommitResult.rows.length > 0,
                invoiceData: afterCommitResult.rows[0] || null
            });

            // Отправляем WebSocket уведомление о создании счета
            if (wsManager) {
                try {
                    wsManager.notifyInvoiceUpdate(newInvoice.id, newInvoice.participant_id, 'created');
                    console.log('📡 WebSocket уведомление о создании счета отправлено');
                } catch (wsError) {
                    console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
                }
            }

            res.status(201).json({
                success: true,
                data: newInvoice,
                message: 'Счет успешно создан'
            } as ApiResponse<Invoice>);

        } catch (error) {
            console.error('❌ Ошибка в транзакции:', error);
            console.log('🔍 Выполняем ROLLBACK...');
            await client.query('ROLLBACK');
            console.log('✅ ROLLBACK выполнен');
            throw error;
        } finally {
            console.log('🔍 Освобождаем подключение к БД...');
            client.release();
            console.log('✅ Подключение к БД освобождено');
        }

    } catch (error) {
        console.error('❌ createInvoice: Ошибка при создании счета:', error);
        console.error('❌ createInvoice: Стек ошибки:', error instanceof Error ? error.stack : 'Неизвестно');
        console.error('❌ createInvoice: Имя ошибки:', error instanceof Error ? error.name : 'Неизвестно');
        console.error('❌ createInvoice: Сообщение ошибки:', error instanceof Error ? error.message : String(error));

        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: error instanceof Error ? error.message : String(error)
        } as ApiResponse);
    }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
        const filters: InvoiceFilters = req.query;

        console.log('Получение счетов - фильтры:', filters);

        const whereConditions: string[] = [];
        const queryParams: (string | number)[] = [];
        let paramIndex = 1;

        // Применяем фильтры
        if (filters.city) {
            whereConditions.push(`city ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.city}%`);
            paramIndex++;
        }

        if (filters.school_name) {
            whereConditions.push(`school_name ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.school_name}%`);
            paramIndex++;
        }

        if (filters.class_group) {
            whereConditions.push(`class_group ILIKE $${paramIndex}`);
            queryParams.push(`%${filters.class_group}%`);
            paramIndex++;
        }

        if (filters.workshop_date) {
            whereConditions.push(`workshop_date = $${paramIndex}`);
            queryParams.push(filters.workshop_date);
            paramIndex++;
        }

        if (filters.status && filters.status !== 'all') {
            whereConditions.push(`status = $${paramIndex}`);
            queryParams.push(filters.status);
            paramIndex++;
        }

        if (filters.participant_id) {
            whereConditions.push(`participant_id = $${paramIndex}`);
            queryParams.push(filters.participant_id);
            paramIndex++;
            console.log('🔍 Фильтр participant_id применен:', filters.participant_id);
        }

        if (filters.master_class_id) {
            whereConditions.push(`master_class_id = $${paramIndex}`);
            queryParams.push(filters.master_class_id);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        console.log('🔍 SQL WHERE clause:', whereClause);
        console.log('🔍 SQL параметры:', queryParams);

        // Получаем общее количество
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM invoices 
            ${whereClause}
        `;

        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);
        console.log('🔍 COUNT запрос результат:', { total, query: countQuery, params: queryParams });

        // Получаем все счета без пагинации
        const invoicesQuery = `
            SELECT 
                i.*,
                '' as master_class_name,
                '' as master_class_description
            FROM invoices i
            ${whereClause}
            ORDER BY i.created_at DESC
        `;

        console.log('🔍 Основной запрос:', invoicesQuery);
        console.log('🔍 Параметры основного запроса:', queryParams);

        const invoicesResult = await pool.query(invoicesQuery, queryParams);

        console.log('🔍 Результат запроса счетов - найдено строк:', invoicesResult.rows.length);
        if (invoicesResult.rows.length === 0) {
            console.log('🔍 Сырые данные из БД (если есть):', invoicesResult.rows);
        }

        const invoices = invoicesResult.rows.map(row => ({
            id: row.id,
            master_class_id: row.master_class_id,
            workshop_date: row.workshop_date,
            city: row.city,
            school_name: row.school_name,
            class_group: row.class_group,
            participant_name: row.participant_name,
            participant_id: row.participant_id,
            amount: parseFloat(row.amount),
            status: row.status,
            selected_styles: row.selected_styles || [],
            selected_options: row.selected_options || [],
            created_at: row.created_at,
            updated_at: row.updated_at,
            master_class_name: row.master_class_name,
            master_class_description: row.master_class_description
        }));

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    page: 1, // Always 1 for unlimited results
                    limit: 0, // Always 0 for unlimited results
                    total,
                    totalPages: 1 // Always 1 for unlimited results
                }
            }
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при получении счетов:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                i.*,
                '' as master_class_name,
                '' as master_class_description
            FROM invoices i
            WHERE i.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = result.rows[0];

        res.json({
            success: true,
            data: {
                id: invoice.id,
                master_class_id: invoice.master_class_id,
                workshop_date: invoice.workshop_date,
                city: invoice.city,
                school_name: invoice.school_name,
                class_group: invoice.class_group,
                participant_name: invoice.participant_name,
                participant_id: invoice.participant_id,
                amount: parseFloat(invoice.amount),
                status: invoice.status,
                selected_styles: invoice.selected_styles || [],
                selected_options: invoice.selected_options || [],
                created_at: invoice.created_at,
                updated_at: invoice.updated_at,
                master_class_name: invoice.master_class_name,
                master_class_description: invoice.master_class_description,
                payment_label: invoice.payment_label,
                payment_method: invoice.payment_method,
                payment_id: invoice.payment_id,
                payment_date: invoice.payment_date,
                sender_phone: invoice.sender_phone
            }
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при получении счета:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { selected_styles, selected_options, amount } = req.body;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        console.log(`🔄 updateInvoice: Обновляем счет ${id}`, {
            selected_styles: selected_styles?.length || 0,
            selected_options: selected_options?.length || 0,
            amount,
            userId,
            userRole
        });

        // Валидация входных данных
        if (!selected_styles || !selected_options || typeof amount !== 'number') {
            console.error(`❌ Неверные данные для обновления счета:`, {
                selected_styles: !!selected_styles,
                selected_options: !!selected_options,
                amount: typeof amount
            });
            res.status(400).json({
                success: false,
                error: 'Неверные данные для обновления счета'
            } as ApiResponse);
            return;
        }

        // Проверяем, существует ли счет и права доступа
        const checkResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            console.error(`❌ Счет с ID ${id} не найден`);
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = checkResult.rows[0];

        // Проверяем права доступа:
        // - Администраторы могут обновлять любые счета
        // - Родители могут обновлять только счета своих детей
        if (userRole !== 'admin' && invoice.participant_id !== userId) {
            console.log('❌ Доступ запрещен для обновления счета:', { 
                userRole, 
                userId, 
                invoiceParticipantId: invoice.participant_id 
            });
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Вы можете обновлять только счета своих детей.'
            } as ApiResponse);
            return;
        }

        // Обновляем счет
        const result = await pool.query(
            `UPDATE invoices 
             SET selected_styles = $1, 
                 selected_options = $2, 
                 amount = $3, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4 
             RETURNING *`,
            [JSON.stringify(selected_styles), JSON.stringify(selected_options), amount, id]
        );

        const updatedInvoice = result.rows[0];
        console.log(`✅ Счет обновлен:`, {
            id: updatedInvoice.id,
            master_class_id: updatedInvoice.master_class_id,
            participant_id: updatedInvoice.participant_id,
            amount: updatedInvoice.amount,
            selected_styles_count: selected_styles.length,
            selected_options_count: selected_options.length
        });

        res.json({
            success: true,
            data: updatedInvoice
        } as ApiResponse);

    } catch (error) {
        console.error('❌ updateInvoice error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        } as ApiResponse);
    }
};

export const updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`🔄 updateInvoiceStatus: Обновляем статус счета ${id} на ${status}`);

        // Валидация статуса
        if (!['pending', 'paid', 'cancelled'].includes(status)) {
            console.error(`❌ Неверный статус счета: ${status}`);
            res.status(400).json({
                success: false,
                error: 'Неверный статус счета'
            } as ApiResponse);
            return;
        }

        // Обновляем статус счета
        const result = await pool.query(
            'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (result.rows.length === 0) {
            console.error(`❌ Счет с ID ${id} не найден`);
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = result.rows[0];
        console.log(`✅ Счет обновлен:`, {
            id: invoice.id,
            master_class_id: invoice.master_class_id,
            participant_id: invoice.participant_id,
            status: invoice.status,
            amount: invoice.amount
        });

        // Синхронизируем статус оплаты с участниками мастер-класса
        if (invoice.master_class_id && invoice.participant_id) {
            try {
                console.log(`🔄 Начинаем синхронизацию для счета ${id}...`);
                console.log(`🔍 Данные счета для синхронизации:`, {
                    invoiceId: id,
                    masterClassId: invoice.master_class_id,
                    participantId: invoice.participant_id,
                    status: status,
                    isPaid: status === 'paid'
                });
                await syncPaymentStatusWithParticipants(invoice.master_class_id, invoice.participant_id, status === 'paid');
                console.log(`✅ Статус оплаты синхронизирован для счета ${id} с участником ${invoice.participant_id}`);
            } catch (syncError) {
                console.error(`❌ Ошибка синхронизации статуса оплаты для счета ${id}:`, syncError);
                // Не прерываем выполнение, только логируем ошибку
            }
        } else {
            console.log(`⚠️ Счет ${id} не имеет master_class_id или participant_id, синхронизация пропущена`);
            console.log(`🔍 Данные счета:`, {
                master_class_id: invoice.master_class_id,
                participant_id: invoice.participant_id
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Статус счета обновлен'
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при обновлении статуса счета:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

// Функция для синхронизации статуса оплаты между счетами и участниками мастер-класса
const syncPaymentStatusWithParticipants = async (masterClassId: string, participantId: string, isPaid: boolean): Promise<void> => {
    try {
        console.log(`🔄 Синхронизация статуса оплаты: мастер-класс ${masterClassId}, participantId ${participantId}, статус: ${isPaid ? 'оплачено' : 'не оплачено'}`);

        // Получаем текущий мастер-класс
        const masterClassResult = await pool.query(
            'SELECT participants, statistics FROM master_class_events WHERE id = $1',
            [masterClassId]
        );

        if (masterClassResult.rows.length === 0) {
            console.log(`❌ Мастер-класс ${masterClassId} не найден`);
            return;
        }

        const masterClass = masterClassResult.rows[0];
        let participants = masterClass.participants || [];
        const statistics = masterClass.statistics || {};

        console.log(`🔍 Мастер-класс найден, участников: ${participants.length}`);
        console.log(`🔍 Участники:`, JSON.stringify(participants, null, 2));
        console.log(`🔍 Ищем участников для participantId: ${participantId}`);

        // Улучшенная логика поиска участников для обновления
        // Ищем участников по нескольким критериям для максимального покрытия
        const participantsToUpdate = participants.filter((p: {
            parentId?: string;
            childId?: string;
            id: string;
            notes?: string;
            childName?: string;
        }) => {
            // 1. Прямое совпадение по parentId или childId
            if (p.parentId === participantId || p.childId === participantId) {
                console.log(`✅ Найден участник по прямому совпадению: ${p.childName || 'Без имени'} (ID: ${p.id})`);
                return true;
            }

            // 2. Поиск по ID счета в notes (для групповых регистраций)
            if (p.notes && p.notes.includes(`Счет: ${participantId}`)) {
                console.log(`✅ Найден участник по ID счета в notes: ${p.childName || 'Без имени'} (ID: ${p.id})`);
                return true;
            }

            // 3. Поиск по ID счета в notes (для индивидуальных регистраций)
            if (p.notes && p.notes.includes(`Счет: ${participantId}`)) {
                console.log(`✅ Найден участник по ID счета в notes: ${p.childName || 'Без имени'} (ID: ${p.id})`);
                return true;
            }

            return false;
        });

        console.log(`🔍 Найдено участников для обновления: ${participantsToUpdate.length}`);
        console.log(`🔍 Участники для обновления:`, JSON.stringify(participantsToUpdate, null, 2));

        if (participantsToUpdate.length === 0) {
            console.log(`❌ Участники не найдены в мастер-классе ${masterClassId} с participantId ${participantId}`);
            console.log(`❌ Доступные parentId:`, participants.map((p: { parentId?: string }) => p.parentId));
            console.log(`❌ Доступные childId:`, participants.map((p: { childId?: string }) => p.childId));
            console.log(`❌ Доступные notes:`, participants.map((p: { notes?: string }) => p.notes));

            // Попробуем найти участников по ID счета в notes
            const participantsByInvoice = participants.filter((p: { notes?: string; childName?: string; id: string }) =>
                p.notes && p.notes.includes(`Счет: ${participantId}`)
            );

            if (participantsByInvoice.length > 0) {
                console.log(`🔍 Найдено участников по ID счета в notes: ${participantsByInvoice.length}`);
                console.log(`🔍 Участники по ID счета:`, participantsByInvoice.map((p: { id: string; childName?: string }) => ({ id: p.id, childName: p.childName || 'Без имени' })));
                participantsToUpdate.push(...participantsByInvoice);
            }

            if (participantsToUpdate.length === 0) {
                console.log(`❌ Участники не найдены даже по дополнительным критериям`);
                return;
            }
        }

        // Обновляем статус оплаты для всех найденных участников
        participants = participants.map((p: { id: string; childName?: string; isPaid?: boolean; totalAmount?: number }) => {
            const isTargetParticipant = participantsToUpdate.some((targetP: { id: string }) => targetP.id === p.id);
            if (isTargetParticipant) {
                const oldPaymentStatus = p.isPaid;
                p.isPaid = isPaid;

                console.log(`🔄 Обновляем статус оплаты участника ${p.childName}: ${oldPaymentStatus} → ${isPaid}`);
            }
            return p;
        });

        // Пересчитываем общую статистику мастер-класса
        let totalPaidAmount = 0;
        let totalUnpaidAmount = 0;

        participants.forEach((p: { isPaid?: boolean; totalAmount?: number }) => {
            if (p.isPaid) {
                totalPaidAmount += p.totalAmount || 0;
            } else {
                totalUnpaidAmount += p.totalAmount || 0;
            }
        });

        console.log(`📊 Пересчитанная статистика: totalPaidAmount: ${totalPaidAmount}, totalUnpaidAmount: ${totalUnpaidAmount}`);

        // Обновляем мастер-класс
        const updateResult = await pool.query(
            `UPDATE master_class_events 
             SET participants = $1::jsonb, 
                 statistics = jsonb_set(
                     jsonb_set(
                         COALESCE(statistics, '{}'::jsonb),
                         '{paidAmount}', to_jsonb($2::numeric)
                     ),
                     '{unpaidAmount}', to_jsonb($3::numeric)
                 ),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [JSON.stringify(participants), totalPaidAmount, totalUnpaidAmount, masterClassId]
        );

        if (updateResult.rows.length === 0) {
            throw new Error('Failed to update master class');
        }

        console.log(`✅ Статус оплаты успешно синхронизирован для ${participantsToUpdate.length} участников`);

    } catch (error) {
        console.error('Ошибка при синхронизации статуса оплаты:', error);
        throw error;
    }
};

export const getInvoicesByDate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { date } = req.params;

        const query = `
            SELECT 
                i.id,
                i.amount,
                i.status,
                mce.date as workshop_date,
                mce.time as workshop_time,
                s.name as service_name
            FROM invoices i
            LEFT JOIN master_class_events mce ON i.master_class_id = mce.id
            LEFT JOIN services s ON mce.service_id = s.id
            WHERE DATE(i.workshop_date) = $1
        `;

        const result = await pool.query(query, [date]);

        const invoices = result.rows.map(row => ({
            id: row.id,
            amount: parseFloat(row.amount),
            status: row.status,
            workshop_date: row.workshop_date,
            workshop_time: row.workshop_time,
            service_name: row.service_name
        }));

        res.json({
            success: true,
            data: invoices
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при получении счетов по дате:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

// Удалить счет
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        console.log('🔍 deleteInvoice: Заголовки запроса:', req.headers);
        console.log('🔍 deleteInvoice: Пользователь из токена:', req.user);
        console.log('🔍 deleteInvoice: Данные запроса:', { id, userId, userRole });
        console.log('🔍 deleteInvoice: Полный объект req.user:', JSON.stringify(req.user, null, 2));
        console.log('🔍 deleteInvoice: Тип req.user:', typeof req.user);
        console.log('🔍 deleteInvoice: req.user === undefined:', req.user === undefined);
        console.log('🔍 deleteInvoice: req.user === null:', req.user === null);

        // Проверяем, существует ли счет
        const checkResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);

        if (checkResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Счет не найден'
            } as ApiResponse);
            return;
        }

        const invoice = checkResult.rows[0];

        // Проверяем права доступа:
        // - Администраторы могут удалять любые счета
        // - Родители могут удалять только свои счета (participant_id должен совпадать с user_id)
        if (userRole !== 'admin' && invoice.participant_id !== userId) {
            console.log('❌ Доступ запрещен:', { userRole, userId, invoiceParticipantId: invoice.participant_id });
            res.status(403).json({
                success: false,
                error: 'Доступ запрещен. Вы можете удалять только свои счета.'
            } as ApiResponse);
            return;
        }

        // Удаляем счет
        await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

        console.log('✅ Счет успешно удален:', { id, deletedBy: userId, userRole });

        res.json({
            success: true,
            message: 'Счет успешно удален'
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при удалении счета:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        } as ApiResponse);
    }
};

// Функция для синхронизации всех счетов с участниками мастер-класса
export const syncAllInvoicesWithParticipants = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🔄 Начинаем синхронизацию всех счетов с участниками мастер-класса...');

        // Получаем все счета с их статусами
        const invoicesResult = await pool.query(`
            SELECT id, master_class_id, participant_id, status, amount
            FROM invoices 
            WHERE master_class_id IS NOT NULL AND participant_id IS NOT NULL
        `);

        const invoices = invoicesResult.rows;
        console.log(`📋 Найдено ${invoices.length} счетов для синхронизации`);
        console.log(`📋 Счета:`, JSON.stringify(invoices, null, 2));

        let syncedCount = 0;
        let errorCount = 0;

        for (const invoice of invoices) {
            try {
                console.log(`🔄 Синхронизируем счет ${invoice.id} (мастер-класс: ${invoice.master_class_id}, участник: ${invoice.participant_id}, статус: ${invoice.status})`);
                await syncPaymentStatusWithParticipants(
                    invoice.master_class_id,
                    invoice.participant_id,
                    invoice.status === 'paid'
                );
                syncedCount++;
                console.log(`✅ Синхронизирован счет ${invoice.id}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Ошибка синхронизации счета ${invoice.id}:`, error);
            }
        }

        console.log(`🎯 Синхронизация завершена: ${syncedCount} успешно, ${errorCount} с ошибками`);

        res.json({
            success: true,
            message: `Синхронизация завершена: ${syncedCount} успешно, ${errorCount} с ошибками`,
            data: {
                total: invoices.length,
                synced: syncedCount,
                errors: errorCount
            }
        } as ApiResponse);

    } catch (error) {
        console.error('Ошибка при синхронизации всех счетов:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера при синхронизации'
        } as ApiResponse);
    }
};
