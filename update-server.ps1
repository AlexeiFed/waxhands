# Скрипт обновления сервера с исправлениями Робокассы
Write-Host "🚀 Обновление сервера с исправлениями Робокассы..." -ForegroundColor Green

# 1. Очистка кэшей перед сборкой
Write-Host "🧹 Очистка кэшей..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force backend\*.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# 2. Сборка проекта
Write-Host "📦 Сборка проекта..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

# 3. Проверка новых файлов
Write-Host "🔍 Проверка новых файлов..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem -Path "backend/dist/assets" -Name "*index*.js" -ErrorAction SilentlyContinue
if ($jsFiles.Count -eq 0) {
    Write-Host "❌ Ошибка: JS файлы не найдены после сборки" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Найдены JS файлы:" $jsFiles -ForegroundColor Green

# 4. Создание архива с timestamp
Write-Host "📁 Создание архива с timestamp..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "backend-robokassa-fix-$timestamp.zip"
if (Test-Path $archiveName) {
    Remove-Item $archiveName -Force
}
Compress-Archive -Path "backend/dist/*" -DestinationPath $archiveName -Force

# 5. Загрузка на сервер
Write-Host "📤 Загрузка на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/

# 6. Команды для выполнения на сервере
Write-Host "`n📋 Выполните на сервере:" -ForegroundColor Cyan
Write-Host "ssh root@147.45.161.83" -ForegroundColor White
Write-Host "cd /var/www/waxhands-app/backend" -ForegroundColor White
Write-Host "cp -r dist dist.backup" -ForegroundColor White
Write-Host "rm -rf dist" -ForegroundColor White
Write-Host "unzip /tmp/$archiveName -d ." -ForegroundColor White
Write-Host "pm2 restart waxhands-backend" -ForegroundColor White
Write-Host "pm2 logs waxhands-backend --lines 50" -ForegroundColor White
Write-Host "# Проверьте, что нет ошибок с Робокассой" -ForegroundColor White

Write-Host "`n✅ Архив загружен в /tmp/$archiveName на сервере" -ForegroundColor Green
Write-Host "📝 Исправления Робокассы включены:" -ForegroundColor Cyan
Write-Host "  - Включена фискализация" -ForegroundColor White
Write-Host "  - Исправлены типы налогов (service, none)" -ForegroundColor White
Write-Host "  - Исправлена проверка подписи уведомлений" -ForegroundColor White
Write-Host "  - Убрано ограничение только для Сафонова" -ForegroundColor White
Write-Host "  - Исправлены URL для возвратов" -ForegroundColor White



