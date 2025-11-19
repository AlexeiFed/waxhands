# PowerShell скрипт для деплоя исправлений FreekassaProvider
# Версия: 1.0
# Дата: 2024-10-16

Write-Host "🚀 Деплой исправлений FreekassaProvider на production сервер" -ForegroundColor Green

# 1. Сборка backend
Write-Host "`n📦 Шаг 1: Сборка backend..." -ForegroundColor Cyan
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка сборки backend" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Создание архива
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "backend-freekassa-fixes-$timestamp.zip"

Write-Host "`n📦 Шаг 2: Создание архива $archiveName..." -ForegroundColor Cyan
Compress-Archive -Path "backend\dist\*" -DestinationPath $archiveName -Force
Write-Host "✅ Архив создан: $archiveName" -ForegroundColor Green

# 3. Загрузка на сервер
Write-Host "`n📤 Шаг 3: Загрузка на сервер..." -ForegroundColor Cyan
scp $archiveName root@147.45.161.83:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки на сервер" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Архив загружен на сервер" -ForegroundColor Green

# 4. Обновление на сервере
Write-Host "`n🔄 Шаг 4: Обновление на сервере..." -ForegroundColor Cyan

$commands = @"
cd /var/www/waxhands-app/backend
echo '📋 Создание резервной копии...'
cp -r dist dist.backup-$timestamp
echo '🗑️ Удаление старого dist...'
rm -rf dist
echo '📦 Распаковка нового архива...'
unzip -o /tmp/$archiveName -d dist
echo '♻️ Перезапуск PM2...'
pm2 restart waxhands-backend
echo '📊 Проверка статуса...'
pm2 status
echo '✅ Обновление завершено'
"@

ssh root@147.45.161.83 $commands

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка обновления на сервере" -ForegroundColor Red
    exit 1
}

# 5. Очистка временных файлов
Write-Host "`n🧹 Шаг 5: Очистка временных файлов..." -ForegroundColor Cyan
Remove-Item $archiveName -Force
Write-Host "✅ Временные файлы удалены" -ForegroundColor Green

# 6. Проверка логов
Write-Host "`n📋 Шаг 6: Проверка логов (последние 20 строк)..." -ForegroundColor Cyan
ssh root@147.45.161.83 "tail -n 20 /var/www/waxhands-app/backend/backend.log"

Write-Host "`n✅ Деплой завершен успешно!" -ForegroundColor Green
Write-Host "`n📝 Следующие шаги:" -ForegroundColor Yellow
Write-Host "1. Проверьте логи на наличие ошибок" -ForegroundColor White
Write-Host "2. Протестируйте создание платежа через FreeKassa" -ForegroundColor White
Write-Host "3. Проверьте обработку webhook уведомлений" -ForegroundColor White
Write-Host "4. Убедитесь, что подписи формируются корректно" -ForegroundColor White

Write-Host "`n🔍 Полезные команды для мониторинга:" -ForegroundColor Yellow
Write-Host "ssh root@147.45.161.83 'pm2 logs waxhands-backend --lines 100'" -ForegroundColor Gray
Write-Host "ssh root@147.45.161.83 'pm2 status'" -ForegroundColor Gray
Write-Host "ssh root@147.45.161.83 'tail -f /var/www/waxhands-app/backend/backend.log'" -ForegroundColor Gray


