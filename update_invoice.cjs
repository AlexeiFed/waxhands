const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'waxhands',
  user: 'waxhands_user',
  password: 'waxhands123'
});

const INVOICE_ID = '1cdc8bee-8bb4-4581-aed5-8e64b9497a6f';
const MASTER_CLASS_ID = '3b84f47d-32c0-40cd-a36e-ef456981b11d';
const PARTICIPANT_ID = '95dbb880-efcb-48e9-ba93-17735cdd6b8c';
const ROBOKASSA_OPERATION_ID = '457206875';

async function updateInvoice() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('1. Обновление счета...');
    const updateResult = await client.query(`
      UPDATE invoices 
      SET status = 'paid',
          payment_status = 'paid',
          payment_id = $1,
          payment_method = 'card',
          payment_date = '2025-11-12 11:26:29',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [ROBOKASSA_OPERATION_ID, INVOICE_ID]);
    
    console.log('✅ Счет обновлен:', updateResult.rows[0].status);
    
    console.log('\n2. Обновление статуса участника в мастер-классе...');
    const mcResult = await client.query(
      'SELECT participants FROM master_class_events WHERE id = $1',
      [MASTER_CLASS_ID]
    );
    
    if (mcResult.rows.length > 0) {
      let participants = mcResult.rows[0].participants || [];
      
      // Находим участника и обновляем isPaid
      participants = participants.map(p => {
        if (p.id === PARTICIPANT_ID) {
          console.log(`✅ Найден участник: ${p.name}`);
          return { ...p, isPaid: true };
        }
        return p;
      });
      
      await client.query(
        'UPDATE master_class_events SET participants = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(participants), MASTER_CLASS_ID]
      );
      
      console.log('✅ Статус оплаты участника обновлен в мастер-классе');
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Все изменения успешно применены!');
    console.log('\nИнформация:');
    console.log('- Счет ID:', INVOICE_ID);
    console.log('- Участник ID:', PARTICIPANT_ID);
    console.log('- Мастер-класс ID:', MASTER_CLASS_ID);
    console.log('- Robokassa Operation ID:', ROBOKASSA_OPERATION_ID);
    console.log('\nРекомендуется перезапустить backend для применения WebSocket уведомлений');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateInvoice().catch(err => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});


