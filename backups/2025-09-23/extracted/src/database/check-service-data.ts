/**
 * @file: check-service-data.ts
 * @description: Проверка данных в таблице services
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */

import pool from './connection.js';

export const checkServiceData = async (): Promise<void> => {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Проверяем данные в таблице services...');
        
        const result = await client.query(`
            SELECT id, name, options, created_at
            FROM services
            LIMIT 5
        `);
        
        console.log('📋 Данные в таблице services:');
        result.rows.forEach((row, index) => {
            console.log(`\n--- Сервис ${index + 1} ---`);
            console.log(`ID: ${row.id}`);
            console.log(`Название: ${row.name}`);
            console.log(`Опции: ${JSON.stringify(row.options, null, 2)}`);
            console.log(`Создан: ${row.created_at}`);
        });
        
    } finally {
        client.release();
    }
};

// Запуск скрипта
checkServiceData().catch(console.error);
