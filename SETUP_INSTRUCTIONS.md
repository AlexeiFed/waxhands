# ИНСТРУКЦИИ ПО НАСТРОЙКЕ - Wax Hands PWA

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js 18+** - [Скачать](https://nodejs.org/)
- **PostgreSQL 12+** - [Скачать](https://www.postgresql.org/download/)
- **Git** - [Скачать](https://git-scm.com/)

### 1. Клонирование и установка

```bash
# Клонируем репозиторий
git clone <repository-url>
cd waxhands-playful-pwa

# Устанавливаем зависимости фронтенда
npm install

# Переходим в папку бэкенда
cd backend
npm install
```

### 2. Настройка базы данных

#### Установка PostgreSQL

**Windows:**
1. Скачайте установщик с официального сайта
2. Запустите установщик
3. Запомните пароль для пользователя postgres
4. Установите pgAdmin (опционально)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Создание базы данных

```bash
# Подключаемся к PostgreSQL
psql -U postgres

# Создаем базу данных
CREATE DATABASE waxhands;

# Проверяем создание
\l

# Выходим
\q
```

### 3. Настройка переменных окружения

#### Бэкенд (.env)

```bash
cd backend
cp .env.example .env
```

Отредактируйте файл `.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxhands
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security
BCRYPT_ROUNDS=12
```

#### Фронтенд (.env)

```bash
cd ..  # Возвращаемся в корневую папку
cp .env.example .env
```

Отредактируйте файл `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Запуск бэкенда

```bash
cd backend

# Создаем таблицы в базе данных
npm run db:migrate

# Заполняем тестовыми данными
npm run db:seed

# Запускаем сервер разработки
npm run dev
```

Сервер будет доступен по адресу: http://localhost:3001

### 5. Запуск приложения

#### Вариант 1: Запуск фронтенда и бэкенда одновременно (рекомендуется)

```bash
# Из корневой папки проекта
npm run dev:full
```

Это запустит:
- Фронтенд на http://localhost:8080
- Бэкенд на http://localhost:3001

#### Вариант 2: Запуск по отдельности

**Бэкенд:**
```bash
cd backend
npm run dev
```

**Фронтенд (в новом терминале):**
```bash
# Из корневой папки проекта
npm run dev
```

Фронтенд будет доступен по адресу: http://localhost:8080

## 🔧 Проверка работоспособности

### Тестирование API

```bash
# Health check
curl http://localhost:3001/api/health

# Получение школ
curl http://localhost:3001/api/schools

# Получение услуг
curl http://localhost:3001/api/services
```

### Тестирование аутентификации

```bash
# Регистрация пользователя
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тест",
    "surname": "Пользователь",
    "role": "parent",
    "phone": "+79991234567",
    "password": "password123"
  }'

# Вход в систему
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "password": "password123",
    "role": "parent"
  }'
```

### Тестирование фронтенда

1. Откройте http://localhost:8080
2. Попробуйте зарегистрироваться
3. Войдите в систему
4. Проверьте работу админ-панели

## 📊 Тестовые данные

### Пользователи

**Администратор:**
- Username: `admin`
- Password: `admin123`

**Тестовые пользователи:**
- Родитель: `+79991234567` / `password123`
- Исполнитель: `+79991234569` / `password123`
- Дети: Алексей Сидоров (3А, смена 1), Анна Козлова (2Б, смена 2)

### Школы

- Гимназия № 8 (Хабаровск)
- Школа № 12 (Хабаровск)
- Лицей № 3 (Хабаровск)
- Детский сад № 15 (Хабаровск)
- Детский сад № 8 (Хабаровск)

### Услуги

- Изготовление восковых рук (1500₽)
- Изготовление восковых ног (1200₽)
- Комплект рука+нога (2500₽)
- Покраска слепков (500₽)
- Упаковка в коробку (300₽)

### Мастер-классы

- Мастер-класс по созданию восковых слепков (3000₽)
- Мастер-класс по покраске слепков (2000₽)
- Мастер-класс по упаковке (1500₽)

## 🛠️ Команды разработки

### Бэкенд

```bash
cd backend

# Разработка
npm run dev              # Запуск сервера разработки
npm run build            # Сборка для production
npm run start            # Запуск production сервера

# База данных
npm run db:migrate       # Создание таблиц
npm run db:seed          # Заполнение тестовыми данными
npm run db:migrate-data  # Миграция из localStorage

# Линтинг
npm run lint             # Проверка кода
npm run test             # Запуск тестов
```

### Фронтенд

```bash
# Из корневой папки проекта

# Разработка
npm run dev              # Запуск сервера разработки
npm run build            # Сборка для production
npm run preview          # Предварительный просмотр

# Линтинг
npm run lint             # Проверка кода
```

## 🔍 Отладка

### Проблемы с базой данных

```bash
# Проверка подключения
psql -U postgres -d waxhands -c "SELECT version();"

# Проверка таблиц
psql -U postgres -d waxhands -c "\dt"

# Проверка данных
psql -U postgres -d waxhands -c "SELECT * FROM users LIMIT 5;"
```

### Проблемы с бэкендом

```bash
# Проверка логов
cd backend
npm run dev

# Проверка переменных окружения
node -e "console.log(require('dotenv').config())"
```

### Проблемы с фронтендом

```bash
# Очистка кэша
npm run build -- --force

# Проверка переменных окружения
console.log(import.meta.env.VITE_API_URL)
```

## 🚀 Production деплой

### Подготовка

1. **Настройка production переменных**
   ```env
   NODE_ENV=production
   DB_HOST=your_production_db_host
   DB_PASSWORD=your_secure_password
   JWT_SECRET=your_very_secure_jwt_secret
   ```

2. **Сборка фронтенда**
   ```bash
   npm run build
   ```

3. **Сборка бэкенда**
   ```bash
   cd backend
   npm run build
   ```

### Docker (опционально)

```dockerfile
# Dockerfile для бэкенда
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 📞 Поддержка

### Полезные команды

```bash
# Проверка версий
node --version
npm --version
psql --version

# Проверка процессов
lsof -i :3001  # Проверка порта бэкенда
lsof -i :8084  # Проверка порта фронтенда

# Очистка
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Логи

- **Бэкенд**: Логи выводятся в консоль
- **Фронтенд**: Логи в браузере (F12 → Console)
- **База данных**: Логи PostgreSQL в системных логах

### Частые проблемы

1. **Ошибка подключения к БД**
   - Проверьте, что PostgreSQL запущен
   - Проверьте пароль в .env
   - Проверьте права доступа пользователя

2. **CORS ошибки**
   - Проверьте CORS_ORIGIN в .env бэкенда
   - Убедитесь, что фронтенд запущен на правильном порту

3. **JWT ошибки**
   - Проверьте JWT_SECRET в .env
   - Убедитесь, что токен передается в заголовке

4. **Ошибки сборки**
   - Очистите кэш: `npm cache clean --force`
   - Удалите node_modules и переустановите зависимости

## 🎯 Следующие шаги

1. **Интеграция API клиента**
   - Замените localStorage на API вызовы
   - Обновите AuthContext
   - Добавьте обработку ошибок

2. **Добавление функциональности**
   - Реализуйте заказы
   - Добавьте уведомления
   - Создайте аналитику

3. **Оптимизация**
   - Настройте кэширование
   - Оптимизируйте запросы к БД
   - Добавьте мониторинг

---

**Готово к использованию!** 🎉

Если возникли проблемы, проверьте логи и убедитесь, что все сервисы запущены корректно. 