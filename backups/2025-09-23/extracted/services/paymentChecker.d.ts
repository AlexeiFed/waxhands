/**
 * @file: paymentChecker.ts
 * @description: Сервис для автоматической проверки платежей через OAuth2 API ЮMoney
 * @dependencies: yumoneyOAuthService, paymentService
 * @created: 2025-01-27
 */
interface PaymentCheckResult {
    success: boolean;
    message: string;
    checkedInvoices: number;
    updatedInvoices: number;
}
export declare class PaymentChecker {
    private isRunning;
    private checkInterval;
    /**
     * Запускает автоматическую проверку платежей
     */
    startPeriodicCheck(): Promise<void>;
    /**
     * Останавливает автоматическую проверку
     */
    stopPeriodicCheck(): void;
    /**
     * Проверяет все pending счета
     */
    checkAllPendingPayments(): Promise<PaymentCheckResult>;
    /**
     * Проверяет конкретный счет по ID
     */
    checkInvoicePayment(invoiceId: string): Promise<PaymentCheckResult>;
}
declare const _default: PaymentChecker;
export default _default;
//# sourceMappingURL=paymentChecker.d.ts.map