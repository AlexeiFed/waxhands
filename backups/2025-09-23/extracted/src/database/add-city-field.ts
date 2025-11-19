/**
 * @file: add-city-field.ts
 * @description: Миграция для добавления поля city в таблицу master_class_events
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const addCityField = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔧 Добавляем поле city в таблицу master_class_events...');

        // Проверяем, существует ли уже поле city
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'master_class_events' 
            AND column_name = 'city'
        `);

        if (checkResult.rows.length > 0) {
            console.log('✅ Поле city уже существует в таблице master_class_events');
            return;
        }

        // Добавляем поле city
        await client.query(`
            ALTER TABLE master_class_events 
            ADD COLUMN city VARCHAR(100) DEFAULT 'Не указан'
        `);

        // Создаем индекс для поля city
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_master_class_events_city 
            ON master_class_events(city)
        `);

        console.log('✅ Поле city успешно добавлено в таблицу master_class_events');

    } catch (error) {
        console.error('❌ Ошибка при добавлении поля city:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запуск миграции, если файл выполняется напрямую
addCityField()
    .then(() => {
        console.log('✅ Миграция add-city-field завершена успешно');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка миграции add-city-field:', error);
        process.exit(1);
    });
