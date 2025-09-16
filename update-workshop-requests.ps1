# Скрипт для обновления системы заявок на проведение мастер-классов
# Дата: 2025-01-09
# Описание: Обновляет frontend и backend с новыми полями для заявок

Write-Host "🚀 Начинаем обновление системы заявок на проведение мастер-классов..." -ForegroundColor Green

# 1. Сборка backend
Write-Host "📦 Собираем backend..." -ForegroundColor Yellow
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке backend" -ForegroundColor Red
    exit 1
}

# 2. Создание архива backend
Write-Host "📦 Создаем архив backend..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backendArchive = "backend-workshop-requests-update-$timestamp.zip"
Compress-Archive -Path "dist\*" -DestinationPath "..\$backendArchive" -Force
Write-Host "✅ Архив backend создан: $backendArchive" -ForegroundColor Green

# 3. Сборка frontend
Write-Host "📦 Собираем frontend..." -ForegroundColor Yellow
cd ..
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке frontend" -ForegroundColor Red
    exit 1
}

# 4. Создание архива frontend
Write-Host "📦 Создаем архив frontend..." -ForegroundColor Yellow
$frontendArchive = "frontend-workshop-requests-update-$timestamp.zip"
Compress-Archive -Path "dist\*" -DestinationPath $frontendArchive -Force
Write-Host "✅ Архив frontend создан: $frontendArchive" -ForegroundColor Green

# 5. Загрузка на сервер
Write-Host "📤 Загружаем файлы на сервер..." -ForegroundColor Yellow
scp $backendArchive root@147.45.161.83:/tmp/
scp $frontendArchive root@147.45.161.83:/tmp/
scp backend/add-workshop-request-fields.sql root@147.45.161.83:/tmp/

Write-Host "✅ Файлы загружены на сервер" -ForegroundColor Green

# 6. Инструкции для выполнения на сервере
Write-Host "📋 Выполните следующие команды на сервере:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Обновление базы данных:" -ForegroundColor White
Write-Host "   sudo -u postgres psql -d waxhands -f /tmp/add-workshop-request-fields.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Обновление backend:" -ForegroundColor White
Write-Host "   cd /var/www/waxhands-app/backend" -ForegroundColor Gray
Write-Host "   cp -r dist dist.backup" -ForegroundColor Gray
Write-Host "   rm -rf dist" -ForegroundColor Gray
Write-Host "   unzip /tmp/$backendArchive -d ." -ForegroundColor Gray
Write-Host "   pm2 restart waxhands-backend" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Обновление frontend:" -ForegroundColor White
Write-Host "   cd /var/www/waxhands-app/frontend" -ForegroundColor Gray
Write-Host "   rm -rf *" -ForegroundColor Gray
Write-Host "   unzip /tmp/$frontendArchive -d ." -ForegroundColor Gray
Write-Host "   mv dist/* ." -ForegroundColor Gray
Write-Host "   rmdir dist" -ForegroundColor Gray
Write-Host "   systemctl reload nginx" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Очистка временных файлов:" -ForegroundColor White
Write-Host "   rm /tmp/$backendArchive /tmp/$frontendArchive /tmp/add-workshop-request-fields.sql" -ForegroundColor Gray
Write-Host ""

Write-Host "Обновление завершено! Проверьте работу системы заявок." -ForegroundColor Green
