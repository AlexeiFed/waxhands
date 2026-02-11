-- Миграция: создание таблицы landing_settings для управления доступом к регистрации/входу с лендинга
CREATE TABLE IF NOT EXISTS landing_settings (
    id SERIAL PRIMARY KEY,
    registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Вставка начальной записи, если её нет
INSERT INTO landing_settings (registration_enabled)
SELECT FALSE
WHERE NOT EXISTS (SELECT 1 FROM landing_settings);

