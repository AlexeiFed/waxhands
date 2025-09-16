/**
 * @file: yumoneyOAuthService.ts
 * @description: Сервис для OAuth2 авторизации и работы с API ЮMoney
 * @dependencies: axios, crypto, dotenv
 * @created: 2025-01-26
 */
import axios from 'axios';
import pool from '../database/connection.js';
export class YuMoneyOAuthService {
    clientId;
    clientSecret;
    accessToken = null;
    tokenExpiry = 0;
    constructor() {
        this.clientId = process.env.YUMONEY_CLIENT_ID || '';
        this.clientSecret = process.env.YUMONEY_CLIENT_SECRET || '';
        if (!this.clientId || !this.clientSecret) {
            console.error('❌ YUMONEY_CLIENT_ID или YUMONEY_CLIENT_SECRET не настроены');
        }
    }
    /**
     * Получает access token для API ЮMoney
     */
    async getAccessToken() {
        // Проверяем, не истек ли текущий токен
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            console.log('🔄 Получаем новый access token для ЮMoney...');
            const response = await axios.post('https://yoomoney.ru/oauth/token', {
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const tokenData = response.data;
            this.accessToken = tokenData.access_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // -1 минута для запаса
            console.log('✅ Access token получен для ЮMoney');
            return this.accessToken;
        }
        catch (error) {
            console.error('❌ Ошибка получения access token для ЮMoney:', error);
            throw new Error('Не удалось получить access token для ЮMoney');
        }
    }
    /**
     * Получает информацию о платеже по operation_id
     */
    async getPaymentInfo(operationId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios.get(`https://yoomoney.ru/api/v3/operations/${operationId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data && response.data.operation) {
                const operation = response.data.operation;
                return {
                    operation_id: operation.id,
                    status: this.mapStatus(operation.status),
                    amount: operation.amount,
                    currency: operation.currency,
                    label: operation.label,
                    sender: operation.sender,
                    datetime: operation.datetime
                };
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Ошибка получения информации о платеже ${operationId}:`, error);
            return null;
        }
    }
    /**
     * Создает платежную форму для счета
     */
    async createPaymentForm(invoiceId, amount, description) {
        try {
            // Используем существующий label из БД или создаем новый
            let label = '';
            // Получаем label из БД
            const result = await pool.query('SELECT payment_label FROM invoices WHERE id = $1', [invoiceId]);
            if (result.rows.length > 0 && result.rows[0].payment_label) {
                label = result.rows[0].payment_label;
                console.log(`✅ Используем существующий label из БД: ${label}`);
            }
            else {
                // Создаем новый label если нет в БД
                label = `INV-${invoiceId}-${Date.now()}`;
                console.log(`🆕 Создаем новый label: ${label}`);
            }
            // Формируем URL для платежной формы с ПРАВИЛЬНЫМ параметром label
            const paymentUrl = `https://yoomoney.ru/quickpay/button-widget?` +
                `receiver=41001123456789&` + // Замените на ваш номер кошелька
                `quickpay-form=button-widget&` +
                `target-name=${encodeURIComponent(description)}&` +
                `default-sum=${amount}&` +
                `button-text=12&` +
                `any-card-payment-type=on&` +
                `button-size=m&` +
                `button-color=orange&` +
                `successURL=${encodeURIComponent(`https://waxhands.ru/payment-success?invoice_id=${invoiceId}`)}&` +
                `quickpay-small=on&` +
                `label=${encodeURIComponent(label)}`; // ИСПРАВЛЕНО: используем label вместо account
            console.log(`✅ Платежная форма создана для счета ${invoiceId} с label: ${label}`);
            console.log(`🔗 URL формы: ${paymentUrl}`);
            return paymentUrl;
        }
        catch (error) {
            console.error(`❌ Ошибка создания платежной формы для счета ${invoiceId}:`, error);
            throw new Error('Не удалось создать платежную форму');
        }
    }
    /**
     * Проверяет статус платежа по метке
     */
    async checkPaymentByLabel(label) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios.get('https://yoomoney.ru/api/v3/operations', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    label: label,
                    from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Последние 24 часа
                    till: new Date().toISOString()
                }
            });
            if (response.data && response.data.operations && response.data.operations.length > 0) {
                const operation = response.data.operations[0]; // Берем последний платеж
                return {
                    operation_id: operation.id,
                    status: this.mapStatus(operation.status),
                    amount: operation.amount,
                    currency: operation.currency,
                    label: operation.label,
                    sender: operation.sender,
                    datetime: operation.datetime
                };
            }
            return null;
        }
        catch (error) {
            console.error(`❌ Ошибка проверки платежа по метке ${label}:`, error);
            return null;
        }
    }
    /**
     * Маппинг статуса платежа ЮMoney в наш формат
     */
    mapStatus(yumoneyStatus) {
        switch (yumoneyStatus) {
            case 'success':
            case 'completed':
                return 'success';
            case 'pending':
            case 'processing':
                return 'pending';
            case 'failed':
            case 'cancelled':
            default:
                return 'failed';
        }
    }
    /**
     * Проверяет доступность API ЮMoney
     */
    async checkApiHealth() {
        try {
            const accessToken = await this.getAccessToken();
            return !!accessToken;
        }
        catch (error) {
            return false;
        }
    }
}
export default new YuMoneyOAuthService();
//# sourceMappingURL=yumoneyOAuthService.js.map