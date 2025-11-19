# Скрипт для обновления сервера с исправлением Robokassa
# Дата: 2025-01-26

Write-Host "🚀 Обновление сервера с исправлением Robokassa..." -ForegroundColor Green

# 1. Создание бэкапа на сервере
Write-Host "📦 Создание бэкапа на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend; cp -r dist dist.backup-`$(date +%Y%m%d-%H%M%S)"

# 2. Очистка старых файлов
Write-Host "🗑️ Очистка старых файлов..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend; rm -rf dist"

# 3. Распаковка нового архива
Write-Host "📂 Распаковка нового архива..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend; unzip /tmp/backend-update-20250126-154500.zip -d ."

# 4. Перезапуск backend
Write-Host "🔄 Перезапуск backend..." -ForegroundColor Yellow
ssh root@147.45.161.83 "pm2 restart waxhands-backend"

# 5. Проверка статуса
Write-Host "✅ Проверка статуса..." -ForegroundColor Yellow
ssh root@147.45.161.83 "pm2 status waxhands-backend"

Write-Host "🎉 Обновление завершено!" -ForegroundColor Green
Write-Host "🔧 Исправления:" -ForegroundColor Cyan
Write-Host "   - Добавлен Receipt в подпись Robokassa согласно документации" -ForegroundColor White
Write-Host "   - Исправлено URL-кодирование Receipt" -ForegroundColor White
Write-Host "   - Исправлена ошибка 29 'Неверный параметр SignatureValue'" -ForegroundColor White
