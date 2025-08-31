-- Обновление пароля админа на 'admin123'
-- Простой хеш для тестирования
UPDATE users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'admin@waxhands.ru';
