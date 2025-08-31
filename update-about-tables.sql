-- Обновление структуры таблицы about
-- Добавляем недостающие столбцы в соответствии с ожидаемой структурой

-- Добавляем новые столбцы в таблицу about
ALTER TABLE about ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS contact_info TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS studio_title TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS studio_description TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS advantages_title TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS advantages_list TEXT[];
ALTER TABLE about ADD COLUMN IF NOT EXISTS process_title TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS process_steps JSONB;
ALTER TABLE about ADD COLUMN IF NOT EXISTS safety_title TEXT;
ALTER TABLE about ADD COLUMN IF NOT EXISTS safety_description TEXT;

-- Обновляем существующие записи
UPDATE about SET 
    subtitle = '✨ Магия творчества ✨',
    description = 'Создай свою уникальную 3D копию руки в восковом исполнении. Захвати эмоции, впечатления и уникальные сувениры за 5 минут! 🎉',
    studio_title = 'О нашей студии',
    studio_description = 'Студия «МК Восковые ручки» — это место, где рождается магия творчества. Мы создаем уникальные 3D-копии рук детей в восковом исполнении.',
    advantages_title = 'Почему выбирают нас',
    advantages_list = ARRAY['Безопасный воск', 'Быстрое создание', 'Уникальный результат', 'Профессиональные мастера'],
    process_title = 'Как проходит мастер-класс',
    process_steps = '[{"title": "Подготовка", "description": "Выбираем цвет воска и подготавливаем рабочее место"}, {"title": "Создание отпечатка", "description": "Ребенок погружает руку в теплый воск на 7 минут"}, {"title": "Обработка", "description": "Мастер обрабатывает и украшает готовую ручку"}, {"title": "Готово!", "description": "Уникальная восковая ручка готова к использованию"}]',
    safety_title = 'Безопасность',
    safety_description = 'Мы используем только сертифицированные материалы, безопасные для детей. Воск имеет оптимальную температуру и не вызывает ожогов.'
WHERE section = 'main';

UPDATE about SET 
    subtitle = 'Разнообразие вариантов',
    description = 'Выбирайте из множества стилей и опций для создания идеальной восковой ручки'
WHERE section = 'services';

UPDATE about SET 
    subtitle = 'Простой и увлекательный процесс',
    description = 'Весь процесс занимает всего 7 минут и проходит в игровой форме'
WHERE section = 'process';

-- Обновляем структуру таблицы about_media
-- Добавляем недостающие столбцы
ALTER TABLE about_media ADD COLUMN IF NOT EXISTS filename VARCHAR(255);
ALTER TABLE about_media ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);
ALTER TABLE about_media ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE about_media ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE about_media ADD COLUMN IF NOT EXISTS description TEXT;

-- Переименовываем существующие столбцы для соответствия новой структуре
ALTER TABLE about_media RENAME COLUMN file_type TO type;
ALTER TABLE about_media RENAME COLUMN alt_text TO title;

-- Добавляем индекс для оптимизации
CREATE INDEX IF NOT EXISTS idx_about_media_type ON about_media(type);
CREATE INDEX IF NOT EXISTS idx_about_media_order ON about_media(order_index);

-- Проверяем результат
SELECT 'about' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'about' 
ORDER BY ordinal_position;

SELECT 'about_media' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'about_media' 
ORDER BY ordinal_position;
