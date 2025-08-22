# Wax Hands PWA - Production Build

## Структура проекта для сервера

```
production/
├── frontend/          # Frontend файлы (React + Vite build)
│   ├── index.html
│   ├── assets/
│   ├── sw.js
│   └── manifest.json
├── backend/           # Backend приложение (Express.js)
│   ├── index.js
│   ├── controllers/
│   ├── routes/
│   ├── database/
│   ├── middleware/
│   ├── types/
│   ├── scripts/
│   ├── websocket-server.js
│   ├── package.json
│   └── node_modules/
├── uploads/           # Загруженные файлы
│   ├── avatars/
│   ├── images/
│   └── videos/
├── .env               # Environment переменные
└── start.bat          # Скрипт запуска для Windows
```

## Инструкции по деплою

### 1. Копирование на сервер
Скопируйте папку `production/` на сервер timeweb.cloud

### 2. Настройка на сервере
```bash
# На сервере Linux
cd production/backend
npm install --only=production
```

### 3. Environment переменные
Отредактируйте `.env` файл:
- `DB_PASSWORD` - пароль от PostgreSQL
- `YUMONEY_SECRET_KEY` - секретный ключ ЮMoney
- `WEBHOOK_SECRET` - секрет для webhook'ов

### 4. Запуск backend
```bash
cd production/backend
NODE_ENV=production node index.js
```

### 5. Nginx конфигурация
- `frontend/` → `/var/www/waxhands.ru/` (статические файлы)
- `backend/` → `http://localhost:3001` (API прокси)
- `uploads/` → `/var/www/waxhands.ru/uploads/` (медиа файлы)

## Детальные инструкции
См. `DEPLOYMENT_TIMEWEB_CLOUD.md` в корне проекта
