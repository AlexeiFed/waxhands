# 🚀 Деплой исправлений FreekassaProvider

## 📋 Что было исправлено

FreekassaProvider обновлен согласно официальной документации FreeKassa API:

✅ **API Endpoints:** `https://api.fk.life/v1/`  
✅ **Подписи:** MD5 для форм, HMAC-SHA256 для API  
✅ **Параметры:** Добавлены `currency` и `description`  
✅ **Возвраты:** Поддержка API возвратов с правильными подписями

**Важно:** Код Robokassa НЕ изменился!

## 🛠️ Быстрый деплой

### Вариант 1: PowerShell скрипт (рекомендуется)
```powershell
.\deploy-freekassa-fixes.ps1
```

### Вариант 2: Вручную

#### 1. Сборка backend
```powershell
cd backend
npm run build
cd ..
```

#### 2. Создание архива
```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Compress-Archive -Path "backend\dist\*" -DestinationPath "backend-freekassa-fixes-$timestamp.zip" -Force
```

#### 3. Загрузка на сервер
```powershell
scp backend-freekassa-fixes-*.zip root@147.45.161.83:/tmp/
```

#### 4. Обновление на сервере
```bash
ssh root@147.45.161.83
cd /var/www/waxhands-app/backend

# Резервная копия
cp -r dist dist.backup-$(date +%Y%m%d-%H%M%S)

# Обновление
rm -rf dist
unzip -o /tmp/backend-freekassa-fixes-*.zip -d dist

# Перезапуск
pm2 restart waxhands-backend
pm2 status

# Проверка логов
tail -f backend.log
```

## 🧪 Тестирование

### 1. Проверка подписи платежной формы
```bash
# В логах должно быть:
🔐 FreeKassa - подпись платежа: {
  signatureString: '66509:1000.00:uqlTWAXu^hgw{Nq:RUB:12345',
  signature: 'abc123...'
}
```

### 2. Проверка webhook
```bash
# В логах должно быть:
🔍 FreeKassa - проверка подписи webhook: {
  signatureString: '66509:1000.00:s--vO&HvNfKxsyO:12345',
  received: 'xyz789...',
  expected: 'xyz789...',
  match: true
}
```

### 3. Тестовый платеж
1. Перейти на страницу мастер-класса
2. Выбрать участника и оплатить
3. Проверить создание платежной формы
4. Провести тестовый платеж
5. Проверить обработку webhook

## 📊 Мониторинг

### Логи PM2
```bash
ssh root@147.45.161.83 "pm2 logs waxhands-backend --lines 100"
```

### Логи backend
```bash
ssh root@147.45.161.83 "tail -f /var/www/waxhands-app/backend/backend.log"
```

### Статус процессов
```bash
ssh root@147.45.161.83 "pm2 status"
```

## 🔄 Откат изменений (если нужно)

```bash
ssh root@147.45.161.83
cd /var/www/waxhands-app/backend

# Найти резервную копию
ls -la | grep dist.backup

# Откатить
rm -rf dist
cp -r dist.backup-YYYYMMDD-HHMMSS dist

# Перезапустить
pm2 restart waxhands-backend
```

## 📚 Документация

- **Отчет об исправлениях:** `docs/FREEKASSA_FIXES_REPORT.md`
- **Настройка FreeKassa:** `docs/FREEKASSA_QUICK_SETUP.md`
- **Общая документация:** `docs/PAYMENT_PROVIDERS_SETUP.md`
- **Changelog:** `docs/changelog.md`
- **Tasktracker:** `docs/tasktracker.md`

## ⚠️ Важно

1. **Не забудьте настроить** `.env` файл с правильными FreeKassa credentials
2. **Проверьте** `PAYMENT_PROVIDER=freekassa` в `.env`
3. **Убедитесь**, что в личном кабинете FreeKassa указаны правильные URL
4. **Мониторьте** логи после деплоя на наличие ошибок

## 🆘 Помощь

Если что-то пошло не так:
1. Проверьте логи: `pm2 logs waxhands-backend`
2. Проверьте статус: `pm2 status`
3. Откатите изменения (см. выше)
4. Сообщите разработчику

---

**Дата:** 2024-10-16  
**Версия:** 1.0


