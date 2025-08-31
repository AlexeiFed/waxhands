# Скрипт для обновления фронтенда с иконками
# Алексей - 2025-01-25

Write-Host "Обновление фронтенда с иконками..." -ForegroundColor Yellow

# 1. Очистка всех кэшей
Write-Host "Очистка кэшей..." -ForegroundColor Cyan
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
if (Test-Path "backend\*.tsbuildinfo") { Remove-Item -Force backend\*.tsbuildinfo }
if (Test-Path "*.tsbuildinfo") { Remove-Item -Force *.tsbuildinfo }

# 2. Пересборка проекта
Write-Host "Пересборка проекта..." -ForegroundColor Cyan
npm run build

# 3. Проверка новых файлов
Write-Host "Проверка новых файлов..." -ForegroundColor Cyan
$newJsFile = Get-ChildItem dist\assets\index-*.js | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Новый JS файл: $($newJsFile.Name)" -ForegroundColor Green

# 4. Проверка иконок
Write-Host "Проверка иконок..." -ForegroundColor Cyan
$iconFiles = @("icon-72x72.png", "icon-96x96.png", "icon-128x128.png", "icon-144x144.png", "icon-152x152.png", "icon-180x180.png", "icon-192x192.png", "icon-384x384.png", "icon-512x512.png", "icon-1024x1024.png", "favicon.ico")

foreach ($icon in $iconFiles) {
    if (Test-Path "public\$icon") {
        $size = (Get-Item "public\$icon").Length
        Write-Host "$icon - $([math]::Round($size/1KB, 2)) KB" -ForegroundColor Green
    }
    if (-not (Test-Path "public\$icon")) {
        Write-Host "$icon - НЕ НАЙДЕН" -ForegroundColor Red
    }
}

# 5. Создание архива с timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-update-with-icons-$timestamp.zip"
Write-Host "Создание архива: $archiveName" -ForegroundColor Cyan

# Копируем все файлы из dist и public в временную папку
$tempDir = "temp-frontend-update"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Name $tempDir | Out-Null

# Копируем файлы из dist
Copy-Item -Path "dist\*" -Destination $tempDir -Recurse -Force

# Копируем иконки и manifest
Copy-Item -Path "public\icon-*.png" -Destination $tempDir -Force
Copy-Item -Path "public\icon-*.svg" -Destination $tempDir -Force
Copy-Item -Path "public\favicon.ico" -Destination $tempDir -Force
Copy-Item -Path "public\manifest.json" -Destination $tempDir -Force
Copy-Item -Path "public\sw.js" -Destination $tempDir -Force
Copy-Item -Path "public\robots.txt" -Destination $tempDir -Force

# Копируем папки
Copy-Item -Path "public\icons" -Destination $tempDir -Recurse -Force
Copy-Item -Path "public\onboarding" -Destination $tempDir -Recurse -Force
Copy-Item -Path "public\uploads" -Destination $tempDir -Recurse -Force
Copy-Item -Path "public\lovable-uploads" -Destination $tempDir -Recurse -Force

# Создаем архив
Compress-Archive -Path "$tempDir\*" -DestinationPath $archiveName -Force

# Очищаем временную папку
Remove-Item -Recurse -Force $tempDir

Write-Host "Архив создан: $archiveName" -ForegroundColor Green

# 6. Инструкции по деплою
Write-Host ""
Write-Host "ИНСТРУКЦИИ ПО ДЕПЛОЮ:" -ForegroundColor Yellow
Write-Host "1. Загрузите архив на сервер: scp $archiveName root@147.45.161.83:/tmp/" -ForegroundColor White
Write-Host "2. На сервере выполните:" -ForegroundColor White
Write-Host "   ssh root@147.45.161.83" -ForegroundColor White
Write-Host "   cd /var/www/waxhands-app/frontend" -ForegroundColor White
Write-Host "   rm -rf *" -ForegroundColor White
Write-Host "   unzip /tmp/$archiveName -d ." -ForegroundColor White
Write-Host "   systemctl reload nginx" -ForegroundColor White
Write-Host ""
Write-Host "3. Проверьте обновление иконок в браузере" -ForegroundColor White
Write-Host "4. При необходимости очистите кэш браузера (Ctrl+Shift+Delete)" -ForegroundColor White

Write-Host ""
Write-Host "Готово! Теперь иконки должны обновляться корректно." -ForegroundColor Green

