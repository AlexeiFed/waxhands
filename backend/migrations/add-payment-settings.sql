-- Миграция: создание таблицы payment_settings для управления статусом оплаты
CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_settings (is_enabled)
SELECT FALSE
WHERE NOT EXISTS (SELECT 1 FROM payment_settings);





