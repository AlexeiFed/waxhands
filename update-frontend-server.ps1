# Скрипт обновления фронтенда на production сервере
# Правильный путь: /var/www/waxhands-app/frontend/

Write-Host "=== Обновление фронтенда на production сервере ===" -ForegroundColor Green

# Шаг 1: Очистка кэшей
Write-Host "`n1. Очистка кэшей..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force backend\*.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# Шаг 2: Сборка фронтенда
Write-Host "`n2. Сборка фронтенда..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при сборке фронтенда!" -ForegroundColor Red
    exit 1
}

# Шаг 3: Проверка нового JS файла
Write-Host "`n3. Проверка нового JS файла..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem dist\assets\index-*.js | Sort-Object LastWriteTime -Descending
if ($jsFiles.Count -eq 0) {
    Write-Host "Ошибка: JS файл не найден!" -ForegroundColor Red
    exit 1
}
$newJsFile = $jsFiles[0]
Write-Host "Новый JS файл: $($newJsFile.Name)" -ForegroundColor Green

# Шаг 4: Создание архива
Write-Host "`n4. Создание архива..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-update-$timestamp.zip"
Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force
Write-Host "Архив создан: $archiveName" -ForegroundColor Green

# Шаг 5: Загрузка на сервер
Write-Host "`n5. Загрузка на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/frontend-update.zip

if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при загрузке на сервер!" -ForegroundColor Red
    exit 1
}

# Шаг 6: Обновление на сервере
Write-Host "`n6. Обновление файлов на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/frontend && rm -rf assets index.html && unzip -o /tmp/frontend-update.zip -d . && systemctl reload nginx"

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "Файлы обновлены!" -ForegroundColor Green
}
else {
    Write-Host "Ошибка при обновлении файлов!" -ForegroundColor Red
    exit 1
}

# Шаг 7: Проверка
Write-Host "`n7. Проверка обновления..." -ForegroundColor Yellow
$checkResult = ssh root@147.45.161.83 "cat /var/www/waxhands-app/frontend/index.html | grep -E 'index-.*\.js'"
Write-Host "JS файл на сервере: $checkResult" -ForegroundColor Green

# Шаг 8: Очистка
Write-Host "`n8. Очистка временных файлов..." -ForegroundColor Yellow
Remove-Item $archiveName -ErrorAction SilentlyContinue

Write-Host "`n=== Обновление завершено! ===" -ForegroundColor Green
Write-Host "Не забудьте выполнить жесткое обновление (Ctrl+Shift+R) в браузере!" -ForegroundColor Yellow







