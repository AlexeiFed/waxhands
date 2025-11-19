/**
 * @file: add-refund-reason-field.ts
 * @description: Добавляет поле refund_reason в таблицу invoices
 * @dependencies: pool
 * @created: 2025-01-27
 */

import pool from './connection.js';

async function addRefundReasonField() {
    const client = await pool.connect();

    try {
        console.log('🔄 Добавляем поле refund_reason в таблицу invoices...');

        // Добавляем поле refund_reason
        await client.query(`
            ALTER TABLE invoices 
            ADD COLUMN IF NOT EXISTS refund_reason TEXT
        `);

        console.log('✅ Поле refund_reason успешно добавлено');

    } catch (error) {
        console.error('❌ Ошибка при добавлении поля refund_reason:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Запускаем миграцию если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addRefundReasonField()
        .then(() => {
            console.log('✅ Миграция завершена успешно');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка миграции:', error);
            process.exit(1);
        });
}

export default addRefundReasonField;
