/**
 * @file: check-invoice-data.js
 * @description: Скрипт для проверки данных счета после записи на мастер-класс
 * @dependencies: PostgreSQL
 * @created: 2025-01-27
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkLatestInvoice() {
    try {
        console.log('🔍 Проверяем последний созданный счет...\n');

        // Получаем последний счет
        const invoiceResult = await pool.query(`
            SELECT 
                i.id,
                i.participant_id,
                i.master_class_id,
                i.amount,
                i.status,
                i.payment_label,
                i.created_at,
                p.name as participant_name,
                mc.name as master_class_name
            FROM invoices i
            LEFT JOIN participants p ON i.participant_id = p.id
            LEFT JOIN master_class_events mc ON i.master_class_id = mc.id
            ORDER BY i.created_at DESC
            LIMIT 1
        `);

        if (invoiceResult.rows.length === 0) {
            console.log('❌ Счетов не найдено');
            return;
        }

        const invoice = invoiceResult.rows[0];
        console.log('✅ Последний счет:');
        console.log(`   ID: ${invoice.id}`);
        console.log(`   Участник: ${invoice.participant_name} (${invoice.participant_id})`);
        console.log(`   Мастер-класс: ${invoice.master_class_name} (${invoice.master_class_id})`);
        console.log(`   Сумма: ${invoice.amount} руб.`);
        console.log(`   Статус: ${invoice.status}`);
        console.log(`   Payment Label: ${invoice.payment_label || 'НЕ УКАЗАН'}`);
        console.log(`   Создан: ${invoice.created_at}`);

        // Проверяем связанные данные
        console.log('\n🔍 Дополнительная информация:');

        // Проверяем участника
        const participantResult = await pool.query(
            'SELECT name, parent_id FROM participants WHERE id = $1',
            [invoice.participant_id]
        );

        if (participantResult.rows.length > 0) {
            const participant = participantResult.rows[0];
            console.log(`   Родитель участника: ${participant.parent_id}`);

            // Проверяем родителя
            const parentResult = await pool.query(
                'SELECT name, email FROM users WHERE id = $1',
                [participant.parent_id]
            );

            if (parentResult.rows.length > 0) {
                const parent = parentResult.rows[0];
                console.log(`   Данные родителя: ${parent.name} (${parent.email})`);
            }
        }

        // Проверяем мастер-класс
        const masterClassResult = await pool.query(`
            SELECT 
                name,
                price,
                executor_id,
                (SELECT name FROM users WHERE id = executor_id) as executor_name
            FROM master_class_events 
            WHERE id = $1
        `, [invoice.master_class_id]);

        if (masterClassResult.rows.length > 0) {
            const masterClass = masterClassResult.rows[0];
            console.log(`   Исполнитель: ${masterClass.executor_name} (${masterClass.executor_id})`);
            console.log(`   Цена мастер-класса: ${masterClass.price} руб.`);
        }

        console.log('\n📊 Готов к тестированию оплаты!');

    } catch (error) {
        console.error('❌ Ошибка при проверке данных:', error);
    } finally {
        await pool.end();
    }
}

checkLatestInvoice();
