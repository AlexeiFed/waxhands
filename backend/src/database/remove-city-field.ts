/**
 * @file: remove-city-field.ts
 * @description: Миграция для удаления поля city из таблицы master_class_events
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const removeCityField = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔧 Удаляем поле city из таблицы master_class_events...');

        // Проверяем, существует ли поле city
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'master_class_events' 
            AND column_name = 'city'
        `);

        if (checkResult.rows.length === 0) {
            console.log('✅ Поле city уже не существует в таблице master_class_events');
            return;
        }

        // Удаляем поле city
        await client.query('ALTER TABLE master_class_events DROP COLUMN city');
        console.log('✅ Поле city успешно удалено из таблицы master_class_events');

    } catch (error) {
        console.error('❌ Ошибка при удалении поля city:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запуск миграции, если файл выполняется напрямую
removeCityField()
    .then(() => {
        console.log('✅ Миграция remove-city-field завершена успешно');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка миграции remove-city-field:', error);
        process.exit(1);
    });
