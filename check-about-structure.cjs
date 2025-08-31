const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkAboutTable() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'about' 
      ORDER BY ordinal_position
    `);

        console.log('Структура таблицы about:');
        console.log(JSON.stringify(result.rows, null, 2));

        // Проверим данные
        const dataResult = await pool.query('SELECT * FROM about LIMIT 1');
        console.log('\nПример данных:');
        console.log(JSON.stringify(dataResult.rows[0], null, 2));

    } catch (err) {
        console.error('Ошибка:', err);
    } finally {
        await pool.end();
    }
}

checkAboutTable();
