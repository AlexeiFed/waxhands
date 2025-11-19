const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkBonuses() {
    try {
        const result = await pool.query('SELECT id, title, image_url FROM bonuses ORDER BY id DESC LIMIT 5');
        console.log('Бонусы в базе данных:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error('Ошибка при запросе к базе данных:', err);
    } finally {
        await pool.end();
    }
}

checkBonuses();


