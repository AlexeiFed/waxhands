    async createRefund(refundData: RobokassaRefundRequest): Promise < RobokassaRefundResponse > {
    try {
        console.log('🔄 Создаем возврат в Robokassa:', refundData);

        // Проверяем наличие Password3
        if(!this.config.password3) {
    throw new Error('Password3 не настроен для API возвратов');
}

// Валидация обязательных полей
if (!refundData.OpKey) {
    throw new Error('OpKey обязателен для создания возврата');
}

// Форматируем сумму правильно согласно документации
const refundSum = typeof refundData.RefundSum === 'string'
    ? parseFloat(refundData.RefundSum)
    : refundData.RefundSum;

// Создаем payload согласно документации vozrat.md
const payload = {
    OpKey: refundData.OpKey,
    RefundSum: refundSum,
    InvoiceItems: refundData.InvoiceItems?.map(item => ({
        Name: item.Name,
        Quantity: item.Quantity,
        Cost: typeof item.Cost === 'string' ? parseFloat(item.Cost) : item.Cost,
        Tax: item.Tax || 'vat20',
        PaymentMethod: item.PaymentMethod || 'full_payment',
        PaymentObject: item.PaymentObject || 'payment'
    })) || []
};

console.log('🔍 Payload для возврата:', JSON.stringify(payload));

// Создаем JWT токен согласно документации vozrat.md
const header = {
    alg: 'HS256',
    typ: 'JWT'
};

// Кодируем header и payload в Base64Url
const encodedHeader = Buffer.from(JSON.stringify(header))
    .toString('base64url');

const encodedPayload = Buffer.from(JSON.stringify(payload))
    .toString('base64url');

// Создаем строку для подписи
const signatureString = `${encodedHeader}.${encodedPayload}`;

// Подпись согласно документации (HMAC-SHA256)
const signature = crypto.createHmac('sha256', this.config.password3)
    .update(signatureString)
    .digest('base64url');

const jwtToken = `${signatureString}.${signature}`;

console.log('🔐 JWT токен для возврата создан');

// Отправляем запрос к API возвратов Robokassa
const response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'WaxHands/1.0',
        'Accept': 'application/json'
    },
    body: jwtToken
});

console.log('📡 Статус ответа API возвратов:', response.status);

const responseText = await response.text();
console.log('📄 Ответ от Robokassa:', responseText);

// Обрабатываем пустой ответ
if (!responseText || responseText.trim() === '') {
    console.error('❌ Пустой ответ от Robokassa');
    return {
        success: false,
        message: 'Пустой ответ от Robokassa API'
    };
}

let result;
try {
    result = JSON.parse(responseText);
} catch (parseError) {
    console.error('❌ Ошибка парсинга ответа от Robokassa:', parseError);
    return {
        success: false,
        message: `Неверный формат ответа от Robokassa: ${responseText.substring(0, 200)}`
    };
}

// Анализируем ответ
if (response.status === 200) {
    if (result.success === true) {
        return {
            success: true,
            message: result.message || 'Возврат успешно создан',
            requestId: result.requestId
        };
    } else {
        return {
            success: false,
            message: result.message || 'Неизвестная ошибка возврата'
        };
    }
} else {
    return {
        success: false,
        message: `HTTP ${response.status}: ${result.message || responseText.substring(0, 200)}`
    };
}

        } catch (error) {
    console.error('❌ Ошибка при создании возврата:', error);
    return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
}
    }

