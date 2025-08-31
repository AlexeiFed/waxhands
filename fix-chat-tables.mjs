import { query } from './dist/database/connection.js';

async function fixChatTables() {
    try {
        console.log('🔧 Исправляем структуру таблиц чатов...');

        // Удаляем старые таблицы
        console.log('🗑️ Удаляем старые таблицы...');
        await query('DROP TABLE IF EXISTS chat_notifications CASCADE');
        await query('DROP TABLE IF EXISTS chat_messages CASCADE');
        await query('DROP TABLE IF EXISTS chats CASCADE');

        // Создаем новые таблицы с правильной структурой
        console.log('📋 Создаем таблицу chats...');
        await query(`
            CREATE TABLE IF NOT EXISTS chats (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                admin_id UUID,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('📋 Создаем таблицу chat_messages...');
        await query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                chat_id UUID NOT NULL,
                sender_id UUID NOT NULL,
                sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
                content TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text',
                file_url TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('📋 Создаем таблицу chat_notifications...');
        await query(`
            CREATE TABLE IF NOT EXISTS chat_notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                chat_id UUID NOT NULL,
                unread_count INTEGER DEFAULT 0,
                last_read_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Таблицы чатов исправлены!');

        // Проверяем структуру
        const chatsStructure = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'chats'
            ORDER BY ordinal_position
        `);

        console.log('📋 Новая структура таблицы chats:', chatsStructure.rows);

    } catch (error) {
        console.error('❌ Ошибка при исправлении таблиц:', error);
    }
}

fixChatTables();



