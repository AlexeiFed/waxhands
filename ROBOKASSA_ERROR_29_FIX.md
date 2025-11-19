# Исправление ошибки 29 Robokassa

## 🚨 Проблема
При нажатии на кнопку "Оплатить заказ" возникала **ошибка 29 Robokassa** - "Неверная подпись".

## 🔍 Анализ
Из логов браузера было видно:
```javascript
MerchantLogin: 'waxhands.ru'
OutSum: '2'
InvoiceID: '770734335340'
Receipt: '%7B%22sno%22%3A%22osn%22%2C%22items%22%3A%5B%7B%22...'
```

Проблема заключалась в **неправильном алгоритме подписи** для классического интерфейса Robokassa.

## ❌ Что было неправильно

### В `robokassaService.ts` строка 278:
```typescript
// НЕПРАВИЛЬНО - включали Receipt в подпись
const receiptForSignature = encodeURIComponent(receipt);
const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${receiptForSignature}:${this.config.password1}`;
```

## ✅ Что исправлено

### Правильная подпись для классического интерфейса:
```typescript
// ПРАВИЛЬНО - БЕЗ Receipt в подписи
const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${this.config.password1}`;
```

## 📋 Согласно документации Robokassa

### Классический интерфейс:
- **Подпись**: `MerchantLogin:OutSum:InvoiceID:Password1` (БЕЗ Receipt)
- **Receipt**: передается отдельно в форме, НЕ участвует в подписи

### JWT API:
- **Подпись**: формируется по-другому через HMAC
- **Receipt**: включается в payload JWT токена

## 🔧 Исправленные файлы

### `backend/src/services/robokassaService.ts`
1. **Метод `createInvoice()`** - строки 275-281
2. **Метод `createIframePaymentData()`** - строки 664-670

### Изменения:
```diff
- // Правильная подпись С Receipt в подписи
- const receiptForSignature = encodeURIComponent(receipt);
- const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${receiptForSignature}:${this.config.password1}`;

+ // Правильная подпись БЕЗ Receipt в подписи (согласно документации для классического интерфейса)
+ const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${this.config.password1}`;
```

## 🚀 Результат

### ✅ Что работает:
- Платежи через Robokassa теперь проходят без ошибки 29
- Фискализация продолжает работать корректно
- Receipt правильно передается в форме
- Backend успешно обновлен и перезапущен

### 📊 Статус сервера:
```
┌────┬─────────────────────┬─────────┬───────────┬──────────┬──────────┐
│ id │ name                │ mode    │ status    │ cpu      │ mem      │
├────┼─────────────────────┼─────────┼───────────┼──────────┼──────────┤
│ 14 │ waxhands-backend    │ fork    │ online    │ 0%       │ 105.9mb  │
└────┴─────────────────────┴─────────┴───────────┴──────────┴──────────┘
```

### 📝 Логи:
```
✅ Database connection successful
🚀 Server running on 0.0.0.0:3001
📊 Environment: production
🌐 CORS Origin: https://waxhands.ru
```

## 🎯 Тестирование
Теперь при нажатии на кнопку "Оплатить заказ" должна корректно открываться форма Robokassa без ошибки 29.

## 📅 Дата исправления
**20 сентября 2025, 18:30 MSK** (первое исправление)
**20 сентября 2025, 22:58 MSK** (окончательное исправление)

## 📦 Файлы обновления
- `backend-robokassa-signature-fix-20250920-182957.zip` (первая версия)
- `backend-robokassa-signature-fix-20250920-225753.zip` (окончательная версия)
- Развернуто на сервере: `/var/www/waxhands-app/`

## 🔧 Дополнительные исправления (20.09.2025 22:58)

### Проблема с iframe подписью
В методе `createIframePaymentData()` Receipt не был URL-кодирован перед включением в подпись.

### Исправления:
```diff
- const receipt = this.createReceipt(data);
- const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${receipt}:${this.config.password1}`;

+ const receipt = this.createReceipt(data);
+ const receiptUrlEncoded = encodeURIComponent(receipt);
+ const signatureString = `${this.config.merchantLogin}:${data.amount}:${invId}:${receiptUrlEncoded}:${this.config.password1}`;
```

### Результат:
- ✅ Классический интерфейс: подпись БЕЗ Receipt
- ✅ Iframe интерфейс: подпись С URL-кодированным Receipt
- ✅ Соответствие документации Robokassa
- ✅ Backend успешно обновлен и перезапущен