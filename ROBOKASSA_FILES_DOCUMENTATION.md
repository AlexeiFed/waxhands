# Документация файлов Robokassa

## 🔑 1. Формирование подписи (самая важная часть)

### `backend/src/services/robokassaService.ts`
**Основной файл для работы с Robokassa**

**Ключевые методы:**
- `createInvoice()` - создание счета с формированием подписи
- `createSignature()` - формирование MD5 подписи
- `createReceipt()` - создание фискального чека
- `verifyResultSignature()` - проверка подписи от Robokassa
- `verifySuccessSignature()` - проверка подписи SuccessURL

**Формирование подписи:**
```typescript
// Текущая диагностическая версия (без Receipt):
const signatureString = `${merchantLogin}:${amount}:${invId}:${password1}`;

// Продакшн версия с фискализацией:
const signatureString = `${merchantLogin}:${amount}:${invId}:${receipt}:${password1}`;
```

**Настройки мерчанта:**
```typescript
this.config = {
    merchantLogin: 'waxhands.ru',
    password1: '05VQ6EQ061SnSBAh8vyg',
    password2: 'jzGU7uFNx4T741Usynxm',
    testMode: false,
    // ... другие настройки
};
```

---

## 📋 2. Параметры запроса к Robokassa

### `backend/src/controllers/robokassaController.ts`
**Контроллер для обработки запросов Robokassa**

**Основные методы:**
- `createInvoice()` - создание нового счета
- `payInvoice()` - получение ссылки на оплату
- `handlePaymentResult()` - обработка ResultURL
- `handlePaymentSuccess()` - обработка SuccessURL
- `handlePaymentFail()` - обработка FailURL

**Структура данных запроса:**
```typescript
interface CreateRobokassaInvoiceData {
    invoiceId: string;
    amount: number;
    description: string;
    participantName: string;
    masterClassName: string;
    selectedStyles: Array<{id: string, name: string, price: number}>;
    selectedOptions: Array<{id: string, name: string, price: number}>;
    workshopDate: Date;
    city: string;
    schoolName: string;
    classGroup: string;
    notes?: string;
}
```

---

## 🔄 3. Обработчик результата (ResultURL)

### `backend/src/controllers/robokassaController.ts` - метод `handlePaymentResult()`

**URL:** `POST /api/robokassa/payment-webhook/robokassa`

**Функции:**
- Проверка подписи от Robokassa
- Обновление статуса счета в БД
- Отправка уведомлений
- Логирование результата

**Параметры от Robokassa:**
```typescript
interface RobokassaResultNotification {
    OutSum: string;           // Сумма платежа
    InvId: string;           // ID счета
    SignatureValue: string;  // Подпись Robokassa
    [key: string]: string;   // Дополнительные параметры
}
```

**Проверка подписи:**
```typescript
// Формат: OutSum:InvId:Пароль#2
const signatureString = `${OutSum}:${InvId}:${password2}`;
const expectedSignature = md5(signatureString).toUpperCase();
```

---

## ✅ 4. Обработчик успешной оплаты (SuccessURL)

### `backend/src/controllers/robokassaController.ts` - метод `handlePaymentSuccess()`

**URL:** `GET /api/robokassa/payment/success`

**Функции:**
- Проверка подписи SuccessURL
- Отображение страницы успешной оплаты
- Перенаправление пользователя

**Параметры SuccessURL:**
```typescript
{
    OutSum: string;          // Сумма платежа
    InvId: string;          // ID счета
    SignatureValue: string; // Подпись Robokassa
}
```

**Проверка подписи:**
```typescript
// Формат: OutSum:InvId:Пароль#1
const signatureString = `${OutSum}:${InvId}:${password1}`;
const expectedSignature = md5(signatureString).toUpperCase();
```

---

## ❌ 5. Обработчик неудачной оплаты (FailURL)

### `backend/src/controllers/robokassaController.ts` - метод `handlePaymentFail()`

**URL:** `GET /api/robokassa/payment/fail`

**Функции:**
- Отображение страницы неудачной оплаты
- Логирование ошибки
- Возможность повторной попытки оплаты

**Параметры FailURL:**
```typescript
{
    OutSum: string;          // Сумма платежа
    InvId: string;          // ID счета
    SignatureValue: string; // Подпись Robokassa
}
```

---

## 🛣️ 6. Маршруты (Routes)

