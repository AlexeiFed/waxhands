# Скрипт для полного обновления frontend на сервере
Write-Host "🔧 Начинаем обновление frontend..." -ForegroundColor Yellow

# 1. Полная очистка кэшей
Write-Host "🧹 Очищаем кэши..." -ForegroundColor Cyan
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force backend\*.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# 2. Пересборка проекта
Write-Host "🔨 Пересобираем проект..." -ForegroundColor Cyan
npm run build

# 3. Проверяем что создался новый JS файл
Write-Host "✅ Проверяем новые файлы..." -ForegroundColor Green
$jsFiles = Get-ChildItem dist\assets\index-*.js
$cssFiles = Get-ChildItem dist\assets\index-*.css
Write-Host "   JS файлы: $($jsFiles.Name)" -ForegroundColor White
Write-Host "   CSS файлы: $($cssFiles.Name)" -ForegroundColor White

# 4. Создаем архив с timestamp
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$archiveName = "frontend-update-fix-$timestamp.zip"
Write-Host "📦 Создаем архив: $archiveName" -ForegroundColor Cyan
Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force

# 5. Загружаем на сервер
Write-Host "🚀 Загружаем на сервер..." -ForegroundColor Cyan
scp $archiveName root@147.45.161.83:/tmp/

# 6. Обновляем на сервере
Write-Host "⚙️ Обновляем на сервере..." -ForegroundColor Cyan
$sshCommand = @"
cd /var/www/waxhands-app/frontend
echo '🧹 Полная очистка frontend...'
rm -rf *

echo '📦 Распаковываем новый архив...'
unzip -o /tmp/$archiveName

echo '📁 Перемещаем файлы из dist...'
mv dist/* .
rmdir dist

echo '🔄 Перезагружаем Nginx...'
systemctl reload nginx

echo '✅ Frontend обновлен!'
ls -la assets/
"@

ssh root@147.45.161.83 $sshCommand

Write-Host "Frontend update completed!" -ForegroundColor Green
Write-Host "Check mobile device access" -ForegroundColor Yellow
