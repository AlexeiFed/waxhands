# Исправление фронтенда для работы с POST формой RoboKassa

## Проблема
После исправления backend для возврата POST формы вместо URL, фронтенд продолжал ожидать старую структуру ответа с `paymentUrl`.

## Диагностика
В логах фронтенда видно:
```
✅ Получена ссылка на оплату: https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=waxhands.ru&OutSum=2&InvoiceID=770734335340&Description=...&SignatureValue=76570267bceecd8ba6b2a9876203764a&Culture=ru&Encoding=utf-8
```

**Проблема**: В URL отсутствует параметр `Receipt`, а подпись рассчитана БЕЗ фискализации.

## Решение

### 1. Обновлен интерфейс PaymentResponse
```typescript
interface PaymentResponse {
    success: boolean;
    data?: {
        paymentUrl?: string;
        invoiceId?: string;
        formData?: {
            MerchantLogin: string;
            OutSum: string;
            InvoiceID: string;
            Receipt: string;
            Description: string;
            SignatureValue: string;
            Culture: string;
            Encoding: string;
            IsTest?: string;
        };
    };
    error?: string;
}
```

### 2. Добавлена функция submitPaymentForm
```typescript
const submitPaymentForm = (url: string, formData: NonNullable<PaymentResponse['data']>['formData']) => {
    if (!formData) {
        console.error('❌ Данные формы отсутствуют');
        return;
    }

    console.log('📝 Создаем и отправляем POST форму для RoboKassa:', { url, formData });

    // Создаем форму
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';
    form.style.display = 'none';

    // Добавляем поля формы
    Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    });

    // Добавляем форму в DOM и отправляем
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    console.log('✅ POST форма отправлена в новом окне');
};
```

### 3. Обновлена обработка ответа API
```typescript
if (result.success && result.data) {
    if (result.data.formData) {
        // Новая структура с POST формой
        console.log('✅ Получены данные POST формы:', result.data.formData);
        setPaymentUrl(result.data.paymentUrl || 'https://auth.robokassa.ru/Merchant/Index.aspx');
        // Создаем и отправляем POST форму
        submitPaymentForm(result.data.paymentUrl, result.data.formData);
    } else if (result.data.paymentUrl) {
        // Старая структура с URL
        console.log('✅ Получена ссылка на оплату:', result.data.paymentUrl);
        setPaymentUrl(result.data.paymentUrl);
        // Открываем iframe для оплаты
        openPaymentIframe(result.data.paymentUrl);
    }
}
```

## Результат
- ✅ Фронтенд поддерживает новую структуру ответа с `formData`
- ✅ POST форма создается и отправляется автоматически
- ✅ Фискализация передается корректно через POST параметры
- ✅ Обратная совместимость с старой структурой ответа

## Обновленные файлы
- `src/components/payment/RobokassaPayment.tsx` - основной компонент оплаты
- `dist/assets/index-Db-WfuYJ-1758347643406.js` - новый JS файл на сервере

## Тестирование
1. **Backend**: Возвращает POST форму с фискализацией
2. **Frontend**: Создает и отправляет POST форму в новом окне
3. **RoboKassa**: Получает все параметры включая Receipt
4. **Результат**: Ошибка 29 исправлена

**Дата исправления:** 2025-09-20 15:54
**Статус:** ✅ Исправлено и развернуто в production
