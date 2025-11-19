/**
 * @file: robokassa.ts
 * @description: Типы для интеграции с Robokassa
 * @dependencies: types/index.ts
 * @created: 2025-01-26
 */

// JWT Header для Robokassa
export interface RobokassaJWTHeader {
    typ: 'JWT';
    alg: 'MD5' | 'RIPEMD160' | 'SHA1' | 'HS1' | 'SHA256' | 'HS256' | 'SHA384' | 'HS384' | 'SHA512' | 'HS512';
}

// JWT Payload для создания счета
export interface RobokassaJWTPayload {
    MerchantLogin: string;
    InvoiceType: 'OneTime' | 'Reusable';
    Culture: 'ru' | 'en';
    InvId: number;
    OutSum: number;
    Description: string;
    MerchantComments?: string;
    UserFields?: Record<string, string>;
    InvoiceItems: RobokassaInvoiceItem[];
    SuccessUrl2Data?: {
        Url: string;
        Method: 'GET' | 'POST';
    };
    FailUrl2Data?: {
        Url: string;
        Method: 'GET' | 'POST';
    };
}

// Позиция в счете Robokassa
export interface RobokassaInvoiceItem {
    Name: string;
    Quantity: number;
    Cost: number;
    Tax: 'none' | 'vat0' | 'vat5' | 'vat7' | 'vat10' | 'vat20' | 'vat110' | 'vat120' | 'vat105' | 'vat107';
    PaymentMethod: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment';
    PaymentObject: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'resort_fee' | 'another' | 'property_right' | 'non-operating_gain' | 'insurance_premium' | 'sales_tax';
    NomenclatureCode?: string;
}

// Позиция для возврата согласно документации vozrat.md
export interface RobokassaRefundInvoiceItem {
    Name: string;
    Quantity: number;
    Cost: number; // Robokassa требует числа, а не строки
    Tax: 'none' | 'vat0' | 'vat5' | 'vat7' | 'vat10' | 'vat20' | 'vat110' | 'vat120' | 'vat105' | 'vat107';
    PaymentMethod: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment'; // ДОЛЖНО СОВПАДАТЬ с PaymentMethod при создании счета
    PaymentObject: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'resort_fee' | 'another' | 'property_right' | 'non-operating_gain' | 'insurance_premium' | 'sales_tax';
}

// Ответ от Robokassa при создании счета
export interface RobokassaCreateInvoiceResponse {
    success: boolean;
    invoiceUrl?: string;
    paymentUrl?: string; // URL для POST формы оплаты
    method?: string; // Метод оплаты (GET/POST)
    invoiceId?: string;
    formData?: {
        MerchantLogin: string;
        OutSum: string;
        InvoiceID: string;
        InvId: string; // Добавляем для совместимости с фронтендом
        Receipt?: string; // Временно делаем опциональным для тестирования без фискализации
        Description: string;
        SignatureValue: string;
        Culture: string;
        Encoding: string;
        Shp_invoice_id?: string;
        Shp_participant?: string;
    };
    error?: string;
}

// Уведомление от Robokassa (ResultURL)
export interface RobokassaResultNotification {
    OutSum: string;
    InvId: string;
    Fee?: string;
    EMail?: string;
    SignatureValue: string;
    PaymentMethod?: string;
    IncCurrLabel?: string;
    [key: string]: string | undefined; // для Shp_ параметров
}

// JWS уведомление от Robokassa (ResultURL2)
export interface RobokassaJWSNotification {
    header: {
        type: 'PaymentStateNotification';
        version: string;
        timestamp: string;
    };
    data: {
        shop: string;
        opKey: string;
        invId: string;
        paymentMethod: string;
        incSum: string;
        state: 'OK' | 'ERROR';
    };
}

// Запрос на возврат
export interface RobokassaRefundRequest {
    OpKey: string;
    RefundSum?: number; // Robokassa требует числа, а не строки
    InvoiceItems?: RobokassaRefundInvoiceItem[];
}

// Ответ на запрос возврата
export interface RobokassaRefundResponse {
    success: boolean;
    message?: string;
    requestId?: string;
    error?: string;
}

// Статус возврата
export interface RobokassaRefundStatus {
    requestId: string;
    amount: number;
    label: 'finished' | 'processing' | 'canceled';
}

// Конфигурация Robokassa
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

// Данные для создания счета
export interface CreateRobokassaInvoiceData {
    invoiceId: string;
    amount: number;
    description: string;
    participantName: string;
    masterClassName: string;
    selectedStyles: Array<{ id: string; name: string; price: number; nomenclature_code?: string }>;
    selectedOptions: Array<{ id: string; name: string; price: number; nomenclature_code?: string }>;
    workshopDate: string;
    city: string;
    schoolName: string;
    classGroup: string;
    userEmail?: string; // Email пользователя для JWT API
    notes?: string;
    nomenclature_code?: string; // Номенклатура товара для основного мастер-класса
}
