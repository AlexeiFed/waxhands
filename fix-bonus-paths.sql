-- Обновляем пути к изображениям бонусов
-- Заменяем несуществующие файлы на существующие

-- Сначала посмотрим структуру таблицы
\d bonuses;

-- Посмотрим текущие данные
SELECT id, title, media FROM bonuses;

-- Обновляем media поле, заменяя несуществующие пути на существующие
UPDATE bonuses 
SET media = '["/uploads/images/images-1758535980196-238052079.jpg"]'
WHERE id = 1 AND media::text LIKE '%175781322%';

-- Проверяем результат
SELECT id, title, media FROM bonuses;


