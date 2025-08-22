/**
 * @file: check-tables.ts
 * @description: Проверка существующих таблиц в БД
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const checkTables = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔍 Проверяем существующие таблицы...');

        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('📋 Существующие таблицы:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        // Проверяем структуру таблицы services
        console.log('\n🔍 Проверяем структуру таблицы services...');
        try {
            const servicesResult = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'services'
                ORDER BY ordinal_position
            `);

            console.log('📋 Структура таблицы services:');
            servicesResult.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });
        } catch (error) {
            console.log('❌ Таблица services не найдена');
        }

    } finally {
        client.release();
    }
};

// Запуск скрипта
checkTables().catch(console.error);
