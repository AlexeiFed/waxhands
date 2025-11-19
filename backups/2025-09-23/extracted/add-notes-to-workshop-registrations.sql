-- Добавление колонки notes в таблицу workshop_registrations
-- Дата: 2025-01-09
-- Описание: Добавляет поле для примечаний к заказу

-- Добавляем колонку notes
ALTER TABLE workshop_registrations 
ADD COLUMN notes TEXT;

-- Добавляем комментарий к колонке
COMMENT ON COLUMN workshop_registrations.notes IS 'Примечания к заказу от родителя (пожелания по украшению ручки и т.д.)';

-- Проверяем, что колонка добавлена
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'workshop_registrations' 
AND column_name = 'notes';


