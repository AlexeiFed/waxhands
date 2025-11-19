#!/bin/bash

cd /var/www/waxhands-app/frontend

echo '📋 Создание резервной копии...'
mkdir -p backups
tar -czf backups/frontend-backup-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=backups .

echo '🗑️ ПОЛНАЯ очистка frontend папки (кроме backups)...'
find . -maxdepth 1 ! -name 'backups' ! -name '.' -exec rm -rf {} +

echo '📦 Распаковка нового архива...'
unzip /tmp/frontend-final-20251017-005024.zip -d .

echo '📁 Перемещение файлов из dist в корень...'
if [ -d "dist" ]; then
    mv dist/* .
    rmdir dist
    echo '✅ Файлы перемещены из dist в корень'
else
    echo '✅ Файлы уже в корне'
fi

echo '♻️ Перезапуск Nginx...'
systemctl restart nginx

echo '📋 Новый JS файл:'
ls -lh assets/index-*.js

echo '✅ Frontend обновлен с новой версией!'


