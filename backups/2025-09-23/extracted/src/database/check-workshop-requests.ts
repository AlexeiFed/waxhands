/**
 * @file: backend/src/database/check-workshop-requests.ts
 * @description: Скрипт для проверки существования таблицы workshop_requests
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export async function checkWorkshopRequestsTable() {
    const client = await pool.connect();
    console.log('🔌 Connected to database');

    try {
        // Проверяем существование таблицы
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'workshop_requests'
        `);

        if (tableCheck.rows.length > 0) {
            console.log('✅ Таблица workshop_requests существует');

            // Проверяем структуру таблицы
            const structureCheck = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'workshop_requests'
                ORDER BY ordinal_position
            `);

            console.log('📋 Структура таблицы workshop_requests:');
            structureCheck.rows.forEach(row => {
                console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
            });

            // Проверяем индексы
            const indexCheck = await client.query(`
                SELECT indexname, indexdef
                FROM pg_indexes 
                WHERE tablename = 'workshop_requests'
            `);

            console.log('🔍 Индексы таблицы workshop_requests:');
            indexCheck.rows.forEach(row => {
                console.log(`  - ${row.indexname}: ${row.indexdef}`);
            });

        } else {
            console.log('❌ Таблица workshop_requests НЕ существует');
        }

    } catch (error) {
        console.error('❌ Error checking workshop_requests table:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔌 Database connection released');
    }
}

// Запуск если файл выполняется напрямую
if (process.argv[1] && process.argv[1].includes('check-workshop-requests.ts')) {
    console.log('🔍 Checking workshop_requests table...');
    checkWorkshopRequestsTable()
        .then(() => {
            console.log('✅ Check completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Check failed:', error);
            process.exit(1);
        });
}

export default checkWorkshopRequestsTable;
