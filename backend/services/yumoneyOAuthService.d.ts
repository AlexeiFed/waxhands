/**
 * @file: yumoneyOAuthService.ts
 * @description: Сервис для OAuth2 авторизации и работы с API ЮMoney
 * @dependencies: axios, crypto, dotenv
 * @created: 2025-01-26
 */
interface YuMoneyPaymentInfo {
    operation_id: string;
    status: 'success' | 'pending' | 'failed';
    amount: string;
    currency: string;
    label?: string;
    sender?: string;
    datetime: string;
}
export declare class YuMoneyOAuthService {
    private clientId;
    private clientSecret;
    private accessToken;
    private tokenExpiry;
    constructor();
    /**
     * Получает access token для API ЮMoney
     */
    private getAccessToken;
    /**
     * Получает информацию о платеже по operation_id
     */
    getPaymentInfo(operationId: string): Promise<YuMoneyPaymentInfo | null>;
    /**
     * Создает платежную форму для счета
     */
    createPaymentForm(invoiceId: string, amount: number, description: string): Promise<string>;
    /**
     * Проверяет статус платежа по метке
     */
    checkPaymentByLabel(label: string): Promise<YuMoneyPaymentInfo | null>;
    /**
     * Маппинг статуса платежа ЮMoney в наш формат
     */
    private mapStatus;
    /**
     * Проверяет доступность API ЮMoney
     */
    checkApiHealth(): Promise<boolean>;
}
declare const _default: YuMoneyOAuthService;
export default _default;
//# sourceMappingURL=yumoneyOAuthService.d.ts.map