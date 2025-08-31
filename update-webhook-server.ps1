# Скрипт для обновления backend с исправлением webhook endpoint
Write-Host "Обновление backend с исправлением webhook endpoint..." -ForegroundColor Yellow

# Проверяем что архив существует
$archivePath = "backend-update-webhook-fix-20250826-193745.zip"
if (-not (Test-Path $archivePath)) {
    Write-Host "Архив $archivePath не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "Архив найден: $archivePath" -ForegroundColor Green

# Загружаем архив на сервер
Write-Host "Загружаем архив на сервер..." -ForegroundColor Yellow
$scpResult = scp $archivePath root@147.45.161.83:/tmp/
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка загрузки архива на сервер!" -ForegroundColor Red
    exit 1
}

Write-Host "Архив загружен на сервер" -ForegroundColor Green

# Обновляем backend на сервере
Write-Host "Обновляем backend на сервере..." -ForegroundColor Yellow

$sshCommands = @"
cd /var/www/waxhands-app/backend
echo "Создаем резервную копию..."
cp -r dist dist.backup
echo "Удаляем старую версию..."
rm -rf dist
echo "Распаковываем новый архив..."
unzip /tmp/backend-update-webhook-fix-20250826-193745.zip -d .
echo "Перезапускаем backend..."
pm2 restart waxhands-backend
echo "Backend обновлен и перезапущен!"
"@

$sshResult = ssh root@147.45.161.83 $sshCommands
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка обновления backend на сервере!" -ForegroundColor Red
    Write-Host "Детали: $sshResult" -ForegroundColor Red
    exit 1
}

Write-Host "Backend успешно обновлен на сервере!" -ForegroundColor Green

# Проверяем статус
Write-Host "Проверяем статус backend..." -ForegroundColor Yellow
$statusResult = ssh root@147.45.161.83 "pm2 status waxhands-backend"
Write-Host "Статус backend:" -ForegroundColor Cyan
Write-Host $statusResult -ForegroundColor White

Write-Host "Обновление завершено успешно!" -ForegroundColor Green
Write-Host "Webhook endpoint /api/payment-webhook/yumoney теперь доступен" -ForegroundColor Green
