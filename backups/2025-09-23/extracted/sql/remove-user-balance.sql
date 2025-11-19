-- Удаление поля баланса из таблицы пользователей
ALTER TABLE users DROP COLUMN IF EXISTS balance;

-- Удаление индекса для баланса
DROP INDEX IF EXISTS idx_users_balance;

-- Комментарий об удалении
-- Поле balance удалено из таблицы users - система бонусов отключена
