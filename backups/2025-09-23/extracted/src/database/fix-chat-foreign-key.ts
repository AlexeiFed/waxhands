/**
 * @file: backend/src/database/fix-chat-foreign-key.ts
 * @description: Миграция для исправления ограничения внешнего ключа в chat_messages
 * @dependencies: database/connection.ts
 * @created: 2024-12-19
 */

import { db } from './connection';

export async function fixChatForeignKey() {
    try {
        console.log('🔧 Начинаем исправление ограничения внешнего ключа chat_messages...');

        // Удаляем существующее ограничение внешнего ключа
        await db.query(`
            ALTER TABLE chat_messages 
            DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey
        `);

        console.log('✅ Удалено ограничение chat_messages_sender_id_fkey');

        // Добавляем условное ограничение только для пользователей (не для админов)
        // Создаем функцию для проверки
        await db.query(`
            CREATE OR REPLACE FUNCTION check_sender_exists(sender_id UUID, sender_type VARCHAR)
            RETURNS BOOLEAN AS $$
            BEGIN
                -- Если отправитель - админ, проверка не нужна
                IF sender_type = 'admin' THEN
                    RETURN TRUE;
                END IF;
                
                -- Если отправитель - пользователь, проверяем его существование в таблице users
                IF sender_type = 'user' THEN
                    RETURN EXISTS (SELECT 1 FROM users WHERE id = sender_id);
                END IF;
                
                -- Для других типов отправителей возвращаем FALSE
                RETURN FALSE;
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log('✅ Создана функция check_sender_exists');

        // Добавляем ограничение CHECK с использованием функции
        await db.query(`
            ALTER TABLE chat_messages 
            ADD CONSTRAINT check_sender_valid 
            CHECK (check_sender_exists(sender_id, sender_type))
        `);

        console.log('✅ Добавлено новое ограничение check_sender_valid');

        console.log('🎉 Миграция ограничения внешнего ключа завершена успешно!');

    } catch (error) {
        console.error('❌ Ошибка при исправлении ограничения внешнего ключа:', error);
        throw error;
    }
}

// Для запуска миграции используйте:
// npx tsx src/database/fix-chat-foreign-key.ts
