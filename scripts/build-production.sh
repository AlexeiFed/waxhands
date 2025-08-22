#!/bin/bash

# Production Build Script for Wax Hands PWA
# Автор: Алексей
# Дата: 2024-12-19

echo "🚀 Начинаем production сборку Wax Hands PWA..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js 18+"
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js 18+. Текущая версия: $(node --version)"
    exit 1
fi

echo "✅ Node.js версия: $(node --version)"

# Очистка предыдущих сборок
echo "🧹 Очистка предыдущих сборок..."
rm -rf dist/
rm -rf backend/dist/

# Установка зависимостей frontend
echo "📦 Установка зависимостей frontend..."
npm ci --production=false

# Сборка frontend
echo "🔨 Сборка frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

echo "✅ Frontend собран успешно"

# Установка зависимостей backend
echo "📦 Установка зависимостей backend..."
cd backend
npm ci --production=false

# Сборка backend
echo "🔨 Сборка backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки backend"
    exit 1
fi

echo "✅ Backend собран успешно"

# Возвращаемся в корневую директорию
cd ..

# Создание production директории
echo "📁 Создание production директории..."
mkdir -p production
cp -r dist/* production/
cp -r backend/dist production/backend/
cp -r backend/uploads production/backend/ 2>/dev/null || mkdir -p production/backend/uploads
cp backend/.env.production production/backend/.env 2>/dev/null || echo "⚠️ .env.production не найден"
cp .env.production production/.env 2>/dev/null || echo "⚠️ .env.production не найден"

# Копирование конфигурационных файлов
cp backend/package.json production/backend/
cp package.json production/

# Создание production package.json (только production зависимости)
echo "📝 Создание production package.json..."
cd production
npm ci --only=production
cd backend
npm ci --only=production
cd ../..

# Создание скрипта запуска
echo "📝 Создание скрипта запуска..."
cat > production/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Запуск Wax Hands PWA в production режиме..."

# Запуск backend
cd backend
echo "🔧 Запуск backend..."
NODE_ENV=production node dist/index.js &
BACKEND_PID=$!

# Ожидание запуска backend
sleep 5

# Проверка статуса backend
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend запущен (PID: $BACKEND_PID)"
else
    echo "❌ Ошибка запуска backend"
    exit 1
fi

echo "🌐 Приложение доступно по адресу: http://localhost:3001"
echo "📱 Frontend файлы в директории: dist/"
echo "🔧 Backend API: http://localhost:3001/api"
echo "🔌 WebSocket: ws://localhost:3001/api/chat/ws"

# Ожидание сигнала завершения
trap 'echo "🛑 Получен сигнал завершения, останавливаем backend..."; kill $BACKEND_PID; exit 0' SIGINT SIGTERM

# Ожидание завершения backend
wait $BACKEND_PID
EOF

chmod +x production/start.sh

# Создание README для production
echo "📝 Создание README для production..."
cat > production/README.md << 'EOF'
# Wax Hands PWA - Production Build

## 🚀 Запуск

### Автоматический запуск
```bash
./start.sh
```

### Ручной запуск
```bash
# Backend
cd backend
NODE_ENV=production node dist/index.js

# Frontend (опционально, для preview)
npm run preview
```

## 📁 Структура
- `dist/` - Frontend файлы (статичные)
- `backend/` - Backend приложение
- `backend/dist/` - Скомпилированный backend
- `backend/uploads/` - Загруженные файлы
- `.env` - Переменные окружения

## ⚙️ Настройка
1. Скопируйте `.env.production` в `.env`
2. Замените `your-domain.com` на ваш домен
3. Настройте базу данных PostgreSQL
4. Установите SSL сертификат

## 🔧 Требования
- Node.js 18+
- PostgreSQL 12+
- Nginx (для production)
- SSL сертификат

## 📊 Мониторинг
- Backend логи: `backend/logs/`
- Системные логи: `journalctl -u waxhands-backend`

## 🆘 Поддержка
При проблемах проверьте:
1. Переменные окружения
2. Подключение к базе данных
3. Права доступа к файлам
4. Логи приложения
EOF

# Проверка размера production сборки
echo "📊 Размер production сборки:"
du -sh production/

echo ""
echo "🎉 Production сборка завершена успешно!"
echo "📁 Результат в директории: production/"
echo ""
echo "📋 Следующие шаги:"
echo "1. Скопируйте production/ на сервер"
echo "2. Настройте переменные окружения"
echo "3. Запустите backend: cd production/backend && NODE_ENV=production node dist/index.js"
echo "4. Настройте Nginx для раздачи статических файлов"
echo ""
echo "📚 Подробные инструкции: DEPLOYMENT_TIMEWEB_CLOUD.md"
