# Скрипт для деплоя фронтенда - загружает только последний архив
Write-Host "🚀 Деплой фронтенда Wax Hands PWA" -ForegroundColor Green

# 1. Сборка проекта
Write-Host "📦 Сборка проекта..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки!" -ForegroundColor Red
    exit 1
}

# 2. Создание архива с timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-update-$timestamp.zip"
Write-Host "📁 Создание архива: $archiveName" -ForegroundColor Yellow

Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force

# 3. Загрузка на сервер
Write-Host "⬆️ Загрузка на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки!" -ForegroundColor Red
    exit 1
}

# 4. Обновление на сервере
Write-Host "🔄 Обновление на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && rm -rf * && unzip /tmp/$archiveName -d . && mv dist/* . && rmdir dist && systemctl reload nginx"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка обновления на сервере!" -ForegroundColor Red
    exit 1
}

# 5. Проверка деплоя
Write-Host "✅ Проверка деплоя..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && ls -la assets/index-*.js"

# 6. Очистка локального архива
Write-Host "🧹 Очистка локального архива..." -ForegroundColor Yellow
Remove-Item $archiveName -Force

Write-Host "🎉 Деплой завершен успешно!" -ForegroundColor Green
Write-Host "🌐 Приложение доступно по адресу: https://waxhands.ru" -ForegroundColor Cyan
