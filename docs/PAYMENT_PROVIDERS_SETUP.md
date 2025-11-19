# Настройка платежных систем (Robokassa, FreeKassa)

## 📋 Общая информация

Проект поддерживает несколько платежных систем с возможностью легкого переключения между ними:
- **Robokassa** - полная поддержка JWT API, включая автоматические возвраты
- **FreeKassa** - полная поддержка согласно официальной документации, включая API возвраты

### 🔄 Последнее обновление (2024-10-16)
FreekassaProvider обновлен согласно официальной документации FreeKassa:
- ✅ Исправлены API endpoints (`https://api.fk.life/v1/`)
- ✅ Обновлены алгоритмы подписи (MD5 для форм, HMAC-SHA256 для API)
- ✅ Добавлены обязательные параметры (currency, description)
- ✅ Поддержка возвратов через API

Подробнее: `docs/FREEKASSA_FIXES_REPORT.md`

## 🏗️ Архитектура

### Паттерн Strategy
Используется паттерн **Strategy** для абстракции платежных провайдеров:
- `IPaymentProvider` - общий интерфейс для всех провайдеров
- `RobokassaProvider` - реализация для Robokassa
- `FreekassaProvider` - реализация для FreeKassa
- `PaymentFactory` - фабрика для выбора провайдера

### Структура файлов
```
backend/src/
├── payments/
│   ├── interfaces/
│   │   └── IPaymentProvider.ts          # Интерфейс провайдера
│   ├── providers/
│   │   ├── RobokassaProvider.ts         # Адаптер для Robokassa
│   │   └── FreekassaProvider.ts         # Провайдер FreeKassa
│   └── PaymentFactory.ts                # Фабрика провайдеров
├── controllers/
│   ├── paymentController.ts             # Универсальный контроллер
│   └── robokassaController.ts           # Специфичный контроллер (совместимость)
└── routes/
    ├── payment.ts                       # Универсальные роуты
    └── robokassa.ts                     # Специфичные роуты (совместимость)
```

## ⚙️ Настройка переменных окружения

### 1. Выбор провайдера
```env
# backend/.env
PAYMENT_PROVIDER=robokassa  # или freekassa
```

### 2. Настройка Robokassa
```env
ROBOKASSA_MERCHANT_LOGIN=your_merchant_login
ROBOKASSA_PASSWORD_1=your_password_1
ROBOKASSA_PASSWORD_2=your_password_2
ROBOKASSA_PASSWORD_3=your_password_3
ROBOKASSA_TEST_MODE=false
ROBOKASSA_SUCCESS_URL=https://waxhands.ru/payment/success
ROBOKASSA_FAIL_URL=https://waxhands.ru/payment/fail
ROBOKASSA_RESULT_URL=https://waxhands.ru/api/payment/webhook
ROBOKASSA_ALGORITHM=MD5
```

### 3. Настройка FreeKassa
```env
FREEKASSA_MERCHANT_ID=your_merchant_id
FREEKASSA_API_KEY=your_api_key
FREEKASSA_SECRET_WORD_1=your_secret_word_1
FREEKASSA_SECRET_WORD_2=your_secret_word_2
FREEKASSA_SUCCESS_URL=https://waxhands.ru/payment/success
FREEKASSA_FAIL_URL=https://waxhands.ru/payment/fail
FREEKASSA_WEBHOOK_URL=https://waxhands.ru/api/payment/webhook
```

## 🚀 Применение изменений

### 1. Запуск миграции БД
```bash
# На локальной машине (Windows)
cd backend/migrations
psql -U postgres -d waxhands -f add_payment_provider_support.sql

# На сервере (Linux)
ssh root@147.45.161.83
cd /var/www/waxhands-app/backend/migrations
sudo -u postgres psql -d waxhands -f add_payment_provider_support.sql
```

### 2. Обновление кода на сервере
```powershell
# Windows
cd backend
npm run build
Compress-Archive -Path "dist\*" -DestinationPath "..\backend-payment-providers-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip" -Force
scp ..\backend-payment-providers-*.zip root@147.45.161.83:/tmp/
```

```bash
# На сервере
ssh root@147.45.161.83
cd /var/www/waxhands-app/backend
cp -r dist dist.backup
rm -rf dist
unzip /tmp/backend-payment-providers-*.zip -d dist
pm2 restart waxhands-backend
```

### 3. Обновление переменных окружения на сервере
```bash
ssh root@147.45.161.83
nano /var/www/waxhands-app/backend/.env

# Добавить новые переменные из примера выше
# Перезапустить backend
pm2 restart waxhands-backend
```

## 📝 Настройка в личных кабинетах платежных систем

### Robokassa
1. Войти в личный кабинет: https://merchant.roboxchange.com/
2. Перейти в "Технические настройки"
3. Указать URL:
   - **Result URL**: `https://waxhands.ru/api/payment/webhook`
   - **Success URL**: `https://waxhands.ru/payment/success`
   - **Fail URL**: `https://waxhands.ru/payment/fail`

