/**
 * @file: migrate-about-data.ts
 * @description: Миграция существующих данных about из localStorage в БД
 * @dependencies: create-about-table.ts
 * @created: 2024-12-19
 */
import { createAboutTable } from './create-about-table.js';
import pool from './connection.js';
async function migrateAboutData() {
    try {
        // Создаем таблицы
        await createAboutTable();
        // Проверяем, есть ли уже данные в БД
        const { rows: contentRows } = await pool.query('SELECT COUNT(*) as count FROM about');
        const { rows: mediaRows } = await pool.query('SELECT COUNT(*) as count FROM about_media');
        if (contentRows[0].count === 0) {
            console.log('📝 Создаем базовый контент...');
            // Базовый контент уже создается в createAboutTable
        }
        if (mediaRows[0].count === 0) {
            console.log('📸 Добавляем базовые медиа-файлы...');
            // Добавляем существующие файлы из папки assets/about
            const baseMedia = [
                {
                    filename: 'demo-video-1.mp4',
                    original_name: 'demo-video-1.mp4',
                    type: 'video',
                    title: 'Демо видео 1',
                    description: 'Демонстрационное видео работы студии',
                    file_path: '/src/assets/about/demo-video-1.mp4'
                },
                {
                    filename: 'demo-video-2.mp4',
                    original_name: 'demo-video-2.mp4',
                    type: 'video',
                    title: 'Демо видео 2',
                    description: 'Демонстрационное видео процесса создания',
                    file_path: '/src/assets/about/demo-video-2.mp4'
                }
            ];
            for (const media of baseMedia) {
                await pool.query('INSERT INTO about_media (filename, original_name, type, title, description, order_index, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
                    media.filename,
                    media.original_name,
                    media.type,
                    media.title,
                    media.description,
                    1,
                    media.file_path
                ]);
            }
            console.log('✅ Базовые медиа-файлы добавлены');
        }
        console.log('✅ Миграция данных about завершена');
        return true;
    }
    catch (error) {
        console.error('❌ Ошибка при миграции данных about:', error);
        return false;
    }
}
// Экспорт функции для использования в других модулях
export { migrateAboutData };
//# sourceMappingURL=migrate-about-data.js.map