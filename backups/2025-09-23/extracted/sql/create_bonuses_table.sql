-- Создание таблицы для хранения данных о бонусах
CREATE TABLE IF NOT EXISTS bonuses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    media JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_bonuses_created_at ON bonuses(created_at DESC);

-- Комментарии к таблице и полям
COMMENT ON TABLE bonuses IS 'Таблица для хранения информации о бонусах для пользователей';
COMMENT ON COLUMN bonuses.title IS 'Заголовок бонусов (текст с информацией о подарках)';
COMMENT ON COLUMN bonuses.media IS 'JSON массив с путями к медиафайлам (постеры)';
COMMENT ON COLUMN bonuses.created_by IS 'ID пользователя, создавшего запись';
COMMENT ON COLUMN bonuses.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN bonuses.updated_at IS 'Дата и время последнего обновления записи';
