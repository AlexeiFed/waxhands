/**
 * @file: add-refund-fields.ts
 * @description: Миграция для добавления полей возврата в таблицу invoices
 * @dependencies: pool
 * @created: 2025-01-26
 */

import pool from './connection.js';

const addRefundFields = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔄 Начинаем миграцию: добавление полей возврата в таблицу invoices');

        await client.query('BEGIN');

        // Проверяем существование полей
        const checkFields = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name IN ('refund_status', 'refund_request_id', 'refund_amount', 'refund_date')
        `);

        const existingFields = checkFields.rows.map((row: { column_name: string }) => row.column_name);
        console.log('🔍 Существующие поля возврата:', existingFields);

        // Добавляем поле refund_status если его нет
        if (!existingFields.includes('refund_status')) {
            console.log('➕ Добавляем поле refund_status');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN refund_status VARCHAR(20) DEFAULT 'none' 
                CHECK (refund_status IN ('none', 'pending', 'completed', 'failed'))
            `);
            console.log('✅ Поле refund_status добавлено');
        }

        // Добавляем поле refund_request_id если его нет
        if (!existingFields.includes('refund_request_id')) {
            console.log('➕ Добавляем поле refund_request_id');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN refund_request_id VARCHAR(255)
            `);
            console.log('✅ Поле refund_request_id добавлено');
        }

        // Добавляем поле refund_amount если его нет
        if (!existingFields.includes('refund_amount')) {
            console.log('➕ Добавляем поле refund_amount');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN refund_amount DECIMAL(10,2)
            `);
            console.log('✅ Поле refund_amount добавлено');
        }

        // Добавляем поле refund_date если его нет
        if (!existingFields.includes('refund_date')) {
            console.log('➕ Добавляем поле refund_date');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN refund_date TIMESTAMP WITH TIME ZONE
            `);
            console.log('✅ Поле refund_date добавлено');
        }

        // Создаем индексы для оптимизации
        console.log('📊 Создаем индексы для полей возврата...');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_invoices_refund_status 
            ON invoices(refund_status)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_invoices_refund_request_id 
            ON invoices(refund_request_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_invoices_refund_date 
            ON invoices(refund_date)
        `);

        console.log('✅ Индексы для полей возврата созданы');

        await client.query('COMMIT');
        console.log('✅ Миграция полей возврата завершена успешно');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка при добавлении полей возврата:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запускаем миграцию если файл выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addRefundFields()
        .then(() => {
            console.log('✅ Миграция завершена');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка миграции:', error);
            process.exit(1);
        });
}

export default addRefundFields;
