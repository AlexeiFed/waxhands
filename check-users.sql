-- Проверка пользователей
SELECT id, name, surname, role, school_id, school_name, parent_id 
FROM users 
WHERE role IN ('parent', 'child') 
ORDER BY role, name 
LIMIT 20;



