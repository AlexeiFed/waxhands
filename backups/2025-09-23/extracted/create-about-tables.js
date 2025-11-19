/**
 * Простой скрипт для создания таблиц about в БД
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

async function createAboutTables() {
    try {
        console.log('🔄 Создание таблиц about...');

        // Создаем таблицу about
        await pool.query(`
            CREATE TABLE IF NOT EXISTS about (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL DEFAULT 'О нас',
                subtitle VARCHAR(500),
                description TEXT,
                mission TEXT,
                vision TEXT,
                values TEXT,
                contact_info TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Таблица about создана');

        // Создаем таблицу about_media
        await pool.query(`
            CREATE TABLE IF NOT EXISTS about_media (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                type VARCHAR(10) CHECK (type IN ('image', 'video')) NOT NULL,
                title VARCHAR(255),
                description TEXT,
                order_index INTEGER DEFAULT 0,
                file_path VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Таблица about_media создана');

        // Проверяем, есть ли базовый контент
        const { rows: contentRows } = await pool.query('SELECT COUNT(*) as count FROM about');
        if (parseInt(contentRows[0].count) === 0) {
            await pool.query(`
                INSERT INTO about (title, subtitle, description, mission, vision, values, contact_info) 
                VALUES (
                    'О нас',
                    'Студия восковых рук Wax Hands',
                    'Мы создаем уникальные сувениры из воска, которые сохраняют ваши воспоминания на долгие годы. Наша студия специализируется на создании восковых слепков рук, ног и других частей тела.',
                    'Наша миссия - помочь людям сохранить драгоценные моменты жизни в виде красивых и долговечных сувениров.',
                    'Мы стремимся стать ведущей студией восковых рук в России, известной качеством, креативностью и вниманием к деталям.',
                    'Качество, креативность, внимание к деталям, индивидуальный подход к каждому клиенту.',
                    'Телефон: +7 (XXX) XXX-XX-XX\nEmail: info@waxhands.ru\nАдрес: г. Москва, ул. Примерная, д. 1'
                )
            `);
            console.log('✅ Базовый контент добавлен');
        }

        // Проверяем, есть ли медиа-файлы
        const { rows: mediaRows } = await pool.query('SELECT COUNT(*) as count FROM about_media');
        if (parseInt(mediaRows[0].count) === 0) {
            const baseMedia = [
                {
                    filename: 'demo-video-1.mp4',
                    original_name: 'demo-video-1.mp4',
                    type: 'video',
                    title: 'Демо видео 1',
                    description: 'Демонстрационное видео работы студии',
                    order_index: 1,
                    file_path: '/src/assets/about/demo-video-1.mp4'
                },
                {
                    filename: 'demo-video-2.mp4',
                    original_name: 'demo-video-2.mp4',
                    type: 'video',
                    title: 'Демо видео 2',
                    description: 'Демонстрационное видео процесса создания',
                    order_index: 2,
                    file_path: '/src/assets/about/demo-video-2.mp4'
                }
            ];

            for (const media of baseMedia) {
                await pool.query(
                    'INSERT INTO about_media (filename, original_name, type, title, description, order_index, file_path) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [
                        media.filename,
                        media.original_name,
                        media.type,
                        media.title,
                        media.description,
                        media.order_index,
                        media.file_path
                    ]
                );
            }
            console.log('✅ Базовые медиа-файлы добавлены');
        }

        console.log('🎉 Таблицы about успешно созданы и заполнены!');

    } catch (error) {
        console.error('❌ Ошибка при создании таблиц about:', error);
    } finally {
        await pool.end();
    }
}

createAboutTables();
