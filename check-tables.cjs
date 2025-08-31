const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkTables() {
    try {
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('Все таблицы в базе данных:');
        result.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });

    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        await pool.end();
    }
}

checkTables();
