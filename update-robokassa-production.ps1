# Скрипт для обновления продакшн сервера с изменениями Robokassa
# PowerShell скрипт для Windows

Write-Host "🚀 Начинаем обновление сервера с настройками реального магазина Robokassa..." -ForegroundColor Green

# Проверяем, что мы в корневой папке проекта
if (!(Test-Path "backend/src") -or !(Test-Path "package.json")) {
    Write-Host "❌ Ошибка: Запустите скрипт из корневой папки проекта" -ForegroundColor Red
    exit 1
}

# 1. Применяем SQL миграцию на сервере
Write-Host "📊 Применяем миграцию для добавления поля balance..." -ForegroundColor Yellow
ssh root@147.45.161.83 'cd /var/www/waxhands-app; sudo -u postgres psql -d waxhands -f backend/sql/add-user-balance.sql'

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при применении миграции" -ForegroundColor Red
    exit 1
}

# 2. Очищаем локальные кэши
Write-Host "🧹 Очищаем кэши..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
if (Test-Path "backend/*.tsbuildinfo") { Remove-Item -Force backend/*.tsbuildinfo }
if (Test-Path "*.tsbuildinfo") { Remove-Item -Force *.tsbuildinfo }

# 3. Собираем backend
Write-Host "🔨 Собираем backend..." -ForegroundColor Yellow
Set-Location backend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке backend" -ForegroundColor Red
    exit 1
}

# 4. Создаем архив с обновлениями backend
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backendArchive = "backend-robokassa-update-$timestamp.zip"

Write-Host "📦 Создаем архив backend: $backendArchive..." -ForegroundColor Yellow
Compress-Archive -Path "dist\*" -DestinationPath "..\$backendArchive" -Force
Set-Location ..

# 5. Загружаем архив на сервер
Write-Host "📤 Загружаем backend на сервер..." -ForegroundColor Yellow
scp $backendArchive root@147.45.161.83:/tmp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при загрузке архива на сервер" -ForegroundColor Red
    exit 1
}

# 6. Обновляем backend на сервере
Write-Host "🔄 Обновляем backend на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend; cp -r dist dist.backup-$timestamp; rm -rf dist; unzip /tmp/$backendArchive -d .; pm2 restart waxhands-backend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при обновлении backend на сервере" -ForegroundColor Red
    exit 1
}

# 7. Проверяем статус
Write-Host "🔍 Проверяем статус сервера..." -ForegroundColor Yellow
ssh root@147.45.161.83 'pm2 status; tail -20 /var/www/waxhands-app/backend/backend.log'

# 8. Удаляем временные файлы
Write-Host "🧹 Удаляем временные файлы..." -ForegroundColor Yellow
Remove-Item $backendArchive -Force

Write-Host "✅ Обновление завершено!" -ForegroundColor Green
Write-Host "📋 Что было обновлено:" -ForegroundColor Cyan
Write-Host "   • Настроена интеграция с реальным магазином Robokassa" -ForegroundColor White
Write-Host "   • Добавлено поле баланса в таблицу пользователей" -ForegroundColor White
Write-Host "   • Настроено начисление 10% бонуса при успешной оплате" -ForegroundColor White
Write-Host "   • Обновлены URL-адреса для продакшн среды" -ForegroundColor White
Write-Host "   • Переключен режим с тестового на продакшн" -ForegroundColor White

Write-Host "🎯 Следующие шаги:" -ForegroundColor Cyan
Write-Host "   1. Протестируйте создание счета и оплату" -ForegroundColor White
Write-Host "   2. Проверьте начисление баланса после оплаты" -ForegroundColor White
Write-Host "   3. Убедитесь что уведомления приходят корректно" -ForegroundColor White
