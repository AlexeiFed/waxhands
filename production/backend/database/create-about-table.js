/**
 * @file: create-about-table.ts
 * @description: Создание таблицы about для хранения контента страницы "О нас"
 * @dependencies: database/connection.ts
 * @created: 2024-12-19
 */
import pool from './connection';
async function createAboutTable() {
    try {
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
        // Создаем таблицу about_media для медиа-файлов
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
        // Вставляем базовый контент, если таблица пустая
        const { rows } = await pool.query('SELECT COUNT(*) as count FROM about');
        if (rows[0].count === 0) {
            await pool.query(`
                INSERT INTO about (title, subtitle, description, mission, vision, values, contact_info) 
                VALUES (
                    'О нас',
                    'Студия восковых рук Wax Hands',
                    'Мы создаем уникальные сувениры из воска, которые сохраняют ваши воспоминания на долгие годы. Наша студия специализируется на создании восковых слепков рук, ног и других частей тела.',
                    'Наша миссия - помочь людям сохранить драгоценные моменты жизни в виде красивых и долговечных сувениров.',
                    'Мы стремимся стать ведущей студией восковых рук в России, известной качеством, креативностью и вниманием к деталям.',
                    'Качество, креативность, внимание к деталям, индивидуальный подход к каждому клиенту.',
                    'Телефон: +7 (XXX) XXX-XX-XX\nEmail: info@wint.ru\nАдрес: г. Москва, ул. Примерная, д. 1'
                )
            `);
        }
        console.log('✅ Таблица about успешно создана');
        return true;
    }
    catch (error) {
        console.error('❌ Ошибка при создании таблицы about:', error);
        return false;
    }
}
// Экспорт функции для использования в других модулях
export { createAboutTable };
//# sourceMappingURL=create-about-table.js.map