# Скрипт обновления бэкенда на сервере
Write-Host "🔄 Обновление бэкенда на сервере..." -ForegroundColor Yellow

# Команды для выполнения на сервере
$commands = @"
cd /var/www/waxhands-app/backend
git pull origin main
npm run build
pm2 restart waxhands-backend
echo "✅ Бэкенд обновлен и перезапущен"
"@

Write-Host "📋 Выполните следующие команды на сервере:" -ForegroundColor Cyan
Write-Host $commands -ForegroundColor White

Write-Host "`n🚀 Или выполните автоматически:" -ForegroundColor Green
Write-Host "ssh root@147.45.161.83 '$commands'" -ForegroundColor Yellow



