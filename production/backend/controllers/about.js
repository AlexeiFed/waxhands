/**
 * @file: about.ts
 * @description: Контроллер для управления контентом страницы "О нас"
 * @dependencies: database/connection.ts, types/about.ts
 * @created: 2024-12-19
 */
import pool from '../database/connection';
import { wsManager } from '../websocket-server';
export class AboutController {
    // Получить весь контент about
    static async getContent(req, res) {
        try {
            const { rows } = await pool.query('SELECT * FROM about ORDER BY id DESC LIMIT 1');
            const content = rows[0];
            if (!content) {
                return res.status(404).json({ error: 'Контент не найден' });
            }
            return res.json(content);
        }
        catch (error) {
            console.error('Ошибка при получении контента about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Обновить контент about
    static async updateContent(req, res) {
        try {
            const updates = req.body;
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }
            const updateFields = Object.keys(updates)
                .filter(key => updates[key] !== undefined)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');
            if (!updateFields) {
                return res.status(400).json({ error: 'Нет полей для обновления' });
            }
            const values = Object.keys(updates)
                .filter(key => updates[key] !== undefined)
                .map(key => updates[key]);
            await pool.query(`UPDATE about SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1}`, [...values, id]);
            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutContentUpdate(parseInt(id), 'updated');
            }
            return res.json({ message: 'Контент успешно обновлен' });
        }
        catch (error) {
            console.error('Ошибка при обновлении контента about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Получить все медиа-файлы
    static async getMedia(req, res) {
        try {
            const { rows } = await pool.query('SELECT * FROM about_media ORDER BY order_index ASC, created_at ASC');
            const media = rows;
            return res.json(media);
        }
        catch (error) {
            console.error('Ошибка при получении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Добавить медиа-файл
    static async addMedia(req, res) {
        try {
            const mediaData = req.body;
            // Проверяем обязательные поля
            if (!mediaData.filename || !mediaData.original_name || !mediaData.type || !mediaData.file_path) {
                return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
            }
            // Получаем следующий порядковый индекс
            const { rows: orderRows } = await pool.query('SELECT MAX(order_index) as max_order FROM about_media');
            const nextOrder = (orderRows[0]?.max_order || 0) + 1;
            const { rows: result } = await pool.query('INSERT INTO about_media (filename, original_name, type, description, order_index, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [
                mediaData.filename,
                mediaData.original_name,
                mediaData.type,
                mediaData.title || mediaData.original_name,
                mediaData.description || '',
                nextOrder,
                mediaData.file_path
            ]);
            const newMedia = {
                id: result[0].id,
                ...mediaData,
                order_index: nextOrder,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaAdded(newMedia);
            }
            return res.status(201).json(newMedia);
        }
        catch (error) {
            console.error('Ошибка при добавлении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Обновить медиа-файл
    static async updateMedia(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }
            const updateFields = Object.keys(updates)
                .filter(key => updates[key] !== undefined)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(', ');
            if (!updateFields) {
                return res.status(400).json({ error: 'Нет полей для обновления' });
            }
            const values = Object.keys(updates)
                .filter(key => updates[key] !== undefined)
                .map(key => updates[key]);
            await pool.query(`UPDATE about_media SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1}`, [...values, id]);
            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaUpdate(parseInt(id), 'updated');
            }
            return res.json({ message: 'Медиа-файл успешно обновлен' });
        }
        catch (error) {
            console.error('Ошибка при обновлении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Удалить медиа-файл
    static async deleteMedia(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID не указан' });
            }
            await pool.query('DELETE FROM about_media WHERE id = $1', [id]);
            // Отправляем WebSocket уведомление
            if (wsManager) {
                wsManager.notifyAboutMediaDeleted(parseInt(id));
            }
            return res.json({ message: 'Медиа-файл успешно удален' });
        }
        catch (error) {
            console.error('Ошибка при удалении медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
    // Изменить порядок медиа-файлов
    static async reorderMedia(req, res) {
        try {
            const { mediaIds } = req.body;
            if (!Array.isArray(mediaIds)) {
                return res.status(400).json({ error: 'mediaIds должен быть массивом' });
            }
            // Обновляем порядок для каждого медиа-файла
            for (let i = 0; i < mediaIds.length; i++) {
                await pool.query('UPDATE about_media SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [i + 1, mediaIds[i]]);
            }
            return res.json({ message: 'Порядок медиа-файлов успешно обновлен' });
        }
        catch (error) {
            console.error('Ошибка при изменении порядка медиа about:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
}
//# sourceMappingURL=about.js.map