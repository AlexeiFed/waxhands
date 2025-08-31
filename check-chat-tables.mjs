import { query } from './dist/database/connection.js';

async function checkChatTables() {
    try {
        console.log('🔍 Проверяем таблицы чатов...');

        const result = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%chat%'
        `);

        console.log('📋 Найденные таблицы чатов:', result.rows);

        if (result.rows.length === 0) {
            console.log('❌ Таблицы чатов не найдены!');
            return;
        }

        // Проверяем структуру первой таблицы
        const tableName = result.rows[0].table_name;
        const structure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
        `, [tableName]);

        console.log(`🔍 Структура таблицы ${tableName}:`, structure.rows);

    } catch (error) {
        console.error('❌ Ошибка при проверке таблиц:', error);
    }
}

checkChatTables();



