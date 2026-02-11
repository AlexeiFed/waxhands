# 🚀 Инструкция по применению миграции landing_settings

## 📋 Описание

Миграция создает таблицу `landing_settings` для управления доступом к регистрации и входу с лендинга.

## 🔧 Применение миграции

### На сервере

```bash
# Подключиться к серверу
ssh root@147.45.161.83

# Применить миграцию
sudo -u postgres psql -d waxhands -f /var/www/waxhands-app/backend/migrations/add-landing-settings.sql

# Выдать права пользователю БД (ОБЯЗАТЕЛЬНО!)
sudo -u postgres psql -d waxhands -c 'GRANT ALL PRIVILEGES ON TABLE landing_settings TO waxhands_user;'
sudo -u postgres psql -d waxhands -c 'GRANT USAGE, SELECT ON SEQUENCE landing_settings_id_seq TO waxhands_user;'
```

### Локально (для тестирования)

```bash
# Если PostgreSQL установлен локально
psql -U postgres -d waxhands -f backend/migrations/add-landing-settings.sql
```

## ✅ Проверка

После применения миграции проверьте:

```sql
-- Подключиться к БД
sudo -u postgres psql -d waxhands

-- Проверить таблицу
SELECT * FROM landing_settings;

-- Должна быть одна запись с registration_enabled = false
```

### Проверка API

```bash
# Проверить публичный endpoint
curl http://localhost:3001/api/landing-settings/public

# Должен вернуть:
# {"success":true,"data":{"registrationEnabled":false,"updatedAt":"..."}}
```

## 🎯 Использование

1. **В админ-панели:**
   - Перейдите на вкладку "Обзор"
   - Найдите карточку "Настройки лендинга"
   - Переключите "Регистрация и вход на лендинге" в положение ВКЛ/ВЫКЛ

2. **На лендинге:**
   - При `registration_enabled = false`: Кнопки регистрации и входа скрыты
   - При `registration_enabled = true`: Кнопки регистрации и входа отображаются

## 📝 Структура таблицы

```sql
CREATE TABLE landing_settings (
    id SERIAL PRIMARY KEY,
    registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Откат миграции (если нужно)

```sql
DROP TABLE IF EXISTS landing_settings;
```

---

**Дата создания:** 2026-01-19  
**Версия:** 1.0

