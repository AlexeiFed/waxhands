/**
 * @file: robokassa.ts
 * @description: Типы для интеграции с Robokassa
 * @dependencies: types/index.ts
 * @created: 2025-01-26
 */
export interface RobokassaJWTHeader {
    typ: 'JWT';
    alg: 'MD5' | 'RIPEMD160' | 'SHA1' | 'HS1' | 'SHA256' | 'HS256' | 'SHA384' | 'HS384' | 'SHA512' | 'HS512';
}
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
export interface RobokassaInvoiceItem {
    Name: string;
    Quantity: number;
    Cost: number;
    Tax: 'none' | 'vat0' | 'vat5' | 'vat7' | 'vat10' | 'vat20' | 'vat110' | 'vat120' | 'vat105' | 'vat107';
    PaymentMethod: 'full_prepayment' | 'prepayment' | 'advance' | 'full_payment' | 'partial_payment' | 'credit' | 'credit_payment';
    PaymentObject: 'commodity' | 'excise' | 'job' | 'service' | 'gambling_bet' | 'gambling_prize' | 'lottery' | 'lottery_prize' | 'intellectual_activity' | 'payment' | 'agent_commission' | 'composite' | 'resort_fee' | 'another' | 'property_right' | 'non-operating_gain' | 'insurance_premium' | 'sales_tax';
    NomenclatureCode?: string;
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
export interface RobokassaResultNotification {
    OutSum: string;
    InvId: string;
    Fee?: string;
    EMail?: string;
    SignatureValue: string;
    PaymentMethod?: string;
    IncCurrLabel?: string;
    [key: string]: string | undefined;
}
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
export interface RobokassaRefundRequest {
    OpKey: string;
    RefundSum?: number;
    InvoiceItems?: RobokassaInvoiceItem[];
}
export interface RobokassaRefundResponse {
    success: boolean;
    message?: string;
    requestId?: string;
}
export interface RobokassaRefundStatus {
    requestId: string;
    amount: number;
    label: 'finished' | 'processing' | 'canceled';
}
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
export interface CreateRobokassaInvoiceData {
    invoiceId: string;
    amount: number;
    description: string;
    participantName: string;
    masterClassName: string;
    selectedStyles: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    selectedOptions: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    workshopDate: string;
    city: string;
    schoolName: string;
    classGroup: string;
    userEmail?: string;
    notes?: string;
}
//# sourceMappingURL=robokassa.d.ts.map