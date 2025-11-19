/**
 * @file: RobokassaProvider.ts
 * @description: Адаптер для RobokassaService, реализующий интерфейс IPaymentProvider
 * @dependencies: IPaymentProvider, RobokassaService
 * @created: 2025-10-16
 */

import { RobokassaService } from '../../services/robokassaService.js';
import {
    IPaymentProvider,
    PaymentInvoiceData,
    PaymentInvoiceResponse,
    PaymentNotification,
    PaymentRefundRequest,
    PaymentRefundResponse,
    PaymentRefundStatus
} from '../interfaces/IPaymentProvider.js';
import {
    CreateRobokassaInvoiceData,
    RobokassaResultNotification,
    RobokassaRefundRequest
} from '../../types/robokassa.js';

/**
 * Адаптер для RobokassaService
 * Преобразует общие типы IPaymentProvider в специфичные типы Robokassa
 */
export class RobokassaProvider implements IPaymentProvider {
    readonly providerName = 'Robokassa';
    private robokassaService: RobokassaService;

    constructor() {
        this.robokassaService = new RobokassaService();
    }

    /**
     * Преобразует PaymentInvoiceData в CreateRobokassaInvoiceData
     */
    private mapToRobokassaData(data: PaymentInvoiceData): CreateRobokassaInvoiceData {
        return {
            invoiceId: data.invoiceId,
            amount: data.amount,
            description: data.description,
            participantName: data.participantName,
            masterClassName: data.masterClassName,
            selectedStyles: data.selectedStyles,
            selectedOptions: data.selectedOptions,
            workshopDate: data.workshopDate,
            city: data.city,
            schoolName: data.schoolName,
            classGroup: data.classGroup,
            userEmail: data.userEmail,
            notes: data.notes,
            nomenclature_code: data.nomenclature_code
        };
    }

    /**
     * Создает счет на оплату через Robokassa (JWT API с UUID ссылкой)
     */
    async createInvoice(data: PaymentInvoiceData): Promise<PaymentInvoiceResponse> {
        const robokassaData = this.mapToRobokassaData(data);
        const result = await this.robokassaService.createInvoiceJWT(robokassaData);

        return {
            success: result.success,
            invoiceUrl: result.invoiceUrl,
            paymentUrl: result.paymentUrl,
            method: result.method,
            invoiceId: result.invoiceId,
            formData: result.formData as unknown as Record<string, string>,
            error: result.error
        };
    }

    /**
     * Проверяет подпись уведомления от Robokassa (ResultURL)
     */
    verifyNotification(notification: PaymentNotification): boolean {
        // Преобразуем PaymentNotification в RobokassaResultNotification
        const robokassaNotification: RobokassaResultNotification = {
            OutSum: notification.amount,
            InvId: notification.invoiceId,
            SignatureValue: notification.signature,
            ...notification
        };

        return this.robokassaService.verifyResultSignature(robokassaNotification);
    }

    /**
     * Проверяет подпись уведомления об успешной оплате (SuccessURL)
     */
    verifySuccessNotification(notification: PaymentNotification): boolean {
        const robokassaNotification = {
            OutSum: notification.amount,
            InvId: notification.invoiceId,
            SignatureValue: notification.signature,
            ...notification
        };

        return this.robokassaService.verifySuccessSignature(robokassaNotification);
    }

    /**
     * Создает возврат средств через Robokassa
     */
    async createRefund(data: PaymentRefundRequest): Promise<PaymentRefundResponse> {
        // Преобразуем PaymentRefundRequest в RobokassaRefundRequest
        const robokassaRefundData: RobokassaRefundRequest = {
            OpKey: data.opKey,
            RefundSum: data.refundSum,
            InvoiceItems: data.invoiceItems?.map(item => ({
                Name: item.name,
                Quantity: item.quantity,
                Cost: item.cost,
                Tax: item.tax as 'none',
                PaymentMethod: item.paymentMethod as 'full_payment',
                PaymentObject: item.paymentObject as 'service'
            }))
        };

        const result = await this.robokassaService.createRefund(robokassaRefundData);

        return {
            success: result.success,
            message: result.message,
            requestId: result.requestId,
            error: result.error
        };
    }

    /**
     * Получает статус возврата через Robokassa
     */
    async getRefundStatus(requestId: string): Promise<PaymentRefundStatus | null> {
        const result = await this.robokassaService.getRefundStatus(requestId);

        if (!result) {
            return null;
        }

        return {
            requestId: result.requestId,
            amount: result.amount,
            status: result.label
        };
    }

    /**
     * Проверяет возможность возврата для даты мастер-класса
     */
    isRefundAvailable(workshopDate: string): boolean {
        return this.robokassaService.isRefundAvailable(workshopDate);
    }

    /**
     * Проверяет, доступна ли оплата для пользователя
     */
    isPaymentAvailable(userData: { surname?: string; phone?: string }): boolean {
        return this.robokassaService.isPaymentAvailableForUser(userData);
    }

    /**
     * Получает OpKey для возврата через Robokassa XML API
     */
    async getOpKeyForRefund(invoiceId: string): Promise<string | null> {
        try {
            const robokassaId = parseInt(invoiceId);
            if (isNaN(robokassaId)) {
                return null;
            }

            const statusResult = await this.robokassaService.checkOperationStatus(robokassaId);

            if (statusResult.success && statusResult.opKey) {
                return statusResult.opKey;
            }

            return null;
        } catch (error) {
            console.error('❌ Ошибка получения OpKey:', error);
            return null;
        }
    }

    /**
     * Получает сам экземпляр RobokassaService для специфичных операций
     * (используется для обратной совместимости)
     */
    getRobokassaService(): RobokassaService {
        return this.robokassaService;
    }
}

export const robokassaProvider = new RobokassaProvider();


