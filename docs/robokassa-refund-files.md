# Файлы системы возвратов Robokassa

Документ содержит описание всех файлов, связанных с функционалом возврата средств через Robokassa API.

---

## Backend - Сервисы

### 1. `backend/src/services/robokassaService.ts`

**Назначение**: Основной сервис для работы с Robokassa API, включая возвраты.

**Ключевые методы возврата**:

#### `createRefund(refundData: RobokassaRefundRequest)`
```typescript
async createRefund(refundData: RobokassaRefundRequest): Promise<RobokassaRefundResponse> {
    // Проверка Password3
    if (!this.config.password3) {
        throw new Error('Password3 не настроен для API возвратов');
    }

    // Валидация OpKey
    if (!refundData.OpKey) {
        throw new Error('OpKey обязателен для создания возврата');
    }

    // ВАЖНО: Robokassa требует decimal формат как СТРОКУ ("4.00", а не 4)
    const refundSumString = typeof refundData.RefundSum === 'number' 
        ? refundData.RefundSum.toFixed(2)
        : parseFloat(refundData.RefundSum).toFixed(2);

    // Создаем payload для JWT
    const payload = {
        OpKey: refundData.OpKey,
        RefundSum: refundSumString
    };

    // Создаем JWT токен (HS256 с Password3)
    const compactPayload = JSON.stringify(payload);
    const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
    const encodedHeader = Buffer.from(header).toString('base64url');
    const encodedPayload = Buffer.from(compactPayload).toString('base64url');
    
    const signatureString = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.createHmac('sha256', this.config.password3)
        .update(signatureString)
        .digest('base64url');
    
    const jwtToken = `${signatureString}.${signature}`;

    // Отправка запроса к Robokassa
    const response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'WaxHands/1.0'
        },
        body: jwtToken
    });

    const responseText = await response.text();
    
    // Обработка пустого ответа
    if (!responseText || responseText.trim() === '') {
        return {
            success: false,
            message: 'Пустой ответ от Robokassa API'
        };
    }

    const result = JSON.parse(responseText);
    
    if (result.success === true) {
        return {
            success: true,
            message: result.message || 'Возврат успешно создан',
            requestId: result.requestId
        };
    }
    
    return {
        success: false,
        message: result.message || 'Неизвестная ошибка возврата'
    };
}
```

#### `createRefundJWT(refundData: RobokassaRefundRequest)`
```typescript
async createRefundJWT(refundData: RobokassaRefundRequest): Promise<string> {
    // Создает JWT токен для отладки возврата
    // Используется тот же алгоритм, что и в createRefund
    // RefundSum также форматируется как строка "4.00"
}
```

