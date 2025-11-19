import { Request, Response } from 'express';
import pool from '../database/connection.js';
import crypto from 'crypto';

export const getServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search } = req.query;

        let query = 'SELECT * FROM services';
        let countQuery = 'SELECT COUNT(*) FROM services';
        const params: Array<string | number> = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR short_description ILIKE $1';
            countQuery += ' WHERE name ILIKE $1 OR short_description ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [servicesResult, countResult] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        // Преобразуем поля из snake_case в camelCase для фронтенда
        const transformedServices = servicesResult.rows.map(service => ({
            id: service.id,
            name: service.name,
            shortDescription: service.short_description,
            fullDescription: service.full_description,
            styles: service.styles || [],
            options: service.options || [],
            createdAt: service.created_at,
            updatedAt: service.updated_at
        }));

        console.log('Backend: возвращаем услуги:', transformedServices);

        res.json({
            success: true,
            data: {
                services: transformedServices,
                total: parseInt(countResult.rows[0].count),
                page: 1, // Always 1 for no pagination
                limit: servicesResult.rows.length // Return all services
            }
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        // Преобразуем поля из snake_case в camelCase для фронтенда
        const service = result.rows[0];
        const transformedService = {
            id: service.id,
            name: service.name,
            shortDescription: service.short_description,
            fullDescription: service.full_description,
            styles: service.styles || [],
            options: service.options || [],
            createdAt: service.created_at,
            updatedAt: service.updated_at
        };

        res.json({
            success: true,
            data: transformedService
        });
    } catch (error) {
        console.error('Get service by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const createService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, shortDescription, fullDescription, styles = [], options = [] } = req.body;

        console.log('Creating service with data:', { name, shortDescription, fullDescription, styles, options });

        // Создаем услугу в новом формате с правильными названиями полей
        const result = await pool.query(`
            INSERT INTO services (name, short_description, full_description, styles, options)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, shortDescription, fullDescription, JSON.stringify(styles), JSON.stringify(options)]);

        console.log('Service created successfully:', result.rows[0]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('Update service request:', { id, updateData });

        // Убираем поля, которые нельзя обновлять
        const { id: serviceId, created_at, updated_at, ...allowedUpdates } = updateData;

        // Маппинг полей с camelCase на snake_case
        const fieldMapping: { [key: string]: string } = {
            shortDescription: 'short_description',
            fullDescription: 'full_description'
        };

        // Преобразуем поля в snake_case для базы данных
        const dbFields: { [key: string]: string | number | boolean | null } = {};
        Object.keys(allowedUpdates).forEach(key => {
            const dbField = fieldMapping[key] || key;
            dbFields[dbField] = allowedUpdates[key];
        });

        // Строим динамический запрос
        const fields = Object.keys(dbFields);
        const values = Object.values(dbFields);

        if (fields.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
            return;
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

        console.log('SQL query:', `UPDATE services SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`);
        console.log('Values:', [id, ...values]);

        const result = await pool.query(`
            UPDATE services 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id, ...values]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        console.log('Service updated successfully:', result.rows[0]);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const addStyleToService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const styleData = req.body;

        console.log('Adding style to service:', id, styleData);

        // Получаем услугу
        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        const service = serviceResult.rows[0];
        const styles = Array.isArray(service.styles) ? service.styles : [];

        // Добавляем новый стиль с уникальным ID и правильной обработкой цены
        const newStyle = {
            id: crypto.randomUUID(),
            ...styleData,
            price: typeof styleData.price === 'string' ? parseFloat(styleData.price) : styleData.price
        };

        styles.push(newStyle);

        // Обновляем услугу
        const result = await pool.query(
            'UPDATE services SET styles = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [JSON.stringify(styles), id]
        );

        console.log('Style added successfully');

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.broadcastEvent({
                    type: 'service_style_updated',
                    data: {
                        serviceId: id,
                        styleId: newStyle.id,
                        message: 'Новый стиль добавлен к услуге'
                    },
                    timestamp: Date.now()
                });
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        res.status(201).json({
            success: true,
            data: newStyle
        });
    } catch (error) {
        console.error('Add style to service error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const addOptionToService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const optionData = req.body;

        console.log('Adding option to service:', id, optionData);

        // Получаем услугу
        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        const service = serviceResult.rows[0];
        const options = Array.isArray(service.options) ? service.options : [];

        // Добавляем новую опцию с уникальным ID и правильной обработкой цены
        const newOption = {
            id: crypto.randomUUID(),
            ...optionData,
            price: typeof optionData.price === 'string' ? parseFloat(optionData.price) : optionData.price
        };

        options.push(newOption);

        // Обновляем услугу
        const result = await pool.query(
            'UPDATE services SET options = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [JSON.stringify(options), id]
        );

        console.log('Option added successfully');

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.broadcastEvent({
                    type: 'service_option_updated',
                    data: {
                        serviceId: id,
                        optionId: newOption.id,
                        message: 'Новая опция добавлена к услуге'
                    },
                    timestamp: Date.now()
                });
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        res.status(201).json({
            success: true,
            data: newOption
        });
    } catch (error) {
        console.error('Add option to service error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const updateServiceStyle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, styleId } = req.params;
        const styleData = req.body;

        console.log('Updating service style:', id, styleId, 'with data:', styleData);
        console.log('Style data type:', typeof styleData, 'price type:', typeof styleData.price);

        // Получаем услугу
        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        const service = serviceResult.rows[0];
        const styles = Array.isArray(service.styles) ? service.styles : [];

        // Находим и обновляем стиль
        const styleIndex = styles.findIndex((style: { id: string }) => style.id === styleId);

        if (styleIndex === -1) {
            res.status(404).json({
                success: false,
                error: 'Style not found'
            });
            return;
        }

        // Сохраняем медиафайлы при обновлении
        const existingStyle = styles[styleIndex];
        styles[styleIndex] = {
            ...existingStyle,
            ...styleData,
            price: typeof styleData.price === 'string' ? parseFloat(styleData.price) : styleData.price,
            // Сохраняем медиафайлы: заменяем только если пришли новые непустые данные
            images: (styleData.images !== undefined && styleData.images.length > 0) ?
                styleData.images : existingStyle.images,
            videos: (styleData.videos !== undefined && styleData.videos.length > 0) ?
                styleData.videos : existingStyle.videos
        };

        // Обновляем услугу
        await pool.query(
            'UPDATE services SET styles = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(styles), id]
        );

        console.log('Style updated successfully. Updated style:', styles[styleIndex]);

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.broadcastEvent({
                    type: 'service_style_updated',
                    data: {
                        serviceId: id,
                        styleId: styleId,
                        message: 'Стиль услуги обновлен'
                    },
                    timestamp: Date.now()
                });
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        res.json({
            success: true,
            data: styles[styleIndex]
        });
    } catch (error) {
        console.error('Update service style error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const updateServiceOption = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, optionId } = req.params;
        const optionData = req.body;

        console.log('Updating service option:', id, optionId, 'with data:', optionData);
        console.log('Option data type:', typeof optionData, 'price type:', typeof optionData.price);

        // Получаем услугу
        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service not found'
            });
            return;
        }

        const service = serviceResult.rows[0];
        const options = Array.isArray(service.options) ? service.options : [];

        // Находим и обновляем опцию
        const optionIndex = options.findIndex((option: { id: string }) => option.id === optionId);

        if (optionIndex === -1) {
            res.status(404).json({
                success: false,
                error: 'Option not found'
            });
            return;
        }

        // Сохраняем медиафайлы при обновлении
        const existingOption = options[optionIndex];
        options[optionIndex] = {
            ...existingOption,
            ...optionData,
            price: typeof optionData.price === 'string' ? parseFloat(optionData.price) : optionData.price,
            // Сохраняем медиафайлы: заменяем только если пришли новые непустые данные
            images: (optionData.images !== undefined && optionData.images.length > 0) ?
                optionData.images : existingOption.images,
            videos: (optionData.videos !== undefined && optionData.videos.length > 0) ?
                optionData.videos : existingOption.videos
        };

        // Обновляем услугу
        await pool.query(
            'UPDATE services SET options = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(options), id]
        );

        console.log('Option updated successfully. Updated option:', options[optionIndex]);

        // Отправляем WebSocket уведомление
        try {
            const { wsManager } = await import('../websocket-server.js');
            if (wsManager) {
                wsManager.broadcastEvent({
                    type: 'service_option_updated',
                    data: {
                        serviceId: id,
                        optionId: optionId,
                        message: 'Опция услуги обновлена'
                    },
                    timestamp: Date.now()
                });
            }
        } catch (wsError) {
            console.warn('⚠️ Ошибка отправки WebSocket уведомления:', wsError);
        }

        res.json({
            success: true,
            data: options[optionIndex]
        });
    } catch (error) {
        console.error('Update service option error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const reorderServiceStyles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { order } = req.body as { order: string[] };

        console.log('Reorder styles request:', { serviceId: id, order });

        if (!Array.isArray(order) || order.length === 0) {
            res.status(400).json({ success: false, error: 'Invalid order payload' });
            return;
        }

        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
        if (serviceResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        const service = serviceResult.rows[0] as { styles: unknown };
        const styles: Array<{ id: string;[key: string]: unknown }> = Array.isArray(service.styles) ? (service.styles as Array<{ id: string }>) : [];

        console.log('Current styles in service:', styles.map(s => ({ id: s.id, name: s.name })));
        console.log('Requested order:', order);

        // Дополнительная проверка: все ли запрашиваемые стили существуют
        if (styles.length === 0) {
            res.status(400).json({
                success: false,
                error: 'В услуге нет стилей для сортировки'
            });
            return;
        }

        // Проверяем, что все ID в order существуют в текущих стилях
        const existingStyleIds = new Set(styles.map(s => s.id));
        const invalidIds = order.filter(id => !existingStyleIds.has(id));

        if (invalidIds.length > 0) {
            console.error('Invalid style IDs in order:', invalidIds);
            res.status(400).json({
                success: false,
                error: `Стили не найдены: ${invalidIds.join(', ')}. Проверьте корректность ID стилей.`
            });
            return;
        }

        const styleMap = new Map(styles.map((s) => [s.id, s]));

        const newStyles: Array<{ id: string;[key: string]: unknown }> = order
            .map((styleId) => styleMap.get(styleId))
            .filter((v): v is { id: string } => Boolean(v));

        // Добавляем хвост (если есть стили, которых нет в order)
        const tail = styles.filter((s) => !order.includes(s.id));
        const finalStyles = [...newStyles, ...tail];

        console.log('Final styles order:', finalStyles.map(s => ({ id: s.id, name: s.name })));

        const result = await pool.query('UPDATE services SET styles = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [JSON.stringify(finalStyles), id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        res.json({ success: true, data: result.rows[0].styles });
    } catch (error) {
        console.error('Reorder service styles error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const reorderServiceOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { order } = req.body as { order: string[] };

        console.log('Reorder options request:', { serviceId: id, order });

        if (!Array.isArray(order) || order.length === 0) {
            res.status(400).json({ success: false, error: 'Invalid order payload' });
            return;
        }

        const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
        if (serviceResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        const service = serviceResult.rows[0] as { options: unknown };
        const options: Array<{ id: string;[key: string]: unknown }> = Array.isArray(service.options) ? (service.options as Array<{ id: string }>) : [];

        console.log('Current options in service:', options.map(o => ({ id: o.id, name: o.name })));
        console.log('Requested order:', order);

        // Дополнительная проверка: все ли запрашиваемые опции существуют
        if (options.length === 0) {
            res.status(400).json({
                success: false,
                error: 'В услуге нет опций для сортировки'
            });
            return;
        }

        // Проверяем, что все ID в order существуют в текущих опциях
        const existingOptionIds = new Set(options.map(o => o.id));
        const invalidIds = order.filter(id => !existingOptionIds.has(id));

        if (invalidIds.length > 0) {
            console.error('Invalid option IDs in order:', invalidIds);
            res.status(400).json({
                success: false,
                error: `Опции не найдены: ${invalidIds.join(', ')}. Проверьте корректность ID опций.`
            });
            return;
        }

        const optionMap = new Map(options.map((o) => [o.id, o]));

        const newOptions: Array<{ id: string;[key: string]: unknown }> = order
            .map((optionId) => optionMap.get(optionId))
            .filter((v): v is { id: string } => Boolean(v));

        const tail = options.filter((o) => !order.includes(o.id));
        const finalOptions = [...newOptions, ...tail];

        console.log('Final options order:', finalOptions.map(o => ({ id: o.id, name: o.name })));

        const result = await pool.query('UPDATE services SET options = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [JSON.stringify(finalOptions), id]);

        if (result.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        res.json({ success: true, data: result.rows[0].options });
    } catch (error) {
        console.error('Reorder service options error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

export const getServiceMedia = async (req: Request, res: Response): Promise<void> => {
    try {
        const { serviceId } = req.params;

        // Получаем медиафайлы из таблицы master_class_events для конкретной услуги
        const result = await pool.query(`
            SELECT 
                mce.id,
                mce.service_id,
                mce.notes,
                mce.statistics,
                s.name as service_name,
                s.styles,
                s.options
            FROM master_class_events mce
            JOIN services s ON mce.service_id = s.id
            WHERE mce.service_id = $1
            ORDER BY mce.created_at DESC
        `, [serviceId]);

        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Service media not found'
            });
            return;
        }

        // Извлекаем медиафайлы из стилей и опций
        const mediaData = {
            serviceId,
            serviceName: result.rows[0].service_name,
            styles: result.rows[0].styles || [],
            options: result.rows[0].options || [],
            events: result.rows.map(row => ({
                id: row.id,
                notes: row.notes,
                statistics: row.statistics,
                createdAt: row.created_at
            }))
        };

        console.log('Backend: возвращаем медиафайлы для услуги:', mediaData);

        res.json({
            success: true,
            data: mediaData
        });
    } catch (error) {
        console.error('Get service media error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const deleteServiceStyle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: serviceId, styleId } = req.params;

        // Получаем текущие стили услуги
        const serviceResult = await pool.query('SELECT styles FROM services WHERE id = $1', [serviceId]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        const currentStyles = serviceResult.rows[0].styles || [];
        const updatedStyles = currentStyles.filter((style: { id: string }) => style.id !== styleId);

        // Обновляем услугу с новым массивом стилей
        await pool.query(
            'UPDATE services SET styles = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(updatedStyles), serviceId]
        );

        console.log('Backend: удален стиль', styleId, 'из услуги', serviceId);

        res.json({
            success: true,
            message: 'Style deleted successfully'
        });
    } catch (error) {
        console.error('Delete service style error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

export const deleteServiceOption = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: serviceId, optionId } = req.params;

        // Получаем текущие опции услуги
        const serviceResult = await pool.query('SELECT options FROM services WHERE id = $1', [serviceId]);

        if (serviceResult.rows.length === 0) {
            res.status(404).json({ success: false, error: 'Service not found' });
            return;
        }

        const currentOptions = serviceResult.rows[0].options || [];
        const updatedOptions = currentOptions.filter((option: { id: string }) => option.id !== optionId);

        // Обновляем услугу с новым массивом опций
        await pool.query(
            'UPDATE services SET options = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [JSON.stringify(updatedOptions), serviceId]
        );

        console.log('Backend: удалена опция', optionId, 'из услуги', serviceId);

        res.json({
            success: true,
            message: 'Option deleted successfully'
        });
    } catch (error) {
        console.error('Delete service option error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};