# Быстрое исправление мобильной проблемы с API
# Алексей - 2025-01-27

Write-Host "🚀 Быстрое исправление мобильной проблемы с API" -ForegroundColor Green

# 1. Сборка фронтенда
Write-Host "📦 Сборка фронтенда..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm run build

# 2. Создание архива
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-mobile-fix-$timestamp.zip"
Write-Host "📁 Создание архива: $archiveName" -ForegroundColor Yellow

Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force

# 3. Загрузка на сервер
Write-Host "📤 Загрузка на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/

Write-Host "`n🔧 Команды для выполнения на сервере:" -ForegroundColor Cyan
Write-Host "ssh root@147.45.161.83" -ForegroundColor White
Write-Host "cd /var/www/waxhands-app/frontend" -ForegroundColor White
Write-Host "rm -rf *" -ForegroundColor White
Write-Host "unzip /tmp/$archiveName -d ." -ForegroundColor White
Write-Host "systemctl reload nginx" -ForegroundColor White

Write-Host "`n✅ Готово! Архив создан: $archiveName" -ForegroundColor Green
