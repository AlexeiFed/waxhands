import { query } from './dist/database/connection.js';

async function checkChatStructure() {
    try {
        console.log('🔍 Проверяем структуру таблиц чатов...');

        // Проверяем таблицу chats
        const chatsStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'chats'
            ORDER BY ordinal_position
        `);

        console.log('📋 Структура таблицы chats:', chatsStructure.rows);

        // Проверяем таблицу chat_messages
        const messagesStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages'
            ORDER BY ordinal_position
        `);

        console.log('📋 Структура таблицы chat_messages:', messagesStructure.rows);

        // Проверяем данные в таблице chats
        const chatsData = await query('SELECT * FROM chats LIMIT 5');
        console.log('📋 Данные в таблице chats:', chatsData.rows);

    } catch (error) {
        console.error('❌ Ошибка при проверке структуры:', error);
    }
}

checkChatStructure();



