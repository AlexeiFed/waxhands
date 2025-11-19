# Скрипт для обновления backend на сервере
# Распаковывает файлы в корень папки backend, а не в dist/

Write-Host "🔧 Собираем backend..." -ForegroundColor Yellow
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки backend" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Создаем архив..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "backend-update-$timestamp.zip"
Compress-Archive -Path "dist\*" -DestinationPath "..\$archiveName" -Force

Write-Host "📤 Загружаем на сервер..." -ForegroundColor Yellow
scp "..\$archiveName" root@147.45.161.83:/tmp/

Write-Host "🚀 Обновляем на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && cp -r dist dist.backup-$timestamp && rm -rf dist && unzip /tmp/$archiveName -d . && pm2 restart waxhands-backend"

Write-Host "✅ Обновление завершено!" -ForegroundColor Green
Write-Host "📁 Архив: $archiveName" -ForegroundColor Cyan








