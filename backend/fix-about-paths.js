/**
 * Скрипт для исправления путей к медиа-файлам about
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'waxhands',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixAboutPaths() {
    try {
        console.log('🔄 Исправление путей к медиа-файлам...');

        // Обновляем пути к существующим медиа-файлам
        await pool.query(`
            UPDATE about_media 
            SET file_path = '/src/assets/about/demo-video-1.mp4'
            WHERE filename = 'demo-video-1.mp4'
        `);

        await pool.query(`
            UPDATE about_media 
            SET file_path = '/src/assets/about/demo-video-2.mp4'
            WHERE filename = 'demo-video-2.mp4'
        `);

        console.log('✅ Пути к медиа-файлам исправлены');

        // Проверяем результат
        const { rows } = await pool.query('SELECT * FROM about_media ORDER BY id ASC');
        console.log('📋 Текущие медиа-файлы:');
        rows.forEach(row => {
            console.log(`  - ${row.title}: ${row.file_path}`);
        });

    } catch (error) {
        console.error('❌ Ошибка при исправлении путей:', error);
    } finally {
        await pool.end();
    }
}

fixAboutPaths();
