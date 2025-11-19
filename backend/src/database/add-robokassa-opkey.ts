/**
 * @file: add-robokassa-opkey.ts
 * @description: Миграция для добавления поля robokassa_op_key в таблицу invoices
 * @dependencies: database/connection.ts
 * @created: 2025-10-17
 */

import pool from './connection.js';

async function addRobokassaOpKey() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🔄 Проверяем наличие поля robokassa_op_key...');

        // Проверяем, существует ли уже поле
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name = 'robokassa_op_key'
        `);

        if (checkResult.rows.length === 0) {
            console.log('➕ Добавляем поле robokassa_op_key');
            await client.query(`
                ALTER TABLE invoices 
                ADD COLUMN robokassa_op_key VARCHAR(255)
            `);
            console.log('✅ Поле robokassa_op_key добавлено');

            // Добавляем комментарий к полю
            await client.query(`
                COMMENT ON COLUMN invoices.robokassa_op_key IS 'OpKey операции Robokassa для возвратов (GUID из XML API)'
            `);
            console.log('✅ Комментарий добавлен');

            // Создаем индекс для быстрого поиска
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_invoices_robokassa_op_key 
                ON invoices(robokassa_op_key)
                WHERE robokassa_op_key IS NOT NULL
            `);
            console.log('✅ Индекс создан');
        } else {
            console.log('ℹ️ Поле robokassa_op_key уже существует');
        }

        await client.query('COMMIT');
        console.log('✅ Миграция завершена успешно');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Ошибка миграции:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Запускаем миграцию если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    addRobokassaOpKey()
        .then(() => {
            console.log('✅ Миграция успешно применена');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Ошибка при выполнении миграции:', error);
            process.exit(1);
        });
}

export default addRobokassaOpKey;









