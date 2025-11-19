#!/bin/bash

cd /var/www/waxhands-app/backend

echo '📋 Создание резервной копии...'
cp -r dist dist.backup-$(date +%Y%m%d-%H%M%S)

echo '🗑️ Удаление старого dist...'
rm -rf dist

echo '📦 Распаковка нового архива...'
unzip -o /tmp/backend-freekassa-20251017-001104.zip -d dist

echo '📝 Обновление .env файлов...'
cp /tmp/.env-backend .env
cp /tmp/.env.production-backend .env.production

echo '♻️ Перезапуск PM2...'
pm2 restart waxhands-backend

echo '📊 Проверка статуса...'
pm2 status

echo '✅ Обновление завершено'


