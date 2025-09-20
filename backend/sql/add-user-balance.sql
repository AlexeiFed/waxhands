-- Добавление поля баланса к таблице пользователей
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Создание индекса для быстрого поиска по балансу
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);

-- Комментарии к новому полю
COMMENT ON COLUMN users.balance IS 'Баланс пользователя в рублях (начисляется при успешных оплатах)';

-- Обновление существующих пользователей (устанавливаем баланс 0 если NULL)
UPDATE users SET balance = 0.00 WHERE balance IS NULL;
