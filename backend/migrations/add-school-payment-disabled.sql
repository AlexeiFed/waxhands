-- Миграция: Добавление поля payment_disabled в таблицу schools
-- Дата создания: 2025-01-XX
-- Описание: Добавляет возможность отключать оплату для конкретной школы

-- Добавляем поле payment_disabled в таблицу schools
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS payment_disabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Добавляем комментарий к полю
COMMENT ON COLUMN schools.payment_disabled IS 'Флаг отключения оплаты для данной школы. Если TRUE, оплата через Robokassa недоступна для всех классов этой школы.';

-- Создаем индекс для быстрого поиска школ с отключенной оплатой
CREATE INDEX IF NOT EXISTS idx_schools_payment_disabled ON schools(payment_disabled) WHERE payment_disabled = TRUE;





