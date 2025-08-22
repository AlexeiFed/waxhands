/**
 * @file: add-payment-fields.ts
 * @description: Миграция для добавления полей платежа в таблицу invoices
 * @dependencies: pool
 * @created: 2024-12-19
 */

import pool from './connection';

const addPaymentFields = async (): Promise<void> => {
    const client = await pool.connect();

    try {
        console.log('🔄 Начинаем миграцию: добавление полей платежа в таблицу invoices');

        await client.query('BEGIN');

        // Проверяем существование полей
        const checkFields = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name IN ('payment_id', 'payment_method', 'payment_date')
        `);

        const existingFields = checkFields.rows.map((row: any) => row.column_name);
        console.log('🔍 Существующие поля платежа:', existingFields);

        // Добавляем поле payment_id если его нет
        if (!existingFields.includes('payment_id')) {
            console.log('➕ Добавляем поле payment_id');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN payment_id VARCHAR(255)
            `);
            console.log('✅ Поле payment_id добавлено');
        }

        // Добавляем поле payment_method если его нет
        if (!existingFields.includes('payment_method')) {
            console.log('➕ Добавляем поле payment_method');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN payment_method VARCHAR(50)
            `);
            console.log('✅ Поле payment_method добавлено');
        }

        // Добавляем поле payment_date если его нет
        if (!existingFields.includes('payment_date')) {
            console.log('➕ Добавляем поле payment_date');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN payment_date TIMESTAMP
            `);
            console.log('✅ Поле payment_date добавлено');
        }

        // Добавляем комментарии к полям
        await client.query(`
            COMMENT ON COLUMN invoices.payment_id IS 'ID платежа в платежной системе';
        `);
        await client.query(`
            COMMENT ON COLUMN invoices.payment_method IS 'Метод оплаты (yandex, card, etc.)';
        `);
        await client.query(`
            COMMENT ON COLUMN invoices.payment_date IS 'Дата и время оплаты';
        `);

        await client.query('COMMIT');
        console.log('✅ Миграция завершена успешно');

        // Проверяем результат
        const finalCheck = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name IN ('payment_id', 'payment_method', 'payment_date')
            ORDER BY column_name
        `);

        console.log('📋 Результат миграции:', finalCheck.rows);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка миграции:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Запуск миграции если файл выполняется напрямую
if (require.main === module) {
    addPaymentFields()
        .then(() => {
            console.log('✅ Миграция выполнена успешно');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка миграции:', error);
            process.exit(1);
        });
}

export default addPaymentFields;

