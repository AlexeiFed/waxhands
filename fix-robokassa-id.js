import pool from './dist/database/connection.js';

async function fixRobokassaInvoiceId() {
    try {
        console.log('🔄 Исправляем robokassa_invoice_id для существующих счетов...');

        // Для счета 246e6167-0663-4bf5-a21a-2da0bd8dd4e9 обновляем ID операции
        // По скриншоту: номер заказа 1758928532436, ID операции 448122652
        const result = await pool.query(`
            UPDATE invoices 
            SET robokassa_invoice_id = $1
            WHERE id = $2
        `, ['448122652', '246e6167-0663-4bf5-a21a-2da0bd8dd4e9']);

        console.log('✅ Обновлено строк:', result.rowCount);

        // Проверяем результат
        const checkResult = await pool.query(`
            SELECT id, robokassa_invoice_id, amount, status 
            FROM invoices 
            WHERE id = $1
        `, ['246e6167-0663-4bf5-a21a-2da0bd8dd4e9']);

        console.log('📋 Результат обновления:');
        console.log(JSON.stringify(checkResult.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('❌ Ошибка:', err);
        process.exit(1);
    }
}

fixRobokassaInvoiceId();
