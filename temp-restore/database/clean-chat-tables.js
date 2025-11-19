/**
 * @file: backend/src/database/clean-chat-tables.ts
 * @description: Скрипт для очистки всех таблиц чата в базе данных
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import { db } from './connection';
export async function cleanChatTables() {
    try {
        console.log('🧹 Очистка таблиц чата...');
        // Проверяем существование таблиц
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('chats', 'chat_messages', 'chat_notifications')
            ORDER BY table_name
        `);
        if (tables.rows.length === 0) {
            console.log('ℹ️ Таблицы чата не найдены, создаю их...');
            // Импортируем и создаем таблицы
            const { createChatTables } = await import('./create-chat-tables');
            await createChatTables();
        }
        console.log('🗑️ Удаляю все данные из таблиц чата...');
        // Очищаем таблицы в правильном порядке (с учетом foreign keys)
        await db.query('DELETE FROM chat_notifications');
        console.log('✅ chat_notifications очищена');
        await db.query('DELETE FROM chat_messages');
        console.log('✅ chat_messages очищена');
        await db.query('DELETE FROM chats');
        console.log('✅ chats очищена');
        // Сбрасываем автоинкрементные счетчики (если есть)
        try {
            await db.query('ALTER SEQUENCE IF EXISTS chats_id_seq RESTART WITH 1');
            await db.query('ALTER SEQUENCE IF EXISTS chat_messages_id_seq RESTART WITH 1');
            await db.query('ALTER SEQUENCE IF EXISTS chat_notifications_id_seq RESTART WITH 1');
            console.log('✅ Счетчики сброшены');
        }
        catch (error) {
            // UUID не используют автоинкремент, поэтому ошибка ожидаема
            console.log('ℹ️ Счетчики не найдены (используются UUID)');
        }
        // Проверяем, что таблицы пусты
        const chatCount = await db.query('SELECT COUNT(*) as count FROM chats');
        const messageCount = await db.query('SELECT COUNT(*) as count FROM chat_messages');
        const notificationCount = await db.query('SELECT COUNT(*) as count FROM chat_notifications');
        console.log('📊 Результат очистки:');
        console.log(`  - chats: ${chatCount.rows[0].count} записей`);
        console.log(`  - chat_messages: ${messageCount.rows[0].count} записей`);
        console.log(`  - chat_notifications: ${notificationCount.rows[0].count} записей`);
        console.log('🎉 Очистка таблиц чата завершена успешно');
    }
    catch (error) {
        console.error('❌ Ошибка очистки таблиц чата:', error);
        throw error;
    }
}
// Если файл запускается напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanChatTables()
        .then(() => {
        console.log('🎉 Очистка таблиц чата завершена');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Ошибка очистки:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=clean-chat-tables.js.map