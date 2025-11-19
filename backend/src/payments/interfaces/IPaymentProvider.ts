/**
 * @file: IPaymentProvider.ts
 * @description: Интерфейс для платежных провайдеров (Robokassa, FreeKassa и др.)
 * @dependencies: types/index.ts
 * @created: 2025-10-16
 */

/**
 * Общие типы для всех платежных систем
 */
export interface PaymentInvoiceData {
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
    userEmail?: string;
    notes?: string;
    nomenclature_code?: string;
}

export interface PaymentInvoiceResponse {
    success: boolean;
    invoiceUrl?: string;
    paymentUrl?: string;
    method?: string;
    invoiceId?: string;
    formData?: Record<string, string>;
    error?: string;
}

export interface PaymentNotification {
    invoiceId: string;
    amount: string;
    signature: string;
    transactionId?: string;
    [key: string]: string | undefined;
}

export interface PaymentRefundRequest {
    opKey: string;
    refundSum: number;
    invoiceItems?: Array<{
        name: string;
        quantity: number;
        cost: number;
        tax: string;
        paymentMethod: string;
        paymentObject: string;
    }>;
}

export interface PaymentRefundResponse {
    success: boolean;
    message?: string;
    requestId?: string;
    error?: string;
}

export interface PaymentRefundStatus {
    requestId: string;
    amount: number;
    status: string;
}

/**
 * Интерфейс платежного провайдера
 * Все провайдеры (Robokassa, FreeKassa и др.) должны реализовывать этот интерфейс
 */
export interface IPaymentProvider {
    /**
     * Название провайдера для логирования
     */
    readonly providerName: string;

    /**
     * Создает счет на оплату
     */
    createInvoice(data: PaymentInvoiceData): Promise<PaymentInvoiceResponse>;

    /**
     * Проверяет подпись уведомления о платеже (ResultURL)
     */
    verifyNotification(notification: PaymentNotification): boolean;

    /**
     * Проверяет подпись уведомления об успешной оплате (SuccessURL)
     */
    verifySuccessNotification(notification: PaymentNotification): boolean;

    /**
     * Создает возврат средств (опционально, если провайдер поддерживает)
     */
    createRefund?(data: PaymentRefundRequest): Promise<PaymentRefundResponse>;

    /**
     * Получает статус возврата (опционально, если провайдер поддерживает)
     */
    getRefundStatus?(requestId: string): Promise<PaymentRefundStatus | null>;

    /**
     * Проверяет возможность возврата для даты мастер-класса
     */
    isRefundAvailable(workshopDate: string): boolean;

    /**
     * Проверяет, доступна ли оплата для пользователя
     */
    isPaymentAvailable(userData: { surname?: string; phone?: string }): boolean;

    /**
     * Получает OpKey для возврата (специфично для некоторых провайдеров)
     */
    getOpKeyForRefund?(invoiceId: string): Promise<string | null>;
}


