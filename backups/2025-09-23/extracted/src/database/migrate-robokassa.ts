/**
 * @file: migrate-robokassa.ts
 * @description: Миграция для добавления полей Robokassa
 * @dependencies: database/connection.ts
 * @created: 2025-01-26
 */

import pool from './connection.js';

const addRobokassaFields = async () => {
    const client = await pool.connect();

    try {
        console.log('🔄 Добавляем поля Robokassa в таблицу invoices...');

        // Добавляем поле robokassa_invoice_id
        await client.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS robokassa_invoice_id VARCHAR(255)
        `);

        // Добавляем поле refund_available_until для отслеживания времени возврата
        await client.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS refund_available_until TIMESTAMP WITH TIME ZONE
        `);

        // Создаем индекс для robokassa_invoice_id
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_invoices_robokassa_invoice_id 
            ON invoices(robokassa_invoice_id)
        `);

        console.log('✅ Поля Robokassa успешно добавлены');

    } catch (error) {
        console.error('❌ Ошибка при добавлении полей Robokassa:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запускаем миграцию если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addRobokassaFields()
        .then(() => {
            console.log('✅ Миграция Robokassa завершена');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка миграции Robokassa:', error);
            process.exit(1);
        });
}

export default addRobokassaFields;