#### `getRefundStatus(requestId: string)`
```typescript
async getRefundStatus(requestId: string): Promise<RobokassaRefundStatusResponse> {
    // Проверка статуса возврата по requestId
    const url = `https://services.robokassa.ru/RefundService/Refund/GetState?id=${requestId}`;
    const response = await fetch(url);
    // Возвращает: requestId, amount, label (finished/processing/canceled)
}
```

#### `isRefundAvailable(workshopDate: Date)`
```typescript
isRefundAvailable(workshopDate: Date): boolean {
    // Проверяет, что возврат возможен (минимум 3 часа до мастер-класса)
    const now = new Date();
    const workshopTime = new Date(workshopDate);
    const diffInHours = (workshopTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours >= 3;
}
```

#### `checkOperationStatus(robokassaId: number)`
```typescript
async checkOperationStatus(robokassaId: number): Promise<RobokassaOperationStatusResponse> {
    // Получает OpKey из XML API Robokassa через OpStateExt
    // OpKey необходим для создания возврата
}
```

#### `getInvoiceItemsForRefund(invoiceId: string)`
```typescript
async getInvoiceItemsForRefund(invoiceId: string): Promise<RobokassaRefundInvoiceItem[]> {
    // Получает данные счета из БД и формирует детализацию для возврата
    // Обрабатывает selected_styles и selected_options
    // Возвращает массив позиций для InvoiceItems
    
    const result = await pool.query(`
        SELECT 
            amount,
            selected_styles,
            selected_options,
            master_class_id
        FROM invoices 
        WHERE id = $1
    `, [invoiceId]);

    const invoice = result.rows[0];
    const invoiceItems: RobokassaRefundInvoiceItem[] = [];

    // Обработка стилей
    let styles = [];
    if (invoice.selected_styles) {
        styles = typeof invoice.selected_styles === 'string' 
            ? JSON.parse(invoice.selected_styles) 
            : invoice.selected_styles;
    }

    // Обработка опций
    let options = [];
    if (invoice.selected_options) {
        options = typeof invoice.selected_options === 'string' 
            ? JSON.parse(invoice.selected_options) 
            : invoice.selected_options;
    }

    // Добавление стилей как отдельных позиций
    styles.forEach((style: { name: string; price: number }) => {
        if (style.price > 0) {
            invoiceItems.push({
                Name: `Стиль: ${style.name}`,
                Quantity: 1,
                Cost: style.price.toFixed(2),
                Tax: 'none',
                PaymentMethod: 'full_payment',
                PaymentObject: 'service'
            });
        }
    });

    // Добавление опций как отдельных позиций
    options.forEach((option: { name: string; price: number }) => {
        if (option.price > 0) {
            invoiceItems.push({
                Name: `Опция: ${option.name}`,
                Quantity: 1,
                Cost: option.price.toFixed(2),
                Tax: 'none',
                PaymentMethod: 'full_payment',
                PaymentObject: 'service'
            });
        }
    });

    // Если нет стилей и опций, добавляем базовую услугу
    if (invoiceItems.length === 0) {
        invoiceItems.push({
            Name: 'Мастер-класс "Восковая ручка"',
            Quantity: 1,
            Cost: parseFloat(invoice.amount).toFixed(2),
            Tax: 'none',
            PaymentMethod: 'full_payment',
            PaymentObject: 'service'
        });
    }

    return invoiceItems;
}
```

**Особенности реализации**:
- RefundSum передается как строка с decimal форматом ("4.00")
- JWT подписывается алгоритмом HS256 с Password3
- Payload компактный JSON без пробелов
- InvoiceItems передаются для детализации возврата (стили и опции)
- Content-Type: НЕ передается (Robokassa не принимает application/jwt)
- Обработка selected_styles и selected_options из БД

---

## Последние изменения

### 2025-10-02 - Исправление формата полей Receipt
- **Проблема**: Robokassa не выдавал чеки из-за неправильного формата полей в `Receipt` параметре
- **Решение**: Изменены названия полей в `Receipt` с строчных на заглавные:
  - `name` → `Name`
  - `quantity` → `Quantity`
  - `sum` → `Sum`
  - `payment_method` → `PaymentMethod`
  - `payment_object` → `PaymentObject`
  - `tax` → `Tax`
  - `sno` → `Sno`
  - `items` → `Items`
- **Файлы**: `backend/src/services/robokassaService.ts`
- **Статус**: ✅ Исправлено и развернуто на сервере

---

## Backend - Контроллеры

### 2. `backend/src/controllers/robokassaController.ts`

**Назначение**: API endpoints для работы с возвратами.

#### `checkRefundAvailability`
```typescript
export const checkRefundAvailability = async (req: AuthenticatedRequest, res: Response) => {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;
    
    // Валидация и получение данных счета
    const validationResult = await validateAndGetInvoiceData(invoiceId, userId!, req.user?.role || 'parent');
    
    if (!validationResult.success) {
        return res.status(validationResult.statusCode).json({
            success: false,
            error: validationResult.error
        });
    }
    
    const { invoice } = validationResult;
    
    // Проверка статуса
    if (invoice.status !== 'paid') {
        return res.status(400).json({
            success: false,
            error: 'Счет не оплачен'
        });
    }
    
    // Проверка временного окна
    const canRefund = robokassaService.isRefundAvailable(invoice.workshop_date);
    
    if (!canRefund) {
        return res.status(400).json({
            success: false,
            canRefund: false,
            message: 'Возврат возможен только за 3 часа до мастер-класса'
        });
    }
    
    res.json({
        success: true,
        canRefund: true,
        invoice: {
            id: invoice.id,
            amount: invoice.amount,
            workshop_date: invoice.workshop_date
        }
    });
};
```

#### `initiateRefund`
```typescript
export const initiateRefund = async (req: AuthenticatedRequest, res: Response) => {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;
    const reason = 'Возврат по запросу пользователя';
    
    // Валидация счета
    const validationResult = await validateAndGetInvoiceData(invoiceId, userId!, req.user?.role || 'parent');
    
    if (!validationResult.success) {
        return res.status(validationResult.statusCode).json({
            success: false,
            error: validationResult.error
        });
    }
    
    const { invoice } = validationResult;
    
    // Проверки
    if (invoice.status !== 'paid') {
        return res.status(400).json({ success: false, error: 'Счет не оплачен' });
    }
    
    if (!robokassaService.isRefundAvailable(invoice.workshop_date)) {
        return res.status(400).json({
            success: false,
            error: 'Возврат возможен только за 3 часа до мастер-класса'
        });
    }
    
    if (invoice.refund_status === 'pending' || invoice.refund_status === 'completed') {
        return res.status(400).json({
            success: false,
            error: 'Возврат уже инициирован или завершен'
        });
    }
    
    // Получение OpKey
    const robokassaId = parseInt(invoice.robokassa_invoice_id);
    const statusResult = await robokassaService.checkOperationStatus(robokassaId);
    let opKey = statusResult.opKey || invoice.robokassa_invoice_id;
    
    // Получение детализации чека для возврата
    let invoiceItems = [];
    try {
        invoiceItems = await robokassaService.getInvoiceItemsForRefund(invoice.id);
        console.log('🧾 Получены InvoiceItems для возврата:', invoiceItems);
    } catch (error) {
        console.warn('⚠️ Не удалось получить InvoiceItems, продолжаем без детализации:', error);
    }

    // Создание возврата с детализацией
    const refundData: RobokassaRefundRequest = {
        OpKey: opKey,
        RefundSum: parseFloat(invoice.amount),
        InvoiceItems: invoiceItems.length > 0 ? invoiceItems : undefined
    };
    
    const refundResult = await robokassaService.createRefund(refundData);
    
    if (refundResult.success) {
        // Обновление БД
        await pool.query(`
            UPDATE invoices 
            SET refund_status = 'pending',
                refund_request_id = $1,
                refund_reason = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [refundResult.requestId, reason, invoice.id]);
        
        res.json({
            success: true,
            message: 'Возврат инициирован успешно',
            refundRequestId: refundResult.requestId
        });
    } else {
        res.status(400).json({
            success: false,
            error: refundResult.message || 'Ошибка инициирования возврата'
        });
    }
};
```

#### `getRefundJWT`
```typescript
export const getRefundJWT = async (req: AuthenticatedRequest, res: Response) => {
    const { invoiceId } = req.params;
    const userId = req.user?.userId;
    
    // Валидация счета
    const validationResult = await validateAndGetInvoiceData(invoiceId, userId!, req.user?.role || 'parent');
    
    if (!validationResult.success) {
        return res.status(validationResult.statusCode).json({
            success: false,
            error: validationResult.error
        });
    }
    
    const { invoice } = validationResult;
    
    // Получение OpKey
    const robokassaId = parseInt(invoice.robokassa_invoice_id);
    const statusResult = await robokassaService.checkOperationStatus(robokassaId);
    let opKey = statusResult.opKey || invoice.robokassa_invoice_id;
    
    // Получение детализации чека для JWT
    let invoiceItems = [];
    try {
        invoiceItems = await robokassaService.getInvoiceItemsForRefund(invoice.id);
        console.log('🧾 Получены InvoiceItems для JWT:', invoiceItems);
    } catch (error) {
        console.warn('⚠️ Не удалось получить InvoiceItems для JWT:', error);
    }

    // Создание данных для JWT с детализацией
    const refundData: RobokassaRefundRequest = {
        OpKey: opKey,
        RefundSum: parseFloat(invoice.amount),
        InvoiceItems: invoiceItems.length > 0 ? invoiceItems : undefined
    };
    
    // Генерация JWT токена
    const jwtToken = await robokassaService.createRefundJWT(refundData);
    
    res.json({
        success: true,
        jwtToken: jwtToken,
        payload: refundData
    });
};
```

#### `checkRefundStatus`
```typescript
export const checkRefundStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { invoiceId } = req.params;
    
    // Получение счета из БД
    const invoice = await getInvoiceById(invoiceId);
    
    if (!invoice.refund_request_id) {
        return res.status(400).json({
            success: false,
            error: 'Возврат не был инициирован'
        });
    }
    
    // Проверка статуса в Robokassa
    const statusResult = await robokassaService.getRefundStatus(invoice.refund_request_id);
    
    res.json({
        success: true,
        refundStatus: statusResult
    });
};
```

#### `validateAndGetInvoiceData` (вспомогательная функция)
```typescript
async function validateAndGetInvoiceData(
    invoiceId: string, 
    userId: string, 
    userRole: string
): Promise<ValidationResult> {
    // Получение счета из БД
    const invoice = await getInvoiceById(invoiceId);
    
    if (!invoice) {
        return {
            success: false,
            statusCode: 404,
            error: 'Счет не найден'
        };
    }
    
    // Проверка прав доступа
    if (userRole !== 'admin' && invoice.user_id !== userId) {
        return {
            success: false,
            statusCode: 403,
            error: 'Нет доступа к этому счету'
        };
    }
    
    return {
        success: true,
        invoice: invoice
    };
}
```

---

## Backend - Маршруты

### 3. `backend/src/routes/robokassa.ts`

**Назначение**: Определение API endpoints для возвратов.

```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    checkRefundAvailability,
    initiateRefund,
    getRefundJWT,
    checkRefundStatus
} from '../controllers/robokassaController.js';

const router = Router();

// Проверка возможности возврата
router.get('/invoices/:invoiceId/refund/check', 
    authenticateToken, 
    checkRefundAvailability
);

// Инициирование возврата
router.post('/invoices/:invoiceId/refund/initiate', 
    authenticateToken, 
    initiateRefund
);

// Получение JWT токена для отладки
router.get('/invoices/:invoiceId/refund/jwt', 
    authenticateToken, 
    getRefundJWT
);

// Проверка статуса возврата
router.get('/invoices/:invoiceId/refund/status', 
    authenticateToken, 
    checkRefundStatus
);

export default router;
```

**API Endpoints**:
- `GET /api/robokassa/invoices/:invoiceId/refund/check` - проверка возможности возврата
- `POST /api/robokassa/invoices/:invoiceId/refund/initiate` - инициирование возврата
- `GET /api/robokassa/invoices/:invoiceId/refund/jwt` - получение JWT для отладки
- `GET /api/robokassa/invoices/:invoiceId/refund/status` - проверка статуса возврата

---

## Backend - Типы

### 4. `backend/src/types/robokassa.ts`

**Назначение**: TypeScript интерфейсы для Robokassa API.

```typescript
// Запрос на возврат
export interface RobokassaRefundRequest {
    OpKey: string;           // Уникальный ID операции из Robokassa
    RefundSum?: number | string;  // Сумма возврата (decimal формат)
    InvoiceItems?: RobokassaRefundInvoiceItem[];  // Детализация возврата
}

// Детализация позиций возврата
export interface RobokassaRefundInvoiceItem {
    Name: string;            // Название позиции
    Quantity: number;        // Количество
    Cost: string;            // Стоимость (decimal формат "4.00")
    Tax: 'none' | 'vat0' | 'vat10' | 'vat18' | 'vat20';  // Налог
    PaymentMethod: 'full_payment' | 'pre_payment' | 'post_payment' | 'advance';  // Способ оплаты
    PaymentObject: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'another';  // Предмет расчета
}

// Ответ API возврата
export interface RobokassaRefundResponse {
    success: boolean;
    message?: string;
    requestId?: string;      // GUID заявки на возврат
}

// Статус возврата
export interface RobokassaRefundStatusResponse {
    requestId?: string;
    amount?: number;
    label?: 'finished' | 'processing' | 'canceled';
    message?: string;
}

// Конфигурация Robokassa
export interface RobokassaConfig {
    merchantLogin: string;
    password1: string;
    password2: string;
    password3?: string;      // Password3 для API возвратов
    testMode: boolean;
    resultUrl: string;
    successUrl: string;
    failUrl: string;
}

// Статус операции из XML API
export interface RobokassaOperationStatusResponse {
    success: boolean;
    opKey?: string;          // OpKey из OpStateExt
    message?: string;
}
```

---

## Frontend - API клиент

### 5. `src/lib/api/robokassa.ts`

**Назначение**: API клиент для работы с возвратами на фронтенде.

```typescript
import { api } from './index';

export const robokassaApi = {
    // Проверка возможности возврата
    checkRefundAvailability: async (invoiceId: string) => {
        return api<{
            success: boolean;
            canRefund: boolean;
            message?: string;
            invoice?: {
                id: string;
                amount: string;
                workshop_date: string;
            };
        }>(`/robokassa/invoices/${invoiceId}/refund/check`);
    },

    // Инициирование возврата
    initiateRefund: async (invoiceId: string) => {
        return api<{
            success: boolean;
            message?: string;
            refundRequestId?: string;
            error?: string;
        }>(`/robokassa/invoices/${invoiceId}/refund/initiate`, {
            method: 'POST'
        });
    },

    // Получение JWT для отладки
    getRefundJWT: async (invoiceId: string) => {
        return api<{
            success: boolean;
            jwtToken: string;
            payload: {
                OpKey: string;
                RefundSum: number | string;
                InvoiceItems?: Array<{
                    Name: string;
                    Quantity: number;
                    Cost: string;
                    Tax: string;
                    PaymentMethod: string;
                    PaymentObject: string;
                }>;
            };
        }>(`/robokassa/invoices/${invoiceId}/refund/jwt`);
    },

    // Проверка статуса возврата
    checkRefundStatus: async (invoiceId: string) => {
        return api<{
            success: boolean;
            refundStatus: {
                requestId: string;
                amount: number;
                label: 'finished' | 'processing' | 'canceled';
            };
        }>(`/robokassa/invoices/${invoiceId}/refund/status`);
    }
};
```

---

## Frontend - Компоненты

### 6. `src/pages/parent/Dashboard.tsx`

**Назначение**: Родительский дашборд с кнопками возврата.

**Функции возврата**:

```typescript
// Обработчик возврата
const handleRefund = async (workshopCard: WorkshopCardData, invoice: Invoice) => {
    try {
        // Проверка возможности возврата
        const checkResult = await robokassaApi.checkRefundAvailability(invoice.id);
        
        if (!checkResult.canRefund) {
            toast({
                title: "Возврат невозможен",
                description: checkResult.message || "Возврат возможен только за 3 часа до мастер-класса",
                variant: "destructive"
            });
            return;
        }

        // Подтверждение
        const confirmed = window.confirm(
            `Вы уверены, что хотите вернуть ${invoice.amount} руб. за мастер-класс "${workshopCard.title}"?\n\n` +
            `Возврат будет обработан в течение 1-3 рабочих дней.`
        );

        if (!confirmed) return;

        // Инициирование возврата
        const result = await robokassaApi.initiateRefund(invoice.id);
        
        if (result.success) {
            toast({
                title: "Возврат инициирован",
                description: `Заявка на возврат создана. ID: ${result.refundRequestId}`,
            });
            
            // Обновление данных
            refetchInvoices();
        } else {
            toast({
                title: "Ошибка возврата",
                description: result.error || "Не удалось инициировать возврат",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error('Ошибка при инициировании возврата:', error);
        toast({
            title: "Ошибка",
            description: "Произошла ошибка при возврате средств",
            variant: "destructive"
        });
    }
};

// Проверка возможности возврата для кнопки
const canRefundInvoice = (invoice: Invoice, workshopDate: Date): boolean => {
    if (invoice.status !== 'paid') return false;
    if (invoice.refund_status === 'pending' || invoice.refund_status === 'completed') return false;
    
    const now = new Date();
    const workshop = new Date(workshopDate);
    const hoursUntilWorkshop = (workshop.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilWorkshop >= 3;
};
```

**UI элементы**:
```tsx
{/* Кнопка возврата */}
{canRefundInvoice(invoice, workshopCard.date) && (
    <Button
        variant="destructive"
        size="sm"
        onClick={() => handleRefund(workshopCard, invoice)}
        disabled={isRefunding}
    >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Вернуть средства
    </Button>
)}

{/* Статус возврата */}
{invoice.refund_status === 'pending' && (
    <Badge variant="warning">
        Возврат в обработке
    </Badge>
)}

{invoice.refund_status === 'completed' && (
    <Badge variant="success">
        Возврат выполнен
    </Badge>
)}
```

---

## База данных

### 7. Поля для возвратов в таблице `invoices`

```sql
-- Поля возврата
refund_status VARCHAR(20) DEFAULT NULL,     -- pending, completed, cancelled
refund_request_id VARCHAR(100) DEFAULT NULL, -- GUID заявки от Robokassa
refund_reason TEXT DEFAULT NULL,             -- Причина возврата
refund_date TIMESTAMP DEFAULT NULL,          -- Дата возврата
```

**Возможные значения refund_status**:
- `NULL` - возврат не запрашивался
- `pending` - возврат в обработке
- `completed` - возврат завершен
- `cancelled` - возврат отменен

---

## Переменные окружения

### 8. `.env` файлы

**Backend** (`backend/.env`):
```env
# Robokassa настройки
ROBOKASSA_MERCHANT_LOGIN=waxhands
ROBOKASSA_PASSWORD_1=hzD0...       # Для генерации платежных ссылок
ROBOKASSA_PASSWORD_2=D4TW...       # Для проверки Result URL
ROBOKASSA_PASSWORD_3=your_pass3    # ДЛЯ API ВОЗВРАТОВ (ВАЖНО!)
ROBOKASSA_TEST_MODE=false
```

**⚠️ ВАЖНО**: `ROBOKASSA_PASSWORD_3` должен быть получен в ЛК Robokassa через заявку "Доступ к API возвратов".

---

## Документация Robokassa

### 9. `docs/robokassa/vozrat.md`

**Назначение**: Документация по API возвратов Robokassa.

**Ключевые моменты**:
1. **Метод**: POST
2. **URL**: `https://services.robokassa.ru/RefundService/Refund/Create`
3. **Content-Type**: `text/plain` (НЕ application/json!)
4. **Body**: JWT токен (не JSON!)
5. **Алгоритм**: HS256
6. **Ключ**: Password3 из ЛК магазина

**Формат JWT**:
```
Header: {"alg":"HS256","typ":"JWT"}
Payload: {
  "OpKey":"xxx",
  "RefundSum":"4.00",
  "InvoiceItems":[
    {
      "Name":"Стиль: Классический",
      "Quantity":1,
      "Cost":"2.00",
      "Tax":"none",
      "PaymentMethod":"full_payment",
      "PaymentObject":"service"
    }
  ]
}
```

**RefundSum** - ОБЯЗАТЕЛЬНО строка с decimal форматом ("4.00", а не 4)!  
**InvoiceItems** - детализация позиций возврата (стили и опции из БД)

---

## Типичные проблемы и решения

### Пустой ответ от Robokassa

**Причины**:
1. ❌ RefundSum передан как число (4) вместо строки ("4.00")
2. ❌ Неверный OpKey (должен быть из OpStateExt)
3. ❌ Неверный Password3 или подпись JWT
4. ❌ Лишние пробелы в JSON payload
5. ❌ Content-Type: application/jwt (Robokassa не принимает)

**Решения**:
1. ✅ Использовать `.toFixed(2)` для RefundSum
2. ✅ Получать OpKey через XML API (checkOperationStatus)
3. ✅ Проверить Password3 в .env
4. ✅ Использовать компактный JSON без пробелов
5. ✅ НЕ передавать Content-Type заголовок

### Как отладить

1. Получить JWT токен через `/api/robokassa/invoices/:id/refund/jwt`
2. Декодировать на jwt.io
3. Проверить payload (RefundSum должен быть "4.00")
4. Проверить подпись с Password3
5. Отправить через curl:
```bash
curl -X POST "https://services.robokassa.ru/RefundService/Refund/Create" \
     -H "Content-Type: text/plain" \
     -d "YOUR_JWT_TOKEN"
```

---

## Последнее обновление

**Дата**: 2025-10-01  
**Изменения**: 
- Исправлен формат RefundSum (строка "4.00" вместо числа 4)
- Добавлена детализация возврата с InvoiceItems
- Добавлена обработка selected_styles и selected_options из БД
- Добавлено детальное логирование данных счета
- Исправлена ошибка 415 Unsupported Media Type (убран Content-Type)
- Добавлен метод getInvoiceItemsForRefund для получения детализации чека
- Обновлены контроллеры для передачи InvoiceItems в JWT

