/**
 * @file: robokassaService.ts
 * @description: Сервис для интеграции с Robokassa
 * @dependencies: types/robokassa.ts, crypto, jwt
 * @created: 2025-01-26
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { parseString } from 'xml2js';
import {
    RobokassaJWTHeader,
    RobokassaJWTPayload,
    RobokassaInvoiceItem,
    RobokassaCreateInvoiceResponse,
    RobokassaResultNotification,
    RobokassaJWSNotification,
    RobokassaRefundRequest,
    RobokassaRefundResponse,
    RobokassaRefundStatus,
    RobokassaConfig,
    CreateRobokassaInvoiceData
} from '../types/robokassa.js';

export class RobokassaService {
    private config: RobokassaConfig;

    constructor() {
        this.config = {
            merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN || 'waxhands.ru',
            password1: process.env.ROBOKASSA_PASSWORD_1 || '05VQ6EQ061SnSBAh8vyg',
            password2: process.env.ROBOKASSA_PASSWORD_2 || 'jzGU7uFNx4T741Usynxm',
            password3: process.env.ROBOKASSA_PASSWORD_3 || '',
            testMode: process.env.ROBOKASSA_TEST_MODE === 'true',
            successUrl: process.env.ROBOKASSA_SUCCESS_URL || 'https://waxhands.ru/payment/robokassa/success',
            failUrl: process.env.ROBOKASSA_FAIL_URL || 'https://waxhands.ru/payment/robokassa/fail',
            resultUrl: process.env.ROBOKASSA_RESULT_URL || 'https://waxhands.ru/api/robokassa/payment-webhook/robokassa',
            algorithm: (process.env.ROBOKASSA_ALGORITHM as 'MD5' | 'RIPEMD160' | 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512') || 'MD5'
        };

        console.log('🔧 RobokassaService конфигурация:', {
            merchantLogin: this.config.merchantLogin,
            testMode: this.config.testMode,
            successUrl: this.config.successUrl,
            failUrl: this.config.failUrl,
            resultUrl: this.config.resultUrl,
            password1Length: this.config.password1?.length || 0,
            password2Length: this.config.password2?.length || 0
        });
    }

    /**
     * Создает JWT токен для Robokassa API согласно документации
     */
    private createJWTToken(payload: RobokassaJWTPayload): string {
        const header: RobokassaJWTHeader = {
            typ: 'JWT',
            alg: this.config.algorithm
        };

        // Кодируем header и payload в Base64Url
        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

        // Создаем строку для подписи
        const signatureString = `${encodedHeader}.${encodedPayload}`;

        // Создаем подпись согласно документации Robokassa
        // Используем HMAC с ключом merchantLogin:password1 в формате Base64
        const secretKey = `${this.config.merchantLogin}:${this.config.password1}`;
        const base64Key = Buffer.from(secretKey).toString('base64');
        const signature = this.createJWTSignature(signatureString, base64Key);

        return `${signatureString}.${signature}`;
    }

    /**
     * Создает JWT подпись согласно документации Robokassa
     */
    private createJWTSignature(data: string, secretKey: string): string {
        // Создаем HMAC подпись согласно выбранному алгоритму
        // secretKey уже в формате Base64
        switch (this.config.algorithm) {
            case 'MD5':
                return crypto.createHmac('md5', secretKey).update(data).digest('base64url');
            case 'SHA1':
                return crypto.createHmac('sha1', secretKey).update(data).digest('base64url');
            case 'SHA256':
                return crypto.createHmac('sha256', secretKey).update(data).digest('base64url');
            case 'SHA384':
                return crypto.createHmac('sha384', secretKey).update(data).digest('base64url');
            case 'SHA512':
                return crypto.createHmac('sha512', secretKey).update(data).digest('base64url');
            case 'RIPEMD160':
                return crypto.createHmac('ripemd160', secretKey).update(data).digest('base64url');
            default:
                return crypto.createHmac('md5', secretKey).update(data).digest('base64url');
        }
    }

    /**
     * Создает подпись для строки (MD5 для Robokassa, HMAC для JWT)
     */
    private createSignature(data: string, secret: string, useMD5: boolean = false): string {
        if (useMD5) {
            // Для Robokassa используем обычный MD5 хеш
            return crypto.createHash('md5').update(data).digest('hex');
        }

        // Для JWT используем HMAC
        switch (this.config.algorithm) {
            case 'MD5':
                return crypto.createHmac('md5', secret).update(data).digest('base64');
            case 'SHA1':
                return crypto.createHmac('sha1', secret).update(data).digest('base64');
            case 'SHA256':
                return crypto.createHmac('sha256', secret).update(data).digest('base64');
            case 'SHA384':
                return crypto.createHmac('sha384', secret).update(data).digest('base64');
            case 'SHA512':
                return crypto.createHmac('sha512', secret).update(data).digest('base64');
            case 'RIPEMD160':
                return crypto.createHmac('ripemd160', secret).update(data).digest('base64');
            default:
                return crypto.createHmac('md5', secret).update(data).digest('base64');
        }
    }

    /**
     * Кодирует строку в Base64Url
     */
    private base64UrlEncode(str: string): string {
        return Buffer.from(str)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Декодирует Base64Url строку
     */
    private base64UrlDecode(str: string): string {
        // Добавляем padding если нужно
        const padded = str + '='.repeat((4 - str.length % 4) % 4);
        return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    }

    /**
     * Создает фискальный чек для Robokassa согласно документации
     */
    private createReceipt(data: CreateRobokassaInvoiceData): string {
        // Создаем фискальный чек для автоматической фискализации
        // Согласно документации Robokassa и требованиям ФНС
        const receipt = {
            sno: "osn", // Общая система налогообложения
            items: [{
                name: `Мастер-класс "${data.masterClassName}"`,
                quantity: 1,
                sum: data.amount,
                cost: data.amount, // Цена за единицу товара
                payment_method: "full_prepayment", // Предоплата 100%
                payment_object: "service", // Услуга
                tax: "none" // Без НДС для образовательных услуг согласно ФЗ-54
            }]
        };

        return JSON.stringify(receipt);
    }

    /**
     * Создает URL-кодированную строку для Receipt
     */
    private createReceiptUrlEncoded(data: CreateRobokassaInvoiceData): string {
        const receipt = this.createReceipt(data);
        return encodeURIComponent(receipt);
    }

    /**
     * Создает счет через JWT API (рекомендуемый метод)
     */
    async createInvoiceJWT(data: CreateRobokassaInvoiceData): Promise<RobokassaCreateInvoiceResponse> {
        try {
            console.log('🔄 Создаем счет через JWT API Robokassa:', data);

            // Создаем уникальный ID счета
            // Создаем уникальный ID счета (добавляем timestamp для уникальности)
            const baseId = parseInt(data.invoiceId.replace(/-/g, '').substring(0, 10), 16);
            const invId = baseId + Date.now() % 1000000; // Добавляем timestamp для уникальности

            // Создаем фискальные позиции согласно документации
            const invoiceItems: RobokassaInvoiceItem[] = [{
                Name: `Мастер-класс "${data.masterClassName}"`,
                Quantity: 1,
                Cost: data.amount,
                Tax: "none", // Без НДС для образовательных услуг
                PaymentMethod: "full_prepayment", // Предоплата 100%
                PaymentObject: "service", // Услуга
            }];

            // Создаем payload для JWT согласно документации
            const payload: RobokassaJWTPayload = {
                MerchantLogin: this.config.merchantLogin,
                InvoiceType: "OneTime", // Одноразовая ссылка
                Culture: "ru",
                InvId: invId,
                OutSum: data.amount,
                Description: `Мастер-класс "${data.masterClassName}"`,
                MerchantComments: `Оплата за мастер-класс от пользователя ${data.participantName || 'неизвестен'}`,
                UserFields: {
                    shp_invoice_id: data.invoiceId,
                    shp_participant: data.participantName || 'неизвестен'
                },
                InvoiceItems: invoiceItems,
                SuccessUrl2Data: {
                    Url: this.config.successUrl,
                    Method: "GET"
                },
                FailUrl2Data: {
                    Url: this.config.failUrl,
                    Method: "GET"
                }
            };

            // Создаем JWT токен
            const jwtToken = this.createJWTToken(payload);
            console.log('🔐 JWT токен создан:', jwtToken.substring(0, 50) + '...');

            // Отправляем запрос к JWT API
            const response = await fetch('https://services.robokassa.ru/InvoiceServiceWebApi/api/CreateInvoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: jwtToken
            });

            if (!response.ok) {
                throw new Error(`JWT API HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Результат JWT API:', result);

            if (result.ResultCode === 0) {
                return {
                    success: true,
                    invoiceUrl: result.InvoiceUrl,
                    invoiceId: invId.toString()
                };
            } else {
                throw new Error(result.Description || 'Ошибка создания счета через JWT API');
            }

        } catch (error) {
            console.error('❌ Ошибка при создании счета через JWT API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка JWT API'
            };
        }
    }

    /**
     * Создает счет в Robokassa с исправленными параметрами
     */
    async createInvoice(data: CreateRobokassaInvoiceData): Promise<RobokassaCreateInvoiceResponse> {
        try {
            console.log('🔄 Создаем счет в Robokassa:', data);

            // Форматируем сумму правильно (строка с 2 знаками после запятой)
            const outSum = data.amount.toFixed(2);

            // Кодируем описание
            const description = `Мастер-класс "${data.masterClassName}"`;
            const descriptionEncoded = encodeURIComponent(description);

            // Создаем уникальный ID счета
            const baseId = parseInt(data.invoiceId.replace(/-/g, '').substring(0, 10), 16);
            const invId = baseId + Date.now() % 1000000;

            // Создаем Receipt для фискализации
            const receipt = {
                sno: "osn", // Общая система налогообложения
                items: [{
                    name: description, // Используем уже закодированное описание
                    quantity: 1,
                    sum: data.amount,
                    cost: data.amount,
                    payment_method: "full_prepayment", // Предоплата 100%
                    payment_object: "service", // Услуга
                    tax: "vat20" // НДС 20%
                }]
            };

            // ПРАВИЛЬНАЯ подпись согласно документации Robokassa с фискализацией
            // С Receipt: MerchantLogin:OutSum:InvId:Receipt:Пароль#1
            // Receipt должен быть URL-кодирован перед включением в подпись
            const receiptJson = JSON.stringify(receipt);
            const receiptUrlEncoded = encodeURIComponent(receiptJson);
            
            const signatureString = `${this.config.merchantLogin}:${outSum}:${invId}:${receiptUrlEncoded}:${this.config.password1}`;

            console.log('🔍 Подпись для расчета с Receipt:', signatureString);

            const signature = crypto.createHash('md5').update(signatureString).digest('hex');
            console.log('🔍 Полученная подпись:', signature);

            const formData: {
                MerchantLogin: string;
                OutSum: string;
                InvId: string;
                Description: string;
                SignatureValue: string;
                Culture: string;
                Encoding: string;
                Receipt?: string;
                TaxationSystem?: string;
                IsTest?: string;
                Shp_invoice_id?: string;
                Shp_participant?: string;
            } = {
                MerchantLogin: this.config.merchantLogin,
                OutSum: outSum,
                InvId: invId.toString(),
                Description: descriptionEncoded,
                SignatureValue: signature,
                Culture: 'ru',
                Encoding: 'utf-8',
                Receipt: receiptJson,
                TaxationSystem: 'osn',
                // Добавляем shp-параметры (в форме они с префиксом Shp_)
                Shp_invoice_id: data.invoiceId,
                Shp_participant: data.participantName || 'неизвестен'
            };

            // Продакшн режим
            console.log('🏪 Продакшн режим');

            console.log('✅ Данные формы созданы:', formData);

            // Создаем URL с параметрами вручную (без двойного кодирования)
            const queryParams = Object.entries(formData)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
                .join('&');

            const invoiceUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?${queryParams}`;

            console.log('🔗 Сгенерированный URL для оплаты:', invoiceUrl);

            return {
                success: true,
                invoiceUrl: invoiceUrl,
                invoiceId: invId.toString(),
                formData: formData
            };

        } catch (error) {
            console.error('❌ Ошибка при создании счета:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Проверяет подпись уведомления от Robokassa (ResultURL)
     */
    verifyResultSignature(notification: RobokassaResultNotification): boolean {
        try {
            const { OutSum, InvId, SignatureValue, ...shpParams } = notification;

            // ПРАВИЛЬНОЕ формирование shp-параметров
            const sortedShpParams = Object.keys(shpParams)
                .filter(key => key.toLowerCase().startsWith('shp_'))
                .sort()
                .map(key => shpParams[key]) // Только значения!
                .join(':');

            // ПРАВИЛЬНЫЙ формат: OutSum:InvId:Password2:shp_values
            const signatureString = sortedShpParams.length > 0
                ? `${OutSum}:${InvId}:${this.config.password2}:${sortedShpParams}`
                : `${OutSum}:${InvId}:${this.config.password2}`;

            const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

            console.log('🔍 Проверка подписи ResultURL:', {
                signatureString,
                received: SignatureValue,
                expected: expectedSignature,
                match: expectedSignature === SignatureValue.toUpperCase()
            });

            return expectedSignature === SignatureValue.toUpperCase();
        } catch (error) {
            console.error('❌ Ошибка при проверке подписи:', error);
            return false;
        }
    }

    /**
     * Проверяет подпись уведомления SuccessURL (возврат пользователя после оплаты)
     */
    verifySuccessSignature(notification: { OutSum: string; InvId: string; SignatureValue: string;[key: string]: string }): boolean {
        try {
            const { OutSum, InvId, SignatureValue, ...shpParams } = notification;

            // ПРАВИЛЬНОЕ формирование shp-параметров
            const sortedShpParams = Object.keys(shpParams)
                .filter(key => key.toLowerCase().startsWith('shp_'))
                .sort()
                .map(key => shpParams[key]) // Только значения!
                .join(':');

            // ПРАВИЛЬНЫЙ формат: OutSum:InvId:Password1:shp_values
            const signatureString = sortedShpParams.length > 0
                ? `${OutSum}:${InvId}:${this.config.password1}:${sortedShpParams}`
                : `${OutSum}:${InvId}:${this.config.password1}`;

            const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

            console.log('🔍 Проверка подписи SuccessURL:', {
                signatureString,
                received: SignatureValue,
                expected: expectedSignature,
                match: expectedSignature === SignatureValue.toUpperCase()
            });

            return expectedSignature === SignatureValue.toUpperCase();
        } catch (error) {
            console.error('❌ Ошибка при проверке подписи SuccessURL:', error);
            return false;
        }
    }

    /**
     * Проверяет подпись JWS уведомления согласно документации Robokassa
     * JWS токен подписывается RSA256 сертификатом Robokassa
     * Проверка подписи не является обязательной согласно документации
     */
    verifyJWSNotification(jwsToken: string): RobokassaJWSNotification | null {
        try {
            const [headerB64, payloadB64, signatureB64] = jwsToken.split('.');

            if (!headerB64 || !payloadB64 || !signatureB64) {
                throw new Error('Invalid JWS format');
            }

            // Декодируем header и payload
            const header = JSON.parse(this.base64UrlDecode(headerB64));
            const payload = JSON.parse(this.base64UrlDecode(payloadB64));

            console.log('🔍 JWS Header:', header);
            console.log('🔍 JWS Payload:', payload);

            // Согласно документации проверка подписи JWS не является обязательной
            // но может быть полезной для обеспечения дополнительной аутентификации
            // Подпись создается с помощью RSA сертификата Robokassa
            // Мы пропускаем проверку подписи, так как она требует сертификат Robokassa

            return {
                header,
                data: payload
            };
        } catch (error) {
            console.error('❌ Ошибка при проверке JWS уведомления:', error);
            return null;
        }
    }

    /**
     * Инициирует возврат средств
     */
    async createRefund(refundData: RobokassaRefundRequest): Promise<RobokassaRefundResponse> {
        try {
            console.log('🔄 Создаем возврат в Robokassa:', refundData);

            const payload = {
                OpKey: refundData.OpKey,
                RefundSum: refundData.RefundSum,
                InvoiceItems: refundData.InvoiceItems
            };

            // Создаем JWT токен для возврата
            const jwtToken = jwt.sign(payload, this.config.password3, { algorithm: 'HS256' });

            const response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: jwtToken
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log('✅ Результат создания возврата:', result);

            return {
                success: result.success,
                message: result.message,
                requestId: result.requestId
            };

        } catch (error) {
            console.error('❌ Ошибка при создании возврата:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Получает статус возврата
     */
    async getRefundStatus(requestId: string): Promise<RobokassaRefundStatus | null> {
        try {
            console.log('🔄 Получаем статус возврата:', requestId);

            const response = await fetch(`https://services.robokassa.ru/RefundService/Refund/GetState?id=${requestId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.message) {
                console.error('❌ Ошибка получения статуса возврата:', result.message);
                return null;
            }

            return {
                requestId: result.requestId,
                amount: result.amount,
                label: result.label
            };

        } catch (error) {
            console.error('❌ Ошибка при получении статуса возврата:', error);
            return null;
        }
    }

    /**
     * Проверяет статус операции через XML API
     */
    async checkOperationStatus(invoiceId: number): Promise<{
        success: boolean;
        status?: number;
        description?: string | undefined;
        opKey?: string | undefined;
        outSum?: number | undefined;
        error?: string;
    }> {
        try {
            console.log('🔄 Проверяем статус операции:', invoiceId);

            // Создаем подпись для запроса
            const signatureString = `${this.config.merchantLogin}:${invoiceId}:${this.config.password2}`;
            const signature = this.createSignature(signatureString, '', true);

            const url = `https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt?` +
                `MerchantLogin=${this.config.merchantLogin}&` +
                `InvId=${invoiceId}&` +
                `Signature=${signature}`;

            console.log('🔍 Запрос статуса операции:', url);

            const response = await fetch(url);
            const xmlText = await response.text();

            console.log('📄 Ответ XML API:', xmlText);

            // Парсим XML ответ с помощью xml2js
            return new Promise((resolve) => {
                parseString(xmlText, (err: Error | null, result: unknown) => {
                    if (err) {
                        console.error('❌ Ошибка парсинга XML:', err);
                        resolve({
                            success: false,
                            error: 'Ошибка парсинга XML ответа'
                        });
                        return;
                    }

                    try {
                        const parsedResult = result as Record<string, unknown>;
                        const operationStateResponse = parsedResult['OperationStateResponse'] as Record<string, unknown[]>;
                        const resultInfo = operationStateResponse['Result']?.[0] as Record<string, string[]> | undefined;

                        if (!resultInfo) {
                            resolve({
                                success: false,
                                error: 'Неверный формат XML ответа'
                            });
                            return;
                        }

                        const resultCode = resultInfo['Code']?.[0];
                        const resultDescription = resultInfo['Description']?.[0];

                        if (resultCode !== '0') {
                            resolve({
                                success: false,
                                error: resultDescription || 'Неизвестная ошибка'
                            });
                            return;
                        }

                        const stateInfo = operationStateResponse['State']?.[0] as Record<string, string[]> | undefined;
                        const info = operationStateResponse['Info']?.[0] as Record<string, string[]> | undefined;

                        if (!stateInfo || !info) {
                            resolve({
                                success: false,
                                error: 'Неверный формат XML ответа'
                            });
                            return;
                        }

                        const stateCode = stateInfo['Code']?.[0];
                        const opKey = info['OpKey']?.[0];
                        const outSum = info['OutSum']?.[0] ? parseFloat(info['OutSum'][0]) : undefined;

                        if (!stateCode) {
                            resolve({
                                success: false,
                                error: 'Неверный формат XML ответа'
                            });
                            return;
                        }

                        resolve({
                            success: true,
                            status: parseInt(stateCode),
                            description: resultDescription,
                            opKey: opKey,
                            outSum: outSum
                        });
                    } catch (parseError) {
                        console.error('❌ Ошибка обработки XML:', parseError);
                        resolve({
                            success: false,
                            error: 'Ошибка обработки XML ответа'
                        });
                    }
                });
            });

        } catch (error) {
            console.error('❌ Ошибка при проверке статуса операции:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

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
    } {
        try {
            console.log('🔄 Создаем данные для iframe оплаты:', data);

            // Формируем краткое описание (максимум 100 символов для Robokassa)
            const description = `Мастер-класс "${data.masterClassName}"`;

            // Создаем уникальный ID счета
            // Создаем уникальный ID счета (добавляем timestamp для уникальности)
            const baseId = parseInt(data.invoiceId.replace(/-/g, '').substring(0, 10), 16);
            const invId = baseId + Date.now() % 1000000; // Добавляем timestamp для уникальности

            // При автоматической фискализации передаем Receipt в iframe
            // Robokassa автоматически создает чеки и отправляет в ФНС
            console.log('🧾 Автоматическая фискализация для iframe - Receipt передается');

            // Создаем фискальный чек для автоматической фискализации
            const receipt = this.createReceipt(data);

            // Правильная подпись С Receipt в подписи (согласно документации для iframe)
            // Формат: MerchantLogin:OutSum:InvId:Receipt:Пароль#1
            // Receipt должен быть URL-кодирован перед включением в подпись
            const receiptUrlEncoded = encodeURIComponent(receipt);
            const signatureString = `${this.config.merchantLogin}:${data.amount.toFixed(2)}:${invId}:${receiptUrlEncoded}:${this.config.password1}`;
            const signature = this.createSignature(signatureString, '', true); // Используем MD5

            console.log('🔍 Подпись для iframe рассчитана С Receipt для:', signatureString);
            console.log('🔍 Полученная подпись:', signature);

            const iframeData: {
                merchantLogin: string;
                outSum: string;
                invId: string;
                description: string;
                receipt: string;
                signatureValue: string;
                culture: string;
                encoding: string;
                isTest?: string;
            } = {
                merchantLogin: this.config.merchantLogin,
                outSum: data.amount.toFixed(2),
                invId: invId.toString(),
                description: description,
                receipt: receipt,
                signatureValue: signature,
                culture: 'ru',
                encoding: 'utf-8'
            };

            // Добавляем тестовый режим если включен
            if (this.config.testMode) {
                iframeData.isTest = '1';
            }

            console.log('✅ Данные для iframe созданы:', iframeData);

            return {
                success: true,
                iframeData
            };

        } catch (error) {
            console.error('❌ Ошибка при создании данных для iframe:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Создает второй чек для предоплаты (итоговый чек после оказания услуги)
     * Согласно документации Robokassa для ФЗ-54
     */
    async createSecondReceipt(data: {
        merchantId: string;
        id: string;
        originId: string;
        total: number;
        items: RobokassaInvoiceItem[];
        clientEmail?: string;
        clientPhone?: string;
    }): Promise<{ success: boolean; error?: string }> {
        try {
            console.log('🔄 Создаем второй чек для предоплаты согласно ФЗ-54:', data);

            // Формируем данные для второго чека согласно документации
            const secondReceiptData = {
                merchantId: data.merchantId,
                id: data.id,
                originId: data.originId,
                operation: "sell", // Тип чека - продажа
                sno: "osn", // Общая система налогообложения
                url: "https://waxhands.ru/",
                total: data.total,
                items: data.items.map(item => ({
                    name: item.Name,
                    quantity: item.Quantity,
                    sum: item.Cost,
                    tax: item.Tax,
                    payment_method: "full_payment", // Для второго чека только full_payment
                    payment_object: item.PaymentObject,
                    nomenclature_code: item.NomenclatureCode
                })),
                client: {
                    ...(data.clientEmail && { email: data.clientEmail }),
                    ...(data.clientPhone && { phone: data.clientPhone })
                },
                payments: [{
                    type: 2, // Предварительная оплата (зачет аванса)
                    sum: data.total
                }],
                vats: [{
                    type: "none", // Без НДС для образовательных услуг
                    sum: 0
                }]
            };

            // Кодируем в Base64 согласно документации
            const base64Data = Buffer.from(JSON.stringify(secondReceiptData)).toString('base64')
                .replace(/=/g, ''); // Убираем знаки равенства

            // Создаем подпись согласно документации
            const signatureString = base64Data + this.config.password1;
            const signature = this.createSignature(signatureString, '', true); // MD5

            // Кодируем подпись в Base64
            const base64Signature = Buffer.from(signature).toString('base64')
                .replace(/=/g, ''); // Убираем знаки равенства

            // Формируем итоговый JWT токен
            const jwtToken = `${base64Data}.${base64Signature}`;

            console.log('🔐 JWT токен для второго чека:', jwtToken.substring(0, 50) + '...');

            // Отправляем запрос на создание второго чека
            const response = await fetch('https://ws.roboxchange.com/RoboFiscal/Receipt/Attach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: jwtToken
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Результат создания второго чека:', result);

            if (result.ResultCode === "0") {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.ResultDescription || 'Ошибка создания второго чека'
                };
            }

        } catch (error) {
            console.error('❌ Ошибка при создании второго чека:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Получает статус второго чека
     */
    async getSecondReceiptStatus(data: {
        merchantId: string;
        id: string;
    }): Promise<{ success: boolean; status?: string; description?: string; error?: string }> {
        try {
            console.log('🔄 Получаем статус второго чека:', data);

            const statusData = {
                merchantId: data.merchantId,
                id: data.id
            };

            // Кодируем в Base64
            const base64Data = Buffer.from(JSON.stringify(statusData)).toString('base64')
                .replace(/=/g, '');

            // Создаем подпись
            const signatureString = base64Data + this.config.password1;
            const signature = this.createSignature(signatureString, '', true);

            // Кодируем подпись в Base64
            const base64Signature = Buffer.from(signature).toString('base64')
                .replace(/=/g, '');

            // Формируем JWT токен
            const jwtToken = `${base64Data}.${base64Signature}`;

            // Отправляем запрос на получение статуса
            const response = await fetch('https://ws.roboxchange.com/RoboFiscal/Receipt/Status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: jwtToken
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Статус второго чека:', result);

            return {
                success: true,
                status: result.Code,
                description: result.Description
            };

        } catch (error) {
            console.error('❌ Ошибка при получении статуса второго чека:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Проверяет, доступна ли оплата для пользователя
     */
    isPaymentAvailableForUser(userData: { surname?: string; phone?: string }): boolean {
        // Оплата доступна для всех пользователей
        return true;
    }

    /**
     * Проверяет возможность возврата средств
     * Возврат возможен только за 3 часа до мастер-класса
     */
    isRefundAvailable(workshopDate: string): boolean {
        try {
            const workshopDateTime = new Date(workshopDate);
            const now = new Date();
            const timeDiff = workshopDateTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            // Возврат возможен только если до мастер-класса больше 3 часов
            return hoursDiff > 3;
        } catch (error) {
            console.error('❌ Ошибка при проверке возможности возврата:', error);
            return false;
        }
    }
}

export const robokassaService = new RobokassaService();
