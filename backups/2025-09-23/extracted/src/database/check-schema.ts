/**
 * @file: check-schema.ts
 * @description: Скрипт для проверки структуры таблицы master_class_events
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

const checkSchema = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔍 Проверяем структуру таблицы master_class_events...');

        // Проверяем все колонки в таблице master_class_events
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'master_class_events'
            ORDER BY ordinal_position
        `);

        console.log('📋 Структура таблицы master_class_events:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });

        // Проверяем, есть ли поле city
        const cityField = result.rows.find(row => row.column_name === 'city');
        if (cityField) {
            console.log('✅ Поле city найдено!');
        } else {
            console.log('❌ Поле city НЕ найдено!');
        }

        // Проверяем образцы данных
        console.log('\n🔍 Проверяем образцы данных...');
        const dataResult = await client.query(`
            SELECT id, date, time, school_name, class_group, city
            FROM master_class_events 
            LIMIT 3
        `);

        if (dataResult.rows.length > 0) {
            console.log('📊 Образцы данных:');
            dataResult.rows.forEach((row, index) => {
                console.log(`  ${index + 1}. ID: ${row.id}, Date: ${row.date}, City: ${row.city || 'NULL'}`);
            });
        } else {
            console.log('📊 Нет данных в таблице master_class_events');
        }

    } catch (error) {
        console.error('❌ Ошибка при проверке схемы:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запуск проверки, если файл выполняется напрямую
checkSchema()
    .then(() => {
        console.log('✅ Проверка схемы завершена');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Ошибка проверки схемы:', error);
        process.exit(1);
    });

export { checkSchema };
