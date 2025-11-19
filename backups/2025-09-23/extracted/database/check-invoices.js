/**
 * @file: check-invoices.ts
 * @description: Проверка структуры таблицы invoices
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import pool from './connection.js';
export const checkInvoices = async () => {
    const client = await pool.connect();
    try {
        console.log('🔍 Проверяем структуру таблицы invoices...');
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'invoices'
            ORDER BY ordinal_position
        `);
        console.log('📋 Структура таблицы invoices:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
        });
        // Проверяем внешние ключи
        console.log('\n🔍 Проверяем внешние ключи...');
        const fkResult = await client.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'invoices'
        `);
        console.log('📋 Внешние ключи:');
        fkResult.rows.forEach(row => {
            console.log(`  - ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
        });
        // Проверяем данные
        console.log('\n🔍 Проверяем образцы данных...');
        const dataResult = await client.query('SELECT * FROM invoices LIMIT 3');
        console.log('📋 Образцы данных:', dataResult.rows);
    }
    catch (error) {
        console.error('❌ Ошибка при проверке таблицы invoices:', error);
    }
    finally {
        client.release();
    }
};
// Запуск скрипта
checkInvoices().catch(console.error);
//# sourceMappingURL=check-invoices.js.map