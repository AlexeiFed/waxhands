import { query } from './dist/database/connection.js';

async function checkUsersTable() {
    try {
        console.log('🔍 Проверяем структуру таблицы users...');

        const structure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        console.log('📋 Структура таблицы users:', structure.rows);

        // Проверяем данные в таблице users
        const usersData = await query('SELECT * FROM users LIMIT 3');
        console.log('📋 Данные в таблице users:', usersData.rows);

    } catch (error) {
        console.error('❌ Ошибка при проверке таблицы users:', error);
    }
}

checkUsersTable();



