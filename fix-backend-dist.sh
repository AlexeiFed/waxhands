#!/bin/bash

cd /var/www/waxhands-app/backend

echo '📋 Текущая структура dist:'
ls -la dist/ | head -20

echo ''
echo '🔧 Исправление структуры dist...'

# Создаем временную папку
mkdir -p temp_dist

# Перемещаем содержимое dist/dist в temp_dist
if [ -d "dist/dist" ]; then
    echo '📦 Найдена вложенная папка dist/dist, перемещаем файлы...'
    mv dist/dist/* temp_dist/
    rm -rf dist
    mv temp_dist dist
    echo '✅ Структура исправлена'
else
    echo '✅ Структура уже правильная'
    rm -rf temp_dist
fi

echo ''
echo '📋 Новая структура dist:'
ls -la dist/ | head -20

echo ''
echo '♻️ Перезапуск PM2...'
pm2 restart waxhands-backend

echo '✅ Готово!'


