/**
 * @file: paymentService.ts
 * @description: Сервис для обработки платежей и обновления счетов
 * @dependencies: database connection, types
 * @created: 2025-01-26
 */
export interface PaymentData {
    invoiceId: string;
    paymentId: string;
    amount: string;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    sender?: string;
    operationId: string;
    label?: string;
}
export interface PaymentResult {
    success: boolean;
    message: string;
    invoiceId?: string;
    paymentId?: string;
    error?: string;
}
/**
 * Обновляет статус счета и связанные данные в базе данных
 */
export declare const updateInvoicePaymentStatus: (paymentData: PaymentData) => Promise<PaymentResult>;
/**
 * Находит счет по метке платежа или отправителю
 */
export declare const findInvoiceByLabel: (label: string) => Promise<string | null>;
/**
 * Находит счет по отправителю
 */
export declare const findInvoiceBySender: (sender: string) => Promise<string | null>;
//# sourceMappingURL=paymentService.d.ts.map