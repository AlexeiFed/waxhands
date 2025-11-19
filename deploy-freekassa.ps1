# Скрипт для развертывания FreeKassa на production сервер
# Автор: AI Assistant
# Дата: 2025-10-16

Write-Host "🚀 Развертывание FreeKassa на production сервер..." -ForegroundColor Green

# 1. Сборка backend
Write-Host "📦 Сборка backend..." -ForegroundColor Yellow
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки backend!" -ForegroundColor Red
    exit 1
}

# 2. Создание архива
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "backend-freekassa-$timestamp.zip"
Write-Host "📁 Создание архива: $archiveName" -ForegroundColor Yellow

Compress-Archive -Path "dist\*" -DestinationPath "..\$archiveName" -Force
cd ..

# 3. Загрузка на сервер
Write-Host "⬆️ Загрузка архива на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки на сервер!" -ForegroundColor Red
    exit 1
}

# 4. Развертывание на сервере
Write-Host "🔧 Развертывание на сервере..." -ForegroundColor Yellow
$deployScript = @"
cd /var/www/waxhands-app/backend
cp -r dist dist.backup
rm -rf dist
unzip /tmp/$archiveName -d dist
pm2 restart waxhands-backend
echo "✅ Backend обновлен и перезапущен"
"@

ssh root@147.45.161.83 $deployScript

# 5. Применение миграции БД
Write-Host "🗄️ Применение миграции БД..." -ForegroundColor Yellow
$migrationScript = @"
cd /var/www/waxhands-app/backend/migrations
sudo -u postgres psql -d waxhands -f add_payment_provider_support.sql
echo "✅ Миграция БД применена"
"@

ssh root@147.45.161.83 $migrationScript

# 6. Обновление .env на сервере
Write-Host "⚙️ Обновление переменных окружения..." -ForegroundColor Yellow
$envUpdateScript = @"
cd /var/www/waxhands-app/backend
echo 'PAYMENT_PROVIDER=freekassa' >> .env
echo 'FREEKASSA_MERCHANT_ID=66509' >> .env
echo 'FREEKASSA_API_KEY=1230abcf58504306a0cd61a2ff8a9fc1' >> .env
echo 'FREEKASSA_SECRET_WORD_1=uqlTWAXu^hgw{Nq' >> .env
echo 'FREEKASSA_SECRET_WORD_2=s--vO&HvNfKxsyO' >> .env
echo 'FREEKASSA_SUCCESS_URL=https://waxhands.ru/payment/success' >> .env
echo 'FREEKASSA_FAIL_URL=https://waxhands.ru/payment/fail' >> .env
echo 'FREEKASSA_WEBHOOK_URL=https://waxhands.ru/api/payment/webhook' >> .env
pm2 restart waxhands-backend
echo "✅ Переменные окружения обновлены"
"@

ssh root@147.45.161.83 $envUpdateScript

# 7. Проверка статуса
Write-Host "🔍 Проверка статуса..." -ForegroundColor Yellow
$statusScript = @"
pm2 status waxhands-backend
curl -s https://waxhands.ru/api/payment/provider/info | jq .
"@

ssh root@147.45.161.83 $statusScript

Write-Host "✅ Развертывание FreeKassa завершено!" -ForegroundColor Green
Write-Host "🌐 Проверьте статус: https://waxhands.ru/api/payment/provider/info" -ForegroundColor Cyan
Write-Host "📋 Теперь можете проверить статус в личном кабинете FreeKassa" -ForegroundColor Cyan

# Очистка локального архива
Remove-Item $archiveName -Force
Write-Host "🧹 Локальный архив удален" -ForegroundColor Gray

