/**
 * @file: robokassaService.ts
 * @description: Сервис для интеграции с Robokassa
 * @dependencies: types/robokassa.ts, crypto, jwt
 * @created: 2025-01-26
 */
import { RobokassaInvoiceItem, RobokassaCreateInvoiceResponse, RobokassaResultNotification, RobokassaJWSNotification, RobokassaRefundRequest, RobokassaRefundResponse, RobokassaRefundStatus, CreateRobokassaInvoiceData } from '../types/robokassa.js';
export declare class RobokassaService {
    private config;
    constructor();
    /**
     * Создает JWT токен для Robokassa API согласно документации
     */
    private createJWTToken;
    /**
     * Создает JWT подпись согласно документации Robokassa
     */
    private createJWTSignature;
    /**
     * Создает подпись для строки (MD5 для Robokassa, HMAC для JWT)
     */
    private createSignature;
    /**
     * Кодирует строку в Base64Url
     */
    private base64UrlEncode;
    /**
     * Декодирует Base64Url строку
     */
    private base64UrlDecode;
    /**
     * Создает фискальный чек для Robokassa согласно документации
     */
    private createReceipt;
    /**
     * Создает URL-кодированную строку для Receipt
     */
    private createReceiptUrlEncoded;
    /**
     * Создает счет через JWT API (рекомендуемый метод)
     */
    createInvoiceJWT(data: CreateRobokassaInvoiceData): Promise<RobokassaCreateInvoiceResponse>;
    /**
     * Создает счет в Robokassa с правильной фискализацией (классический метод)
     */
    createInvoice(data: CreateRobokassaInvoiceData): Promise<RobokassaCreateInvoiceResponse>;
    /**
     * Проверяет подпись уведомления от Robokassa (ResultURL)
     */
    verifyResultSignature(notification: RobokassaResultNotification): boolean;
    /**
     * Проверяет подпись уведомления SuccessURL (возврат пользователя после оплаты)
     */
    verifySuccessSignature(notification: {
        OutSum: string;
        InvId: string;
        SignatureValue: string;
        [key: string]: string;
    }): boolean;
    /**
     * Проверяет подпись JWS уведомления согласно документации Robokassa
     * JWS токен подписывается RSA256 сертификатом Robokassa
     * Проверка подписи не является обязательной согласно документации
     */
    verifyJWSNotification(jwsToken: string): RobokassaJWSNotification | null;
    /**
     * Инициирует возврат средств
     */
    createRefund(refundData: RobokassaRefundRequest): Promise<RobokassaRefundResponse>;
    /**
     * Получает статус возврата
     */
    getRefundStatus(requestId: string): Promise<RobokassaRefundStatus | null>;
    /**
     * Проверяет статус операции через XML API
     */
    checkOperationStatus(invoiceId: number): Promise<{
        success: boolean;
        status?: number;
        description?: string | undefined;
        opKey?: string | undefined;
        outSum?: number | undefined;
        error?: string;
    }>;
    /**
     * Создает данные для iframe оплаты (открытие в новом окне)
     */
    createIframePaymentData(data: CreateRobokassaInvoiceData): {
        success: boolean;
        iframeData?: {
            merchantLogin: string;
            outSum: string;
            invId: string;
            description: string;
            receipt: string;
            signatureValue: string;
            culture: string;
            encoding: string;
            isTest?: string;
        };
        error?: string;
    };
    /**
     * Создает второй чек для предоплаты (итоговый чек после оказания услуги)
     * Согласно документации Robokassa для ФЗ-54
     */
    createSecondReceipt(data: {
        merchantId: string;
        id: string;
        originId: string;
        total: number;
        items: RobokassaInvoiceItem[];
        clientEmail?: string;
        clientPhone?: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Получает статус второго чека
     */
    getSecondReceiptStatus(data: {
        merchantId: string;
        id: string;
    }): Promise<{
        success: boolean;
        status?: string;
        description?: string;
        error?: string;
    }>;
    /**
     * Проверяет, доступна ли оплата для пользователя
     */
    isPaymentAvailableForUser(userData: {
        surname?: string;
        phone?: string;
    }): boolean;
}
export declare const robokassaService: RobokassaService;
//# sourceMappingURL=robokassaService.d.ts.map