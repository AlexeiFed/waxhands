const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'waxhands',
    user: 'waxhands_user',
    password: 'waxhands123'
});

async function checkAdminUsers() {
    try {
        const result = await pool.query('SELECT email, role FROM users WHERE role = $1', ['admin']);
        console.log('Админы в системе:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('Админов не найдено. Проверяем всех пользователей...');
            const allUsers = await pool.query('SELECT email, role FROM users LIMIT 10');
            console.log('Первые 10 пользователей:', allUsers.rows);
        }
    } catch (err) {
        console.error('Ошибка при проверке пользователей:', err);
    } finally {
        await pool.end();
    }
}

checkAdminUsers();
