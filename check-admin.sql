-- Проверка пользователя админа
SELECT id, username, role, name, surname, phone 
FROM users 
WHERE role = 'admin' 
LIMIT 3;