### `backend/src/routes/robokassa.ts`
**Определение всех маршрутов Robokassa**

```typescript
// Создание счета
router.post('/invoices', authenticateToken, robokassaController.createInvoice);

// Получение ссылки на оплату
router.post('/invoices/:id/pay', authenticateToken, robokassaController.payInvoice);

// Webhook от Robokassa (ResultURL)
router.post('/payment-webhook/robokassa', robokassaController.handlePaymentResult);

// Успешная оплата (SuccessURL)
router.get('/payment/success', robokassaController.handlePaymentSuccess);

// Неудачная оплата (FailURL)
router.get('/payment/fail', robokassaController.handlePaymentFail);
```

---

## 🎯 7. Фронтенд компонент

### `src/components/payment/RobokassaPayment.tsx`
**React компонент для оплаты через Robokassa**

**Функции:**
- Создание POST формы для Robokassa
- Автоматическая отправка формы
- Обработка ошибок
- Отображение статуса оплаты

**Ключевые методы:**
```typescript
const handlePayment = async () => {
    // Получение данных формы от backend
    const response = await fetch(`/api/robokassa/invoices/${invoice.id}/pay`);
    const result = await response.json();
    
    if (result.success && result.data.formData) {
        // Создание и отправка POST формы
        submitPaymentForm(result.data.paymentUrl, result.data.formData);
    }
};
```

---

## ⚙️ 8. Конфигурация

### `backend/.env.production`
**Переменные окружения для Robokassa**

```bash
# Robokassa Configuration
ROBOKASSA_MERCHANT_LOGIN=waxhands.ru
ROBOKASSA_PASSWORD_1=05VQ6EQ061SnSBAh8vyg
ROBOKASSA_PASSWORD_2=jzGU7uFNx4T741Usynxm
ROBOKASSA_TEST_MODE=false
ROBOKASSA_SUCCESS_URL=https://waxhands.ru/api/robokassa/payment/success
ROBOKASSA_FAIL_URL=https://waxhands.ru/api/robokassa/payment/fail
ROBOKASSA_RESULT_URL=https://waxhands.ru/api/robokassa/payment-webhook/robokassa
ROBOKASSA_ALGORITHM=MD5
```

---

## 📊 9. Типы данных

### `backend/src/types/robokassa.ts`
**TypeScript интерфейсы для Robokassa**

```typescript
export interface RobokassaConfig {
    merchantLogin: string;
    password1: string;
    password2: string;
    password3: string;
    testMode: boolean;
    successUrl: string;
    failUrl: string;
    resultUrl: string;
    algorithm: 'MD5' | 'RIPEMD160' | 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512';
}

export interface RobokassaCreateInvoiceResponse {
    success: boolean;
    invoiceUrl?: string;
    invoiceId?: string;
    formData?: {
        MerchantLogin: string;
        OutSum: string;
        InvId: string;
        Receipt?: string;
        Description: string;
        SignatureValue: string;
        Culture: string;
        Encoding: string;
        IsTest?: string;
    };
    error?: string;
}
```

---

## 🔍 10. Текущие проблемы и диагностика

### Ошибка 29 "Оплата счетов недоступна"

**Возможные причины:**
1. Мерчант `waxhands.ru` не активирован в Robokassa
2. Неправильные пароли мерчанта
3. Мерчант не настроен для фискализации
4. Технические проблемы на стороне Robokassa

**Текущая диагностическая версия:**
- Отключена фискализация (Receipt)
- Используется простая подпись: `MerchantLogin:OutSum:InvId:Пароль#1`
- Без параметра Receipt в форме

**Следующие шаги:**
1. Проверить статус мерчанта в личном кабинете Robokassa
2. Убедиться в правильности паролей
3. Настроить фискализацию если требуется
4. Протестировать с текущей диагностической версией

---

## 📝 Логи и отладка

**Просмотр логов:**
```bash
# Логи backend процесса
ssh root@147.45.161.83 "cd /var/www/waxhands-app && pm2 logs waxhands-backend --lines 50"

# Логи в файле
ssh root@147.45.161.83 "cd /var/www/waxhands-app && tail -f backend.log"
```

**Ключевые логи:**
- `🔍 Диагностика - подпись БЕЗ Receipt:` - текущая подпись
- `🔍 Полученная подпись:` - MD5 хеш подписи
- `✅ Данные формы созданы:` - параметры формы для Robokassa
