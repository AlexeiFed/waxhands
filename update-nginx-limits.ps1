# Скрипт для обновления Nginx лимитов загрузки файлов
Write-Host "🚀 Обновление Nginx лимитов для загрузки файлов..." -ForegroundColor Green

# Копируем обновленную конфигурацию на сервер
Write-Host "📤 Копирование Nginx конфигурации на сервер..." -ForegroundColor Yellow
scp nginx-config.txt root@147.45.161.83:/etc/nginx/sites-available/waxhands-app

# Подключаемся к серверу и применяем изменения
Write-Host "🔧 Применение изменений на сервере..." -ForegroundColor Yellow
ssh root@147.45.161.83 @"
cd /etc/nginx/sites-available
cp waxhands-app waxhands-app.backup
cp /tmp/nginx-config.txt waxhands-app

# Проверяем конфигурацию
nginx -t

if [ `$? -eq 0 ]; then
    echo "✅ Nginx конфигурация корректна"
    # Перезагружаем Nginx
    systemctl reload nginx
    echo "✅ Nginx перезагружен с новыми лимитами"
else
    echo "❌ Ошибка в Nginx конфигурации"
    exit 1
fi

# Проверяем статус
systemctl status nginx --no-pager -l
"@

Write-Host "✅ Обновление завершено!" -ForegroundColor Green
Write-Host "📋 Новые лимиты:" -ForegroundColor Cyan
Write-Host "   - Максимальный размер файла: 100MB" -ForegroundColor White
Write-Host "   - Таймаут загрузки: 300 секунд" -ForegroundColor White
Write-Host "   - Таймаут прокси: 300 секунд" -ForegroundColor White
