-- Исправление дублирующихся столбцов в таблице about_media

-- Удаляем дублирующиеся столбцы, оставляя новые
ALTER TABLE about_media DROP COLUMN IF EXISTS file_type;
ALTER TABLE about_media DROP COLUMN IF EXISTS alt_text;

-- Проверяем результат
SELECT 'about_media' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'about_media' 
ORDER BY ordinal_position;

-- Проверяем структуру таблицы about
SELECT 'about' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'about' 
ORDER BY ordinal_position;
