/**
 * @file: PaymentFactory.ts
 * @description: Фабрика для платежного провайдера Robokassa
 * @dependencies: IPaymentProvider, RobokassaProvider
 * @created: 2025-10-16
 */

import { IPaymentProvider } from './interfaces/IPaymentProvider.js';
import { RobokassaProvider } from './providers/RobokassaProvider.js';

/**
 * Фабрика платежных провайдеров (только Robokassa)
 */
export class PaymentFactory {
    private static instance: PaymentFactory;
    private currentProvider: IPaymentProvider;

    private constructor() {
        // Всегда используем Robokassa
        this.currentProvider = new RobokassaProvider();
        console.log(`🏪 PaymentFactory: Используется провайдер ${this.currentProvider.providerName}`);
    }

    /**
     * Получает единственный экземпляр фабрики (Singleton)
     */
    public static getInstance(): PaymentFactory {
        if (!PaymentFactory.instance) {
            PaymentFactory.instance = new PaymentFactory();
        }
        return PaymentFactory.instance;
    }

    /**
     * Получает текущий платежный провайдер (всегда Robokassa)
     */
    public getProvider(): IPaymentProvider {
        return this.currentProvider;
    }

    /**
     * Получает Robokassa провайдер
     */
    public getRobokassaProvider(): RobokassaProvider {
        return this.currentProvider as RobokassaProvider;
    }
}

/**
 * Экспортируем единственный экземпляр фабрики
 */
export const paymentFactory = PaymentFactory.getInstance();

/**
 * Вспомогательная функция для получения текущего провайдера
 */
export function getPaymentProvider(): IPaymentProvider {
    return paymentFactory.getProvider();
}


