@echo off
echo Wax Hands PWA - Production Server
echo ================================

echo.
echo Структура проекта:
echo - frontend/     - Frontend файлы
echo - backend/      - Backend приложение  
echo - uploads/      - Загруженные файлы
echo - .env          - Environment переменные

echo.
echo Для запуска на сервере:
echo 1. cd production/backend
echo 2. npm install --only=production
echo 3. NODE_ENV=production node index.js

echo.
echo Для настройки Nginx:
echo - frontend/ → /var/www/waxhands.ru/
echo - backend/ → http://localhost:3001
echo - uploads/ → /var/www/waxhands.ru/uploads/

echo.
echo Нажмите любую клавишу для выхода...
pause >nul
