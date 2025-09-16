# Скрипт для обновления системы оферт на сервере
# Создает таблицу offers и обновляет backend

Write-Host "🚀 Обновление системы оферт на сервере..." -ForegroundColor Green

# 1. Создание таблицы offers в базе данных
Write-Host "📊 Создание таблицы offers в базе данных..." -ForegroundColor Yellow
ssh root@147.45.161.83 "cd /var/www/waxhands-app/backend && psql -U waxhands_user -d waxhands -f src/database/create-offers-table.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Таблица offers успешно создана" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при создании таблицы offers" -ForegroundColor Red
    exit 1
}

# 2. Сборка backend
Write-Host "🔨 Сборка backend..." -ForegroundColor Yellow
cd backend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend успешно собран" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при сборке backend" -ForegroundColor Red
    exit 1
}

# 3. Создание архива backend
Write-Host "📦 Создание архива backend..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "backend-offers-update-$timestamp.zip"

# Копируем SQL файл в dist
Copy-Item "src/database/create-offers-table.sql" "dist/database/"

Compress-Archive -Path "dist/*" -DestinationPath $archiveName -Force

if (Test-Path $archiveName) {
    Write-Host "✅ Архив $archiveName создан" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при создании архива" -ForegroundColor Red
    exit 1
}

# 4. Загрузка на сервер
Write-Host "📤 Загрузка на сервер..." -ForegroundColor Yellow
scp $archiveName root@147.45.161.83:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Архив загружен на сервер" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при загрузке архива" -ForegroundColor Red
    exit 1
}

# 5. Обновление на сервере
Write-Host "🔄 Обновление на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 @"
cd /var/www/waxhands-app/backend
cp -r dist dist.backup
rm -rf dist
unzip /tmp/$archiveName -d .
pm2 restart waxhands-backend
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend успешно обновлен на сервере" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при обновлении backend" -ForegroundColor Red
    exit 1
}

# 6. Сборка frontend
Write-Host "🎨 Сборка frontend..." -ForegroundColor Yellow
cd ..
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend успешно собран" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при сборке frontend" -ForegroundColor Red
    exit 1
}

# 7. Создание архива frontend
Write-Host "📦 Создание архива frontend..." -ForegroundColor Yellow
$frontendArchiveName = "frontend-offers-update-$timestamp.zip"
Compress-Archive -Path "dist/*" -DestinationPath $frontendArchiveName -Force

if (Test-Path $frontendArchiveName) {
    Write-Host "✅ Архив $frontendArchiveName создан" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при создании архива frontend" -ForegroundColor Red
    exit 1
}

# 8. Загрузка frontend на сервер
Write-Host "📤 Загрузка frontend на сервер..." -ForegroundColor Yellow
scp $frontendArchiveName root@147.45.161.83:/tmp/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend архив загружен на сервер" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при загрузке frontend архива" -ForegroundColor Red
    exit 1
}

# 9. Обновление frontend на сервере
Write-Host "🔄 Обновление frontend на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 @"
cd /var/www/waxhands-app/frontend
rm -rf *
unzip /tmp/$frontendArchiveName -d .
mv dist/* .
rmdir dist
systemctl reload nginx
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend успешно обновлен на сервере" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при обновлении frontend" -ForegroundColor Red
    exit 1
}

# 10. Очистка временных файлов
Write-Host "🧹 Очистка временных файлов..." -ForegroundColor Yellow
Remove-Item $archiveName -Force
Remove-Item $frontendArchiveName -Force

Write-Host "🎉 Система оферт успешно обновлена!" -ForegroundColor Green
Write-Host "📋 Что было сделано:" -ForegroundColor Cyan
Write-Host "  ✅ Создана таблица offers в базе данных" -ForegroundColor White
Write-Host "  ✅ Добавлены API эндпоинты для управления офертами" -ForegroundColor White
Write-Host "  ✅ Создана страница оферты для родителя" -ForegroundColor White
Write-Host "  ✅ Создана админ-панель для управления офертами" -ForegroundColor White
Write-Host "  ✅ Добавлен пункт 'Оферта' в навигацию родителя" -ForegroundColor White
Write-Host "  ✅ Обновлен backend и frontend на сервере" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Доступные URL:" -ForegroundColor Cyan
Write-Host "  👤 Родитель: https://waxhands.ru/parent/offer" -ForegroundColor White
Write-Host "  Админ: https://waxhands.ru/admin (вкладка Оферты)" -ForegroundColor White
