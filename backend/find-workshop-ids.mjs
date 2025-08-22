import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'waxhands',
    password: 'N1fQZhaT',
    port: 5432,
});

(async () => {
    try {
        const client = await pool.connect();

        console.log('🔍 Ищем все мастер-классы на 25.08.2025...');

        const workshops = await client.query(`
      SELECT id, date
      FROM master_class_events 
      WHERE date = '2025-08-25'
      ORDER BY date
    `);

        console.log(`Найдено ${workshops.rows.length} мастер-классов:`);
        workshops.rows.forEach((workshop, index) => {
            console.log(`${index + 1}. ID: ${workshop.id}`);
            console.log(`   Дата: ${workshop.date}`);
            console.log('');
        });

        const fedyaId = '2b430f63-7b77-4b87-8c73-7979c4ee7e34';

        console.log('\n🔍 Проверяем все регистрации Федора...');

        const registrations = await client.query(`
      SELECT wr.id, wr.workshop_id, mce.date
      FROM workshop_registrations wr
      JOIN master_class_events mce ON wr.workshop_id = mce.id
      WHERE wr.user_id = $1
      ORDER BY mce.date
    `, [fedyaId]);

        if (registrations.rows.length > 0) {
            console.log(`Федор зарегистрирован на ${registrations.rows.length} мастер-классов:`);
            registrations.rows.forEach((reg, index) => {
                console.log(`${index + 1}. Дата: ${reg.date}`);
                console.log(`   Workshop ID: ${reg.workshop_id}`);
                console.log(`   Registration ID: ${reg.id}`);
                console.log('');
            });

            // Удалим первую регистрацию
            if (registrations.rows.length > 0) {
                const firstReg = registrations.rows[0];
                console.log(`🗑️ Удаляем регистрацию ID: ${firstReg.id}...`);

                await client.query(`
          DELETE FROM workshop_registrations 
          WHERE id = $1
        `, [firstReg.id]);

                console.log('✅ Регистрация удалена успешно');
            }

        } else {
            console.log('Федор не зарегистрирован ни на один мастер-класс');
        }

        client.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exit(1);
    }
})();
