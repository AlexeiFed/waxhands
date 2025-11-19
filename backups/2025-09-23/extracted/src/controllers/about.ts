/**
 * @file: about.ts
 * @description: Контроллер для управления контентом страницы "О нас"
 * @dependencies: database/connection.ts, types/about.ts
 * @created: 2024-12-19
 */

import { Request, Response } from 'express';
import pool from '../database/connection.js';
import { AboutContent, AboutMedia, CreateAboutContentRequest, CreateAboutMediaRequest, UpdateAboutContentRequest, UpdateAboutMediaRequest } from '../types/about.js';
import { wsManager } from '../websocket-server.js';

export class AboutController {
    // Получить весь контент about
    static async getContent(req: Request, res: Response) {
        try {
            const { rows } = await pool.query('SELECT * FROM about ORDER BY id DESC LIMIT 1');
            const content = rows[0] as AboutContent;

            if (!content) {
                return res.status(404).json({ error: 'Контент не найден' });
            }

            return res.json(content);
        } catch (error) {
            console.error('Ошибка при получении контента about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Обновить контент about
    static async updateContent(req: Request, res: Response) {
        try {
            const updates: UpdateAboutContentRequest = req.body;
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }

            // Проверяем, что есть поля для обновления
            const validUpdates = Object.keys(updates)
                .filter(key => updates[key as keyof UpdateAboutContentRequest] !== undefined);

            if (validUpdates.length === 0) {
                return res.status(400).json({ error: 'Нет полей для обновления' });
            }

            // Строим SQL запрос безопасно
            const setClauses = validUpdates.map((key, index) => `${key} = $${index + 1}`);
            const sql = `UPDATE about SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${validUpdates.length + 1}`;

            // Подготавливаем значения
            const values = validUpdates.map(key => {
                const value = updates[key as keyof UpdateAboutContentRequest];
                // Для JSON полей убеждаемся, что они корректно сериализованы
                if (key === 'process_steps') {
                    return JSON.stringify(value);
                }
                // Для массива строк advantages_list оставляем как есть
                if (key === 'advantages_list') {
                    return value;
                }
                return value;
            });

            console.log('🔍 About update SQL:', sql);
            console.log('🔍 About update values:', values);

            await pool.query(sql, [...values, id]);

            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutContentUpdate(id, 'content_updated');
            }

            return res.json({ message: 'Контент успешно обновлен' });
        } catch (error) {
            console.error('Ошибка при обновлении контента about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Получить все медиа-файлы
    static async getMedia(req: Request, res: Response) {
        try {
            const { rows } = await pool.query('SELECT * FROM about_media ORDER BY order_index ASC, created_at ASC');
            const media = rows as AboutMedia[];

            return res.json(media);
        } catch (error) {
            console.error('Ошибка при получении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Добавить медиа-файл
    static async addMedia(req: Request, res: Response) {
        try {
            const mediaData: CreateAboutMediaRequest = req.body;

            // Проверяем обязательные поля
            if (!mediaData.filename || !mediaData.original_name || !mediaData.type || !mediaData.file_path) {
                return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
            }

            // Получаем следующий порядковый индекс
            const { rows: orderRows } = await pool.query('SELECT MAX(order_index) as max_order FROM about_media');
            const nextOrder = (orderRows[0]?.max_order || 0) + 1;

            // Получаем ID основной записи about (берем первую запись)
            const { rows: aboutRows } = await pool.query('SELECT id FROM about LIMIT 1');
            if (aboutRows.length === 0) {
                return res.status(500).json({ error: 'Базовая запись about не найдена' });
            }
            const aboutId = aboutRows[0].id;

            const { rows: result } = await pool.query(
                'INSERT INTO about_media (about_id, filename, original_name, type, title, description, order_index, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [
                    aboutId,
                    mediaData.filename,
                    mediaData.original_name,
                    mediaData.type,
                    mediaData.title || mediaData.original_name,
                    mediaData.description || '',
                    nextOrder,
                    mediaData.file_path
                ]
            );

            const newMedia = {
                id: result[0].id,
                ...mediaData,
                order_index: nextOrder,
                created_at: new Date().toISOString()
            };

            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaAdded(newMedia);
            }

            return res.status(201).json(newMedia);
        } catch (error) {
            console.error('Ошибка при добавлении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Обновить медиа-файл
    static async updateMedia(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updates: UpdateAboutMediaRequest = req.body;

            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }

            const updateFields = Object.keys(updates)
                .filter(key => updates[key as keyof UpdateAboutMediaRequest] !== undefined)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');

            if (!updateFields) {
                return res.status(400).json({ error: 'Нет полей для обновления' });
            }

            const values = Object.keys(updates)
                .filter(key => updates[key as keyof UpdateAboutMediaRequest] !== undefined)
                .map(key => updates[key as keyof UpdateAboutMediaRequest]);

            await pool.query(
                `UPDATE about_media SET ${updateFields} WHERE id = $${values.length + 1}`,
                [...values, id]
            );

            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaUpdate(id, 'updated');
            }

            return res.json({ message: 'Медиа-файл успешно обновлен' });
        } catch (error) {
            console.error('Ошибка при обновлении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Удалить медиа-файл
    static async deleteMedia(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }

            await pool.query('DELETE FROM about_media WHERE id = $1', [id]);

            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaDeleted(id);
            }

            return res.json({ message: 'Медиа-файл успешно удален' });
        } catch (error) {
            console.error('Ошибка при удалении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Изменить порядок медиа-файлов
    static async reorderMedia(req: Request, res: Response) {
        try {
            const { mediaIds } = req.body;

            if (!Array.isArray(mediaIds)) {
                return res.status(400).json({ error: 'mediaIds должен быть массивом' });
            }

            // Проверяем, что все ID существуют
            const existingMedia = await pool.query(
                'SELECT id FROM about_media WHERE id = ANY($1)',
                [mediaIds]
            );

            if (existingMedia.rows.length !== mediaIds.length) {
                return res.status(400).json({ error: 'Некоторые ID медиа не найдены' });
            }

            // Обновляем порядок для каждого медиа-файла
            for (let i = 0; i < mediaIds.length; i++) {
                await pool.query(
                    'UPDATE about_media SET order_index = $1 WHERE id = $2',
                    [i + 1, mediaIds[i]]
                );
            }

            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutContentUpdate('reorder', 'media_reordered');
            }

            return res.json({ message: 'Порядок медиа-файлов успешно обновлен' });
        } catch (error) {
            console.error('Ошибка при изменении порядка медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
}
