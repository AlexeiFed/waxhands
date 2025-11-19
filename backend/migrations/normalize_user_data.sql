/**
 * @file: normalize_user_data.sql
 * @description: Миграция для нормализации существующих данных пользователей
 * @created: 2024-10-15
 * @author: Алексей
 */

-- Начинаем транзакцию
BEGIN;

-- 1. Нормализуем телефоны (удаляем пробелы и лишние символы, оставляем только цифры и +)
UPDATE users 
SET phone = TRIM(phone)
WHERE phone IS NOT NULL AND phone != '';

-- 2. Нормализуем фамилии (удаляем лишние пробелы)
UPDATE users 
SET surname = TRIM(surname)
WHERE surname IS NOT NULL AND surname != '';

-- 3. Нормализуем имена (удаляем лишние пробелы)
UPDATE users 
SET name = TRIM(name)
WHERE name IS NOT NULL AND name != '';

-- 4. Нормализуем email (trim + lowercase)
UPDATE users 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email != '';

-- 5. Проверяем дубликаты телефонов после нормализации
-- Выводим список пользователей с одинаковыми нормализованными телефонами
SELECT 
    regexp_replace(phone, '[^0-9]', '', 'g') as normalized_phone,
    COUNT(*) as count,
    STRING_AGG(id::text || ' (' || name || ' ' || surname || ')', ', ') as users
FROM users
WHERE phone IS NOT NULL AND phone != ''
GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
HAVING COUNT(*) > 1;

-- 6. Логируем изменения
DO $$
DECLARE
    updated_phones INTEGER;
    updated_surnames INTEGER;
    updated_names INTEGER;
    updated_emails INTEGER;
BEGIN
    -- Подсчитываем количество нормализованных записей
    SELECT COUNT(*) INTO updated_phones FROM users WHERE phone IS NOT NULL AND phone != '';
    SELECT COUNT(*) INTO updated_surnames FROM users WHERE surname IS NOT NULL AND surname != '';
    SELECT COUNT(*) INTO updated_names FROM users WHERE name IS NOT NULL AND name != '';
    SELECT COUNT(*) INTO updated_emails FROM users WHERE email IS NOT NULL AND email != '';
    
    RAISE NOTICE 'Нормализация завершена:';
    RAISE NOTICE '- Телефонов: %', updated_phones;
    RAISE NOTICE '- Фамилий: %', updated_surnames;
    RAISE NOTICE '- Имен: %', updated_names;
    RAISE NOTICE '- Email: %', updated_emails;
END $$;

-- Фиксируем изменения
COMMIT;

-- Выводим статистику после миграции
SELECT 
    'Всего пользователей' as metric,
    COUNT(*) as value
FROM users
UNION ALL
SELECT 
    'С телефонами' as metric,
    COUNT(*) as value
FROM users
WHERE phone IS NOT NULL AND phone != ''
UNION ALL
SELECT 
    'Родителей' as metric,
    COUNT(*) as value
FROM users
WHERE role = 'parent'
UNION ALL
SELECT 
    'Детей' as metric,
    COUNT(*) as value
FROM users
WHERE role = 'child';



