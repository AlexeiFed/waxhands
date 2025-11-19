/**
 * @file: add-refund-email-field.ts
 * @description: Добавляет поле refund_email в таблицу invoices
 * @created: 2025-11-10
 */

import pool from './connection.js';

async function addRefundEmailField() {
    try {
        console.log('🔄 Добавляем поле refund_email в таблицу invoices...');
        await pool.query(`
            ALTER TABLE invoices
            ADD COLUMN IF NOT EXISTS refund_email VARCHAR(255)
        `);
        console.log('✅ Поле refund_email успешно добавлено');
    } catch (error) {
        console.error('❌ Ошибка при добавлении поля refund_email:', error);
    } finally {
        await pool.end();
    }
}

addRefundEmailField();