### FreeKassa
1. Войти в личный кабинет: https://merchant.freekassa.net/
2. Перейти в "Настройки" → "Магазины"
3. Указать URL:
   - **URL уведомления**: `https://waxhands.ru/api/payment/webhook`
   - **URL успешной оплаты**: `https://waxhands.ru/payment/success`
   - **URL возврата**: `https://waxhands.ru/payment/fail`

## 🔄 Переключение между провайдерами

### Вариант 1: Через .env (рекомендуется)
```bash
# На сервере
nano /var/www/waxhands-app/backend/.env

# Изменить PAYMENT_PROVIDER
PAYMENT_PROVIDER=freekassa  # или robokassa

# Перезапустить backend
pm2 restart waxhands-backend
```

### Вариант 2: Программно (для A/B тестирования)
```typescript
import { paymentFactory } from './payments/PaymentFactory';

// Переключить на FreeKassa
paymentFactory.switchProvider('freekassa');

// Переключить обратно на Robokassa
paymentFactory.switchProvider('robokassa');
```

## 🔍 API эндпоинты

### Универсальные эндпоинты (работают с любым провайдером)
- `GET /api/payment/provider/info` - информация о текущем провайдере
- `POST /api/payment/invoices/:invoiceId/pay` - создание платежа
- `POST /api/payment/webhook` - webhook для уведомлений
- `GET /api/payment/success` - успешная оплата
- `GET /api/payment/fail` - отмена оплаты
- `GET /api/payment/invoices/:invoiceId/refund/check` - проверка возможности возврата

### Специфичные эндпоинты (совместимость)
- `/api/robokassa/*` - все эндпоинты Robokassa остаются для обратной совместимости

## 💡 Примеры использования

### Проверка текущего провайдера
```typescript
const response = await fetch('https://waxhands.ru/api/payment/provider/info');
const data = await response.json();

console.log(data);
// {
//   success: true,
//   data: {
//     provider: "FreeKassa",
//     type: "freekassa",
//     supportsRefunds: false,
//     supportsRefundStatus: false
//   }
// }
```

### Создание платежа
```typescript
const response = await fetch(`https://waxhands.ru/api/payment/invoices/${invoiceId}/pay`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
// {
//   success: true,
//   data: {
//     paymentUrl: "https://pay.freekassa.net",
//     invoiceId: "123",
//     formData: { ... },
//     method: "POST",
//     provider: "freekassa"
//   }
// }
```

## ⚠️ Важные отличия провайдеров

### Robokassa
✅ **Поддерживает:**
- Автоматические возвраты через API
- Проверка статуса возврата
- Фискализация чеков
- JWT API для создания счетов

### FreeKassa
✅ **Поддерживает:**
- Создание платежей
- Webhook уведомления
- Success/Fail редиректы

❌ **НЕ поддерживает:**
- Автоматические возвраты (только вручную через личный кабинет)
- API для проверки статуса возврата
- Автоматическая фискализация

## 🛡️ Безопасность

### Проверка подписей
Оба провайдера используют MD5 подпись для проверки уведомлений:

**Robokassa:**
- Формат подписи: `MD5(OutSum:InvId:Password2:Shp_*)`

**FreeKassa:**
- Формат подписи: `MD5(shopId:amount:secret:orderId)`

### Валидация данных
- Проверка суммы платежа
- Проверка статуса счета
- Проверка принадлежности счета пользователю

## 🔧 Диагностика

### Проверка логов
```bash
# На сервере
tail -f /var/www/waxhands-app/backend/backend.log | grep -i "payment"
```

### Проверка webhook
```bash
# Тест webhook локально
curl -X POST http://localhost:3001/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"MERCHANT_ORDER_ID":"test-123","AMOUNT":"100.00","MERCHANT_ID":"12345","SIGN":"test-signature"}'
```

## 📊 Мониторинг

### Проверка статуса платежей
```sql
-- Статистика по провайдерам
SELECT 
    payment_provider,
    COUNT(*) as total_invoices,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM invoices
GROUP BY payment_provider;

-- Последние платежи
SELECT id, amount, status, payment_provider, payment_date
FROM invoices
ORDER BY created_at DESC
LIMIT 10;
```

## 🐛 Типичные проблемы

### 1. "Payment provider not configured"
**Решение:** Проверить наличие переменных окружения для выбранного провайдера

### 2. "Invalid signature"
**Решение:** Убедиться, что секретные ключи совпадают с настройками в личном кабинете

### 3. "Invoice not found"
**Решение:** Проверить, что используется правильное поле (`robokassa_invoice_id` или `freekassa_invoice_id`)

## 📚 Дополнительная документация

- [Документация Robokassa API](docs/robokassa/)
- [Документация FreeKassa API](https://freekassa.net/docs)
- [Общая документация проекта](docs/Project.md)

---

**Дата обновления:** 2025-10-16  
**Версия:** 1.0.0

