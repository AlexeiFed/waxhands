-- Добавление новых полей в таблицу workshop_requests
-- Дата: 2025-01-09
-- Описание: Добавляет поля для города, типа школы и дополнительной информации

-- Добавляем колонку city
ALTER TABLE workshop_requests 
ADD COLUMN city VARCHAR(255);

-- Добавляем колонку is_other_school
ALTER TABLE workshop_requests 
ADD COLUMN is_other_school BOOLEAN DEFAULT FALSE;

-- Добавляем колонку other_school_name
ALTER TABLE workshop_requests 
ADD COLUMN other_school_name VARCHAR(255);

-- Добавляем колонку other_school_address
ALTER TABLE workshop_requests 
ADD COLUMN other_school_address TEXT;

-- Делаем desired_date опциональным (если еще не сделано)
ALTER TABLE workshop_requests 
ALTER COLUMN desired_date DROP NOT NULL;

-- Добавляем комментарии к колонкам
COMMENT ON COLUMN workshop_requests.city IS 'Город школы/сада';
COMMENT ON COLUMN workshop_requests.is_other_school IS 'Флаг, указывающий что выбрана "другая" школа';
COMMENT ON COLUMN workshop_requests.other_school_name IS 'Название дополнительной школы/сада';
COMMENT ON COLUMN workshop_requests.other_school_address IS 'Адрес дополнительной школы/сада';

-- Проверяем, что колонки добавлены
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'workshop_requests' 
AND column_name IN ('city', 'is_other_school', 'other_school_name', 'other_school_address', 'desired_date')
ORDER BY column_name;

