# Исправление проблемы с иконками PWA

## Проблема
После обновления сервера иконки PWA не обновляются, используются старые версии. В разных браузерах отображаются разные иконки (с фоном и без фона).

## Причина
1. **Кэширование браузера** - браузер кэширует иконки и manifest.json
2. **Неправильное обновление** - иконки не копируются при деплое фронтенда
3. **Отсутствие версионирования** - нет принудительного обновления кэша

## Решение

### 1. Локальная подготовка
```powershell
# Запустить скрипт обновления
.\update-frontend-with-icons.ps1
```

### 2. Загрузка на сервер
```bash
# Загрузить архив на сервер
scp frontend-update-with-icons-*.zip root@147.45.161.83:/tmp/
```

### 3. Обновление на сервере
```bash
ssh root@147.45.161.83
cd /var/www/waxhands-app/frontend

# ПОЛНАЯ очистка frontend папки
rm -rf *

# Распаковка нового архива
unzip /tmp/frontend-update-with-icons-*.zip -d .

# Перезагрузка Nginx
systemctl reload nginx
```

### 4. Проверка обновления
```bash
# Проверить файлы на сервере
ls -la /var/www/waxhands-app/frontend/
ls -la /var/www/waxhands-app/frontend/icon-*.png

# Проверить manifest.json
cat /var/www/waxhands-app/frontend/manifest.json | grep "version"
```

## Ключевые изменения

### manifest.json
- Версия обновлена до 2.0.1
- Добавлены параметры `?v=2.0.1` к путям иконок
- Это принудительно обновляет кэш браузера

### Иконки
- Все иконки копируются при деплое
- Включая favicon.ico, manifest.json, sw.js
- Папки icons, onboarding, uploads

## Проверка в браузере

### 1. Очистка кэша
- **Chrome**: Ctrl+Shift+Delete → "Кэшированные изображения и файлы"
- **Firefox**: Ctrl+Shift+Delete → "Кэш"
- **Safari**: Cmd+Option+E (очистить кэш)

### 2. Проверка иконок
- Открыть DevTools → Network tab
- Перезагрузить страницу
- Убедиться, что загружаются новые иконки с `?v=2.0.1`

### 3. Установка PWA
- Удалить старое приложение
- Установить заново
- Проверить иконку на рабочем столе

## Альтернативное решение (если проблема остается)

### 1. Принудительное обновление через Service Worker
```javascript
// В sw.js добавить
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
```

### 2. Динамическое обновление manifest
```javascript
// В index.html добавить
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=' + Date.now());
  }
</script>
```

## Профилактика

### 1. Автоматическое версионирование
- Использовать timestamp в версии
- Обновлять версию при каждом деплое
- Добавлять параметры к путям иконок

### 2. Правильный процесс деплоя
- Всегда использовать `rm -rf *` на сервере
- Копировать все файлы из public папки
- Перезагружать Nginx после обновления

### 3. Мониторинг
- Проверять версии файлов на сервере
- Тестировать в разных браузерах
- Логировать обновления

## Команды для диагностики

```bash
# Проверка статуса Nginx
systemctl status nginx

# Проверка логов Nginx
tail -f /var/log/nginx/error.log

# Проверка прав доступа
ls -la /var/www/waxhands-app/frontend/

# Проверка содержимого файлов
file /var/www/waxhands-app/frontend/icon-192x192.png
```

## Результат
После применения этих изменений:
- ✅ Иконки обновляются при каждом деплое
- ✅ Браузер принудительно загружает новые версии
- ✅ PWA устанавливается с актуальными иконками
- ✅ Нет проблем с кэшированием

