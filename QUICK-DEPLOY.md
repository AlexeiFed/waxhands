# ⚡ Быстрый старт - Деплой на waxhands.ru

> Краткая шпаргалка для быстрого деплоя. Подробности в [DEPLOY.md](./DEPLOY.md)

## 🚀 Основные команды

### Frontend обновление

```powershell
.\deploy-frontend-v2.ps1
```

**Time:** ~3 minutes  
**Actions:** Build -> Archive -> Upload -> Full replace -> Reload Nginx  
**After deploy:** Press Ctrl+F5 in browser

---

### Backend обновление

```powershell
.\deploy-backend-v2.ps1
```

**Time:** ~3 minutes  
**Actions:** Build -> Archive -> Backup -> Upload -> Replace -> Restart PM2  
**Auto rollback:** On errors

---

### Полное обновление (Backend + Frontend)

```powershell
# 1. Сначала backend
.\deploy-backend-v2.ps1

# 2. Затем frontend
.\deploy-frontend-v2.ps1
```

**Time:** ~6 minutes

---

## 🔍 Быстрая диагностика

### Проверка статуса

```bash
ssh root@147.45.161.83 "pm2 status"
```

### Логи backend

```bash
ssh root@147.45.161.83 "pm2 logs waxhands-backend --lines 50"
```

### Проверка frontend файлов

```bash
ssh root@147.45.161.83 "ls -lh /var/www/waxhands-app/frontend/assets/index-*.js"
```

---

## ⏮️ Быстрый откат

### Откат Backend (автоматический бэкап)

```bash
ssh root@147.45.161.83
cd /var/www/waxhands-app/backend
ls -lt dist.backup.* | head -5  # Показать последние 5 бэкапов
rm -rf dist && cp -r dist.backup.YYYYMMDD-HHMMSS dist
pm2 restart waxhands-backend
```

### Откат Frontend (через Git)

```powershell
git log --oneline -5
git checkout <старый-коммит>
.\deploy-frontend-v2.ps1
git checkout main
```

---

## 🆘 Частые проблемы

| Проблема | Решение |
|----------|---------|
| Build failed | `npm run build` - проверить ошибки |
| SSH timeout | Проверить `ssh root@147.45.161.83 "echo OK"` |
| Frontend не обновляется | Ctrl+F5 в браузере |
| Backend не стартует | `ssh root@147.45.161.83 "pm2 logs waxhands-backend"` |
| Disk full | `ssh root@147.45.161.83 "df -h && cd /var/www/waxhands-app/backend && ls -dt dist.backup.* | tail -n +4 | xargs rm -rf"` |

---

## 📦 Что делают скрипты

### `deploy-frontend-v2.ps1`

1. ✅ Очистка кэша
2. 🔨 Сборка (`npm run build`)
3. 🔍 Проверка файлов
4. 📦 Создание tar.gz
5. ⬆️ Загрузка на сервер
6. 🗑️ Полная очистка `/var/www/waxhands-app/frontend/`
7. 📂 Распаковка новых файлов
8. 🔄 Reload Nginx

### `deploy-backend-v2.ps1`

1. 📂 Переход в `backend/`
2. 🗑️ Очистка `dist/`
3. 🔨 Сборка (`npm run build`)
4. 🔍 Проверка файлов
5. 📦 Создание tar.gz
6. ⬆️ Загрузка на сервер
7. 💾 Автоматический бэкап
8. 📂 Распаковка в `dist/`
9. 🔄 Restart PM2
10. ✅ Проверка работоспособности

---

## 🌐 URLs

- **Сайт:** https://waxhands.ru
- **API:** https://waxhands.ru/api
- **WebSocket:** wss://waxhands.ru/ws

---

## 📞 Полезные команды

```bash
# Статус PM2
ssh root@147.45.161.83 "pm2 show waxhands-backend"

# Перезапуск backend
ssh root@147.45.161.83 "pm2 restart waxhands-backend"

# Перезагрузка Nginx
ssh root@147.45.161.83 "systemctl reload nginx"

# Проверка места на диске
ssh root@147.45.161.83 "df -h"

# Список бэкапов
ssh root@147.45.161.83 "ls -lt /var/www/waxhands-app/backend/dist.backup.*"
```

---

📚 **Полная документация:** [DEPLOY.md](./DEPLOY.md)  
📝 **Changelog:** [docs/changelog.md](./docs/changelog.md)  
📋 **Task Tracker:** [docs/tasktracker.md](./docs/tasktracker.md)  

