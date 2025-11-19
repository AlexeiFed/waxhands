-- Обновляем пути к изображениям бонусов
-- Заменяем несуществующие файлы на существующие

-- Сначала посмотрим, что у нас есть
SELECT id, title, image_url FROM bonuses;

-- Обновляем пути на существующие файлы
UPDATE bonuses 
SET image_url = '/uploads/images/images-1758535980196-238052079.jpg'
WHERE id = 1 AND image_url LIKE '%175781322%';

-- Проверяем результат
SELECT id, title, image_url FROM bonuses;


