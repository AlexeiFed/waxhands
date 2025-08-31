# Скрипт обновления сервера
Write-Host "🚀 Обновление сервера..." -ForegroundColor Green

# 1. Сборка проекта
Write-Host "📦 Сборка проекта..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

# 2. Создание архива
Write-Host "📁 Создание архива..." -ForegroundColor Yellow
if (Test-Path "backend-update.zip") {
    Remove-Item "backend-update.zip" -Force
}
Compress-Archive -Path "backend/dist/*" -DestinationPath "backend-update.zip" -Force

# 3. Загрузка на сервер
Write-Host "📤 Загрузка на сервер..." -ForegroundColor Yellow
scp backend-update.zip root@147.45.161.83:/tmp/

# 4. Команды для выполнения на сервере
Write-Host "`n📋 Выполните на сервере:" -ForegroundColor Cyan
Write-Host "ssh root@147.45.161.83" -ForegroundColor White
Write-Host "cd /var/www/waxhands-app/backend" -ForegroundColor White
Write-Host "cp -r dist dist.backup" -ForegroundColor White
Write-Host "rm -rf dist" -ForegroundColor White
Write-Host "unzip /tmp/backend-update.zip -d ." -ForegroundColor White
Write-Host "pm2 restart waxhands-backend" -ForegroundColor White
Write-Host "pm2 logs waxhands-backend" -ForegroundColor White

Write-Host "`n✅ Архив загружен в /tmp/backend-update.zip на сервере" -ForegroundColor Green



