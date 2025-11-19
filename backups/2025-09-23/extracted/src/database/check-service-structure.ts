/**
 * @file: check-service-structure.ts
 * @description: Детальная проверка структуры таблицы services
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const checkServiceStructure = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔍 Проверяем структуру таблицы services...');

        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'services'
            ORDER BY ordinal_position
        `);

        console.log('📋 Структура таблицы services:');
        structureResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });

        console.log('\n🔍 Проверяем данные в полях styles и options...');

        const dataResult = await client.query(`
            SELECT id, name, styles, options, created_at
            FROM services
            LIMIT 3
        `);

        console.log('📋 Данные в таблице services:');
        dataResult.rows.forEach((row, index) => {
            console.log(`\n--- Сервис ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`Название: ${row.name}`);
            console.log(`Стили: ${JSON.stringify(row.styles, null, 2)}`);
            console.log(`Опции: ${JSON.stringify(row.options, null, 2)}`);
            console.log(`Создан: ${row.created_at}`);
        });

    } finally {
        client.release();
    }
};

// Запуск скрипта
checkServiceStructure().catch(console.error);
