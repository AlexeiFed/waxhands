#!/bin/bash

cd /var/www/waxhands-app/frontend

echo '📋 Создание резервной копии...'
mkdir -p backups
tar -czf backups/frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=backups .

echo '🗑️ ПОЛНАЯ очистка frontend папки...'
rm -rf *

echo '📦 Распаковка нового архива...'
unzip /tmp/frontend-update-20251017-003755.zip -d .

echo '📁 Перемещение файлов из dist в корень...'
if [ -d "dist" ]; then
    mv dist/* .
    rmdir dist
    echo '✅ Файлы перемещены из dist в корень'
else
    echo '✅ Файлы уже в корне'
fi

echo '♻️ Перезагрузка Nginx...'
systemctl reload nginx

echo '📋 Структура frontend:'
ls -la | head -20

echo '✅ Frontend обновлен!'


