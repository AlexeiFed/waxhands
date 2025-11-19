# Текущая реализация оплаты Robokassa (до добавления фискализации)

## Файлы с реализацией оплаты

### Backend
- `backend/src/controllers/robokassaController.ts` - контроллер для создания платежей
- `backend/src/services/robokassaService.ts` - сервис для работы с Robokassa API
- `backend/src/routes/robokassa.ts` - маршруты для Robokassa
- `backend/src/routes/payment-webhook.ts` - webhook для обработки уведомлений

### Frontend  
- `src/api/chat.ts` - API вызовы для создания платежей
- Компоненты с кнопками оплаты (найти по коду)

## Текущий процесс оплаты

1. **Создание платежа**: `POST /api/robokassa/create-payment`
2. **Параметры**: `invoiceId`, `amount`, `description`, `participantName`
3. **Webhook**: `POST /api/robokassa/payment-webhook/robokassa`
4. **Обработка**: Обновление статуса счета в БД

## Параметры Robokassa (текущие)

```javascript
const params = {
    MerchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN,
    OutSum: amount,
    InvId: robokassaInvoiceId,
    Description: description,
    SignatureValue: signature,
    Shp_invoice_id: invoiceId,
    Shp_participant: participantName,
    Email: userEmail,
    Culture: 'ru'
};
```

## Проблема

**Отсутствует параметр `Receipt`** для фискализации чека согласно ФЗ-54.

## Webhook данные (пример)

```
out_summ=4.000000&OutSum=4.000000&inv_id=1759316300722&InvId=1759316300722&crc=5C4D6942F9BFD753B49DEE8F84C6139D&SignatureValue=5C4D6942F9BFD753B49DEE8F84C6139D&PaymentMethod=BankCard&IncSum=4.000000&IncCurrLabel=BankCardPSR&EMail=23alex08@gmail.com&Fee=0.140000&Shp_invoice_id=70fd005e-5ad4-448b-94d8-7ec41f4132a1&Shp_participant=%25D0%259F%25D0%25B0%25D0%25B2%25D0%25B5%25D0%25BB%2520%25D0%25A2%25D1%258B%25D1%2580%25D0%25B8%25D0%25BD%2520(1%2520%25D0%25D0%25B5%25D1%2582%25D0%25B5%25D0%25B9)
```

## Что добавлено (2025-10-01 16:15)

1. ✅ **Параметр `Receipt`** в JSON формате с номенклатурой
2. ✅ **Включен `Receipt` в подпись** (MerchantLogin:OutSum:InvId:Receipt:Пароль#1)
3. ✅ **Добавлены данные о товарах** (название, количество, цена, НДС)
4. ✅ **Добавлены выбранные стили и опции** в чек как отдельные позиции
5. ✅ **Правильный расчет сумм для самозанятого** - общая сумма = сумма всех стилей и опций

## Структура чека

```json
{
  "sno": "osn",
  "items": [
    {
      "name": "Стиль: Классический",
      "quantity": 1,
      "sum": 2.0,
      "payment_method": "full_prepayment",
      "payment_object": "service",
      "tax": "none"
    },
    {
      "name": "Опция: Срочное изготовление",
      "quantity": 1,
      "sum": 2.0,
      "payment_method": "full_prepayment",
      "payment_object": "service",
      "tax": "none"
    }
  ]
}
```

**Примечание**: Для самозанятого общая сумма (4.0) = сумма всех позиций в чеке. Базовая услуга не добавляется, если есть стили и опции.

## Дата фиксации
2025-10-01 16:10

## Что добавлено для возвратов (2025-10-01 16:30)

1. ✅ **InvoiceItems в возврате** - добавлены все позиции из чека
2. ✅ **Детализация возврата** - стили и опции как отдельные позиции
3. ✅ **Метод `getInvoiceItemsForRefund`** - получает данные чека из БД
4. ✅ **Обновлен `createRefund`** - поддерживает InvoiceItems
5. ✅ **Обновлен контроллер** - передает InvoiceItems в возврат

## Структура возврата с InvoiceItems

```json
{
  "OpKey": "82E18CE5-3B1A-462C-B149-6D394503335E-obR0wBJMMU",
  "RefundSum": "4.00",
  "InvoiceItems": [
    {
      "Name": "Стиль: Классический",
      "Quantity": 1,
      "Cost": "2.00",
      "Tax": "none",
      "PaymentMethod": "full_payment",
      "PaymentObject": "service"
    },
    {
      "Name": "Опция: Срочное изготовление",
      "Quantity": 1,
      "Cost": "2.00",
      "Tax": "none",
      "PaymentMethod": "full_payment",
      "PaymentObject": "service"
    }
  ]
}
```

## Дата фиксации
2025-10-01 16:10

## Дата обновления
2025-10-01 16:15

## Дата обновления возвратов
2025-10-01 16:30
