/**
 * @file: backend/src/database/create-chat-tables.ts
 * @description: Скрипт для создания таблиц чата в базе данных
 * @dependencies: connection.ts
 * @created: 2024-12-19
 */
import { db } from './connection';
export async function createChatTables() {
    try {
        console.log('🔄 Создание таблиц чата...');
        // Создаем таблицу чатов
        await db.query(`
            CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                admin_id UUID,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        // Создаем таблицу сообщений чата
        await db.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY,
                chat_id UUID NOT NULL,
                sender_id UUID NOT NULL,
                sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
                message TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text',
                file_url TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        // Создаем таблицу уведомлений чата
        await db.query(`
            CREATE TABLE IF NOT EXISTS chat_notifications (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                chat_id UUID NOT NULL,
                unread_count INTEGER DEFAULT 0,
                last_read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                UNIQUE(user_id, chat_id)
            )
        `);
        // Создаем индексы для производительности
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_id ON chat_notifications(user_id)
        `);
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_chat_notifications_chat_id ON chat_notifications(chat_id)
        `);
        console.log('✅ Таблицы чата успешно созданы');
        // Проверяем существование таблиц
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('chats', 'chat_messages', 'chat_notifications')
            ORDER BY table_name
        `);
        console.log('📋 Созданные таблицы:');
        tables.rows.forEach((row) => {
            console.log(`  - ${row.table_name}`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка создания таблиц чата:', error);
        throw error;
    }
}
// Если файл запускается напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    createChatTables()
        .then(() => {
        console.log('🎉 Миграция таблиц чата завершена');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Ошибка миграции:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=create-chat-tables.js.map