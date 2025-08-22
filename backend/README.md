# Wax Hands Backend API

Backend API для PWA приложения Wax Hands, построенный на Node.js, Express и PostgreSQL.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL 12+
- npm или yarn

### Установка

1. **Клонируйте репозиторий и перейдите в папку backend:**
```bash
cd backend
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Создайте файл .env на основе .env.example:**
```bash
cp .env.example .env
```

4. **Настройте переменные окружения в .env:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=waxhands
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
```

5. **Создайте базу данных PostgreSQL:**
```sql
CREATE DATABASE waxhands;
```

6. **Запустите миграции:**
```bash
npm run db:migrate
```

7. **Заполните базу тестовыми данными:**
```bash
npm run db:seed
```

8. **Запустите сервер разработки:**
```bash
npm run dev
```

Сервер будет доступен по адресу: http://localhost:3001

## 📋 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `GET /api/auth/profile` - Получить профиль (требует токен)
- `PUT /api/auth/profile` - Обновить профиль (требует токен)

### Школы
- `GET /api/schools` - Получить все школы
- `GET /api/schools/:id` - Получить школу по ID
- `GET /api/schools/:id/classes` - Получить классы школы
- `GET /api/schools/search?q=query` - Поиск школ
- `POST /api/schools` - Создать школу (только админ)
- `PUT /api/schools/:id` - Обновить школу (только админ)
- `DELETE /api/schools/:id` - Удалить школу (только админ)

### Пользователи
- `GET /api/users` - Получить всех пользователей (только админ)
- `GET /api/users/:id` - Получить пользователя по ID
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя (только админ)

### Услуги
- `GET /api/services` - Получить все услуги
- `GET /api/services/:id` - Получить услугу по ID
- `POST /api/services` - Создать услугу (только админ)
- `PUT /api/services/:id` - Обновить услугу (только админ)
- `DELETE /api/services/:id` - Удалить услугу (только админ)

### Мастер-классы
- `GET /api/master-classes` - Получить все мастер-классы
- `GET /api/master-classes/:id` - Получить мастер-класс по ID
- `POST /api/master-classes` - Создать мастер-класс (только админ)
- `PUT /api/master-classes/:id` - Обновить мастер-класс (только админ)
- `DELETE /api/master-classes/:id` - Удалить мастер-класс (только админ)

### Заказы
- `GET /api/orders` - Получить заказы пользователя
- `GET /api/orders/:id` - Получить заказ по ID
- `POST /api/orders` - Создать заказ
- `PUT /api/orders/:id` - Обновить заказ
- `DELETE /api/orders/:id` - Удалить заказ

## 🔐 Аутентификация

API использует JWT токены для аутентификации. Для защищенных эндпоинтов необходимо передавать токен в заголовке:

```
Authorization: Bearer <your_jwt_token>
```

### Роли пользователей

- **admin** - Полный доступ ко всем функциям
- **parent** - Доступ к управлению профилями детей и заказам
- **child** - Ограниченный доступ к своему профилю
- **executor** - Доступ к выполнению заказов

## 🗄️ Структура базы данных

### Таблицы

- **users** - Пользователи системы
- **schools** - Школы и детские сады
- **services** - Услуги
- **master_classes** - Мастер-классы
- **orders** - Заказы

### Связи

- Пользователи связаны со школами через `school_id`
- Заказы связаны с пользователями через `user_id`
- Заказы могут ссылаться на услуги или мастер-классы

## 🛠️ Команды

```bash
# Разработка
npm run dev          # Запуск сервера разработки
npm run build        # Сборка для production
npm run start        # Запуск production сервера

# База данных
npm run db:migrate   # Создание таблиц
npm run db:seed      # Заполнение тестовыми данными

# Линтинг
npm run lint         # Проверка кода
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | 3001 |
| `NODE_ENV` | Окружение | development |
| `DB_HOST` | Хост базы данных | localhost |
| `DB_PORT` | Порт базы данных | 5432 |
| `DB_NAME` | Имя базы данных | waxhands |
| `DB_USER` | Пользователь БД | postgres |
| `DB_PASSWORD` | Пароль БД | - |
| `JWT_SECRET` | Секрет для JWT | - |
| `JWT_EXPIRES_IN` | Время жизни токена | 7d |
| `CORS_ORIGIN` | Разрешенный origin | http://localhost:8084 |

## 📊 Мониторинг

### Health Check
```
GET /api/health
```

### Логирование
- Все запросы логируются с помощью Morgan
- Ошибки логируются в консоль
- Время выполнения запросов отслеживается

## 🔒 Безопасность

- **Helmet** - Заголовки безопасности
- **CORS** - Настройки CORS
- **Rate Limiting** - Ограничение запросов
- **JWT** - Аутентификация
- **bcrypt** - Хеширование паролей
- **Валидация** - Проверка входных данных

## 🚀 Деплой

### Production

1. **Соберите проект:**
```bash
npm run build
```

2. **Настройте переменные окружения для production**

3. **Запустите сервер:**
```bash
npm start
```

### Docker (опционально)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 Документация API

Полная документация API доступна по адресу: http://localhost:3001/api

## 🤝 Разработка

### Структура проекта

```
backend/
├── src/
│   ├── controllers/     # Контроллеры
│   ├── database/        # Подключение к БД
│   ├── middleware/      # Middleware
│   ├── routes/          # Маршруты
│   ├── scripts/         # Скрипты
│   ├── types/           # TypeScript типы
│   └── index.ts         # Точка входа
├── .env.example         # Пример переменных окружения
├── package.json         # Зависимости
└── README.md           # Документация
```

### Добавление новых эндпоинтов

1. Создайте контроллер в `src/controllers/`
2. Создайте маршруты в `src/routes/`
3. Добавьте маршруты в `src/routes/index.ts`
4. Добавьте типы в `src/types/index.ts`

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервера
2. Убедитесь, что база данных доступна
3. Проверьте переменные окружения
4. Обратитесь к документации API

---

**Версия:** 1.0.0  
**Автор:** Алексей  
**Дата:** 2024-12-19 