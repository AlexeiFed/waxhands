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

        const result = await pool.query(`
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

        if (result.rows.length === 0) {
            console.log('❌ Счетов не найдено');
            return;
        }

        const invoice = result.rows[0];
        console.log('✅ Последний счет:');
        console.log(`   ID: ${invoice.id}`);
        console.log(`   Участник: ${invoice.participant_name} (${invoice.participant_id})`);
        console.log(`   Мастер-класс: ${invoice.master_class_name} (${invoice.master_class_id})`);
        console.log(`   Сумма: ${invoice.amount} руб.`);
        console.log(`   Статус: ${invoice.status}`);
        console.log(`   Payment Label: ${invoice.payment_label || 'НЕ УКАЗАН'}`);
        console.log(`   Создан: ${invoice.created_at}`);

        console.log('\n📊 Готов к тестированию оплаты!');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

checkLatestInvoice();
