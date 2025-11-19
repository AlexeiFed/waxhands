-- Добавление полей для отслеживания прочтения сообщений
-- Выполнить в базе данных

-- Добавляем поля для отслеживания прочтения сообщений
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS read_by TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Создаем индекс для быстрого поиска непрочитанных сообщений
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_status 
ON chat_messages(chat_id, is_read, read_at);

-- Обновляем существующие сообщения, устанавливая read_at для прочитанных
UPDATE chat_messages 
SET read_at = updated_at 
WHERE is_read = true AND read_at IS NULL;

-- Комментарии к полям
COMMENT ON COLUMN chat_messages.read_at IS 'Время прочтения сообщения';
COMMENT ON COLUMN chat_messages.read_by IS 'Массив ID пользователей, прочитавших сообщение';
