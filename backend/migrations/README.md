# Миграции базы данных

## normalize_user_data.sql

**Дата:** 2024-10-15  
**Автор:** Алексей  
**Описание:** Нормализация существующих данных пользователей

### Проблема
Некоторые пользователи не могли войти в приложение из-за:
- Лишних пробелов в фамилиях при регистрации
- Различного регистра букв в фамилиях
- Неодинакового формата телефонов (с пробелами/без)

### Решение
1. **В коде backend** (auth.ts):
   - Добавлена нормализация данных при входе (trim, lowercase)
   - Сравнение фамилий без учета регистра (`LOWER(TRIM(surname))`)
   - Нормализация телефонов при поиске (только цифры)
   - Улучшенная проверка уникальности телефонов при регистрации

2. **В базе данных** (миграция):
   - Удаление лишних пробелов из всех текстовых полей
   - Нормализация email (lowercase)
   - Проверка и вывод дубликатов телефонов

### Как применить миграцию

#### На локальной машине (Windows):
```powershell
# Подключение к PostgreSQL
psql -U postgres -d waxhands

# Применение миграции
\i backend/migrations/normalize_user_data.sql
```

#### На сервере:
```bash
# Подключение через SSH
ssh root@147.45.161.83

# Запуск миграции
sudo -u postgres psql -d waxhands -f /var/www/waxhands-app/backend/migrations/normalize_user_data.sql
```

### Проверка результатов

После применения миграции:

1. **Проверка нормализации:**
```sql
SELECT id, name, surname, phone, role 
FROM users 
WHERE role = 'parent' 
ORDER BY surname;
```

2. **Проверка дубликатов телефонов:**
```sql
SELECT 
    regexp_replace(phone, '[^0-9]', '', 'g') as normalized_phone,
    COUNT(*) as count,
    STRING_AGG(name || ' ' || surname, ', ') as users
FROM users
WHERE phone IS NOT NULL
GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
HAVING COUNT(*) > 1;
```

3. **Тестовый вход:**
```bash
curl -X POST https://waxhands.ru/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "surname": "Лазарева",
    "phone": "+79244161432",
    "role": "parent"
  }'
```

### Откат (если нужно)
Миграция делает только нормализацию данных (trim), поэтому откат не требуется.

### После применения
1. Проверить логи backend для входа проблемных пользователей
2. Убедиться, что нет дубликатов телефонов
3. Протестировать вход с разным регистром фамилии



