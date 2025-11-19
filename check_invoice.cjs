const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'waxhands',
  user: 'waxhands_user',
  password: 'waxhands123'
});

async function checkInvoice() {
  try {
    // Ищем счета на сумму 750 рублей
    const result = await pool.query(
      `SELECT id, status, amount, robokassa_invoice_id, participant_name, payment_date, payment_status, master_class_id, participant_id
       FROM invoices 
       WHERE amount = 750 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    
    console.log('Найдено счетов на 750 рублей:', result.rows.length);
    console.log('---');
    
    result.rows.forEach((row, index) => {
      console.log(`\nСчет #${index + 1}:`);
      console.log('ID:', row.id);
      console.log('Участник:', row.participant_name);
      console.log('Сумма:', row.amount);
      console.log('Статус:', row.status);
      console.log('Payment Status:', row.payment_status);
      console.log('Robokassa ID:', row.robokassa_invoice_id);
      console.log('Payment Date:', row.payment_date);
      console.log('Master Class ID:', row.master_class_id);
      console.log('Participant ID:', row.participant_id);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Ошибка:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkInvoice();


