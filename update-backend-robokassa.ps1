# Скрипт для обновления backend с исправлениями Robokassa
Write-Host "🚀 Обновление backend с исправлениями Robokassa..." -ForegroundColor Green

# Находим последний созданный архив
$latestArchive = Get-ChildItem -Path "." -Name "backend-robokassa-fix-*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $latestArchive) {
    Write-Host "❌ Архив backend не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Найден архив: $latestArchive" -ForegroundColor Yellow

# Загружаем на сервер
Write-Host "📤 Загружаем архив на сервер..." -ForegroundColor Cyan
scp $latestArchive root@147.45.161.83:/tmp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка загрузки архива!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Архив загружен на сервер" -ForegroundColor Green

# Обновляем на сервере
Write-Host "🔄 Обновляем backend на сервере..." -ForegroundColor Cyan
$commands = @(
    "cd /var/www/waxhands-app/backend",
    "cp -r dist dist.backup",
    "rm -rf dist",
    "unzip /tmp/$latestArchive -d .",
    "pm2 restart waxhands-backend"
)

$commandString = $commands -join " && "
ssh root@147.45.161.83 $commandString

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend успешно обновлен!" -ForegroundColor Green
    Write-Host "🎉 Исправления Robokassa применены!" -ForegroundColor Green
}
else {
    Write-Host "❌ Ошибка при обновлении backend!" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Проверяем статус..." -ForegroundColor Cyan
ssh root@147.45.161.83 "pm2 status"
ssh root@147.45.161.83 "ls -la /var/www/waxhands-app/backend/dist/"

Write-Host "✨ Обновление завершено!" -ForegroundColor Green
