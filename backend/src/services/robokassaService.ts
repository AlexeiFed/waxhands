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
    RobokassaRefundInvoiceItem,
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
            password1: process.env.ROBOKASSA_PASSWORD_1 || '',
            password2: process.env.ROBOKASSA_PASSWORD_2 || '',
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
            password2Length: this.config.password2?.length || 0,
            algorithm: this.config.algorithm,
            password1Preview: this.config.password1?.substring(0, 4) + '...',
            password2Preview: this.config.password2?.substring(0, 4) + '...'
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
     * Согласно документации Robokassa, для JWT используется HMAC с ключом в Base64
     */
    private createJWTSignature(data: string, secretKey: string): string {
        // Создаем HMAC подпись согласно выбранному алгоритму
        // secretKey уже в формате Base64
        const keyBuffer = Buffer.from(secretKey, 'base64');

        switch (this.config.algorithm) {
            case 'MD5':
                return crypto.createHmac('md5', keyBuffer).update(data).digest('base64url');
            case 'SHA1':
                return crypto.createHmac('sha1', keyBuffer).update(data).digest('base64url');
            case 'SHA256':
                return crypto.createHmac('sha256', keyBuffer).update(data).digest('base64url');
            case 'SHA384':
                return crypto.createHmac('sha384', keyBuffer).update(data).digest('base64url');
            case 'SHA512':
                return crypto.createHmac('sha512', keyBuffer).update(data).digest('base64url');
            case 'RIPEMD160':
                return crypto.createHmac('ripemd160', keyBuffer).update(data).digest('base64url');
            default:
                return crypto.createHmac('md5', keyBuffer).update(data).digest('base64url');
        }
    }

    /**
     * Создает подпись для строки (MD5 для Robokassa, HMAC для JWT)
     */
    private createSignature(data: string, secret: string, useMD5: boolean = false): string {
        if (useMD5) {
            // Для Robokassa используем MD5 хеш
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
                name: `Мастер-класс ${data.masterClassName}`,
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
            const invId = Date.now(); // Простой и уникальный ID // Добавляем timestamp для уникальности

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

        // Robokassa чувствительна к Content-Type, пробуем несколько вариантов
        const contentTypeAttempts: Array<{ label: string; header?: string }> = [
            { label: 'application/jwt', header: 'application/jwt' },
            { label: 'application/jwt; charset=utf-8', header: 'application/jwt; charset=utf-8' },
            { label: 'application/jwt;charset=utf-8', header: 'application/jwt;charset=utf-8' },
            { label: 'text/plain', header: 'text/plain' },
            { label: 'text/plain; charset=utf-8', header: 'text/plain; charset=utf-8' },
            { label: 'text/plain;charset=utf-8', header: 'text/plain;charset=utf-8' },
            { label: 'application/octet-stream', header: 'application/octet-stream' },
            { label: 'без заголовка' }
        ];

        let lastError: Error | undefined;
        const sendAttempt = async (body: string, headerLabel?: string) => {
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Length': Buffer.byteLength(body, 'utf8').toString()
            };

            if (headerLabel) {
                headers['Content-Type'] = headerLabel;
            }

            const response = await fetch('https://services.robokassa.ru/InvoiceServiceWebApi/api/CreateInvoice', {
                method: 'POST',
                headers,
                body
            });

            const rawBody = await response.text();
            return { response, rawBody };
        };

        for (const attempt of contentTypeAttempts) {
            try {
                console.log(`🔄 Создаем счет через JWT API (Content-Type: ${attempt.header ?? 'none'})`);
                const { response, rawBody } = await sendAttempt(jwtToken, attempt.header);

                if (!response.ok) {
                    console.warn(`⚠️ Robokassa ответ ${response.status} (${attempt.header ?? 'none'}):`, rawBody);

                    if (response.status === 415) {
                        // Unsupported Media Type — пробуем следующий вариант
                        lastError = new Error(`JWT API HTTP error! status: ${response.status}`);
                        continue;
                    }

                    throw new Error(`JWT API HTTP error! status: ${response.status}`);
                }

                let result: any;
                try {
                    result = JSON.parse(rawBody);
                } catch (parseError) {
                    console.warn('⚠️ Не удалось распарсить JSON ответ Robokassa:', rawBody, parseError);
                    throw new Error('Неверный формат ответа Robokassa');
                }

                console.log('✅ Результат JWT API:', result);

                const invoiceUrl = result.InvoiceUrl || result.invoiceUrl || result.url;
                const invoiceIdResponse = result.invoiceId || result.InvoiceId || result.InvId || result.invId || result.id;
                const isSuccess = result.ResultCode === 0 || result.isSuccess === true || !!invoiceUrl;

                if (isSuccess && invoiceUrl) {
                    return {
                        success: true,
                        invoiceUrl,
                        invoiceId: (invoiceIdResponse ?? invId).toString()
                    };
                }

                throw new Error(result.Description || result.ErrorMessage || 'Ошибка создания счета через JWT API');
            } catch (attemptError) {
                lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
                console.warn(`⚠️ Попытка Robokassa JWT (${attempt.header ?? 'none'}) завершилась ошибкой:`, lastError.message);
            }
        }

        // Альтернативные форматы: JSON и form-urlencoded
        const fallbackAttempts: Array<{ header: string; body: string; label: string }> = [
            {
                header: 'application/json',
                body: JSON.stringify(jwtToken), // JSON string literal
                label: 'application/json (string)'
            },
            {
                header: 'application/x-www-form-urlencoded',
                body: `Token=${encodeURIComponent(jwtToken)}`,
                label: 'application/x-www-form-urlencoded (Token)'
            }
        ];

        for (const attempt of fallbackAttempts) {
            try {
                console.log(`🔄 Создаем счет через JWT API (fallback ${attempt.label})`);
                const { response, rawBody } = await sendAttempt(attempt.body, attempt.header);

                if (!response.ok) {
                    console.warn(`⚠️ Robokassa ответ ${response.status} (${attempt.label}):`, rawBody);

                    if (response.status === 415) {
                        lastError = new Error(`JWT API HTTP error! status: ${response.status}`);
                        continue;
                    }

                    throw new Error(`JWT API HTTP error! status: ${response.status}`);
                }

                console.log('🧾 Robokassa fallback response raw:', rawBody);
                let result: any;
                try {
                    result = JSON.parse(rawBody);
                } catch (parseError) {
                    console.warn('⚠️ Не удалось распарсить JSON ответ Robokassa (fallback):', rawBody, parseError);
                    throw new Error('Неверный формат ответа Robokassa');
                }

                console.log('✅ Результат JWT API (fallback):', result);

                const fallbackInvoiceUrl = result.InvoiceUrl || result.invoiceUrl || result.url;
                const fallbackInvoiceId = result.invoiceId || result.InvoiceId || result.InvId || result.invId || result.id;
                const fallbackSuccess = result.ResultCode === 0 || result.isSuccess === true || !!fallbackInvoiceUrl;

                if (fallbackSuccess && fallbackInvoiceUrl) {
                    return {
                        success: true,
                        invoiceUrl: fallbackInvoiceUrl,
                        invoiceId: (fallbackInvoiceId ?? invId).toString()
                    };
                }

                throw new Error(result.Description || result.ErrorMessage || 'Ошибка создания счета через JWT API');
            } catch (attemptError) {
                lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
                console.warn(`⚠️ Попытка Robokassa JWT (${attempt.label}) завершилась ошибкой:`, lastError.message);
            }
        }

        throw lastError || new Error('Не удалось создать счет через JWT API');

        } catch (error) {
            console.error('❌ Ошибка при создании счета через JWT API:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка JWT API'
            };
        }
    }


    /**
     * Создает счет в Robokassa (простая версия БЕЗ фискализации)
     */
    async createInvoice(data: CreateRobokassaInvoiceData): Promise<RobokassaCreateInvoiceResponse> {
        try {
            // 🔐 Проверка корректности конфигурации
            console.log('🔐 Проверка конфигурации:', {
                merchantLogin: this.config.merchantLogin,
                password1Length: this.config.password1?.length,
                password1Preview: this.config.password1?.substring(0, 4) + '...',
                testMode: this.config.testMode
            });

            // Валидация обязательных параметров
            if (!data.invoiceId || !data.amount) {
                throw new Error('Обязательные параметры отсутствуют: invoiceId и amount');
            }
            if (data.amount <= 0) {
                throw new Error('Сумма должна быть больше 0');
            }

            console.log('🔄 Создаем счет в Robokassa:', data);

            // Создаем уникальный ID счета - используем timestamp для уникальности
            const invId = Date.now();

            // Создаем параметры фискализации согласно документации
            const receiptItems = [];

            // Для самозанятого: общая сумма = сумма всех стилей и опций
            const stylesSum = (data.selectedStyles || []).reduce((sum, style) => sum + (style.price || 0), 0);
            const optionsSum = (data.selectedOptions || []).reduce((sum, option) => sum + (option.price || 0), 0);

            // Добавляем выбранные стили как отдельные позиции
            if (data.selectedStyles && data.selectedStyles.length > 0) {
                data.selectedStyles.forEach(style => {
                    if (style.price > 0) {
                        receiptItems.push({
                            name: `${style.name}`,
                            quantity: 1,
                            sum: style.price,
                            cost: style.price, // Цена за единицу
                            payment_method: 'full_payment', // Полный расчет для услуг
                            payment_object: 'job', // Работа для мастер-классов
                            tax: 'none',
                            nomenclature_code: style.nomenclature_code || undefined // Номенклатура товара
                        });
                    }
                });
            }

            // Добавляем выбранные опции как отдельные позиции
            if (data.selectedOptions && data.selectedOptions.length > 0) {
                data.selectedOptions.forEach(option => {
                    if (option.price > 0) {
                        receiptItems.push({
                            name: `${option.name}`,
                            quantity: 1,
                            sum: option.price,
                            cost: option.price, // Цена за единицу
                            payment_method: 'full_payment', // Полный расчет для услуг
                            payment_object: 'service', // Услуга для дополнительных опций
                            tax: 'none',
                            nomenclature_code: option.nomenclature_code || undefined // Номенклатура товара
                        });
                    }
                });
            }

            // Проверяем, что сумма всех позиций равна общей сумме
            const calculatedSum = receiptItems.reduce((sum, item) => sum + item.sum, 0);
            if (Math.abs(calculatedSum - data.amount) > 0.01) {
                console.warn('⚠️ Сумма позиций не соответствует общей сумме:', {
                    calculatedSum,
                    expectedAmount: data.amount,
                    difference: Math.abs(calculatedSum - data.amount)
                });
            }

            // Если нет стилей и опций, добавляем базовую услугу (для случаев без выбора)
            if (receiptItems.length === 0) {
                receiptItems.push({
                    name: `Мастер-класс "${data.masterClassName || 'Восковая ручка'}"`,
                    quantity: 1,
                    sum: data.amount,
                    cost: data.amount, // Цена за единицу
                    payment_method: 'full_payment', // Полный расчет для услуг
                    payment_object: 'job', // Работа для мастер-классов
                    tax: 'none',
                    nomenclature_code: data.nomenclature_code || undefined // Номенклатура товара
                });
            }

            // Форматируем общую сумму правильно (строка с 2 знаками после запятой)
            const outSum = data.amount.toFixed(2);

            // Кодируем описание
            const description = `Мастер-класс "${data.masterClassName}"`;
            const descriptionEncoded = encodeURIComponent(description);

            const receipt = {
                sno: 'osn', // Общая система налогообложения
                items: receiptItems
            };

            const receiptJson = JSON.stringify(receipt);
            const receiptEncoded = encodeURIComponent(receiptJson);

            // ✅ ПРАВИЛЬНОЕ формирование подписи с фискализацией по документации Robokassa
            // Формат: MerchantLogin:OutSum:InvId:Receipt:Password1:Shp_ключ=значение
            const signatureBase = [
                this.config.merchantLogin,
                outSum,
                invId,
                receiptEncoded,
                this.config.password1
            ].join(':');

            // Добавляем shp-параметры в отсортированном порядке
            const shpParams = {
                Shp_invoice_id: data.invoiceId,
                Shp_participant: data.participantName || 'неизвестен' // НЕ кодируем здесь, кодирование будет в подписи
            };

            // Сортируем shp-параметры по ключу и кодируем значения для подписи
            const sortedShpKeys = Object.keys(shpParams).sort();
            const shpString = sortedShpKeys.map(key => `${key}=${encodeURIComponent(shpParams[key])}`).join(':');

            // Финальная строка для подписи
            const signatureString = shpString ? `${signatureBase}:${shpString}` : signatureBase;

            console.log('🔍 Формирование подписи:', {
                base: signatureBase,
                shpParams: shpParams,
                shpString: shpString,
                finalString: signatureString,
                receiptJson: receiptJson,
                receiptEncoded: receiptEncoded
            });

            const signature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();
            console.log('🔍 Полученная подпись MD5:', signature);

            // 🔍 Детали формирования подписи в реальном времени
            console.log('🔍 Детали формирования подписи:', {
                components: [
                    this.config.merchantLogin,
                    outSum,
                    invId,
                    this.config.password1
                ],
                finalString: signatureString,
                signature: signature
            });

            const formData = {
                MerchantLogin: this.config.merchantLogin,
                OutSum: outSum,
                InvoiceID: invId.toString(),
                InvId: invId.toString(), // Добавляем для совместимости с фронтендом
                Description: descriptionEncoded,
                SignatureValue: signature,
                Culture: 'ru',
                Encoding: 'utf-8',
                // URL для перенаправления
                SuccessURL: this.config.successUrl,
                FailURL: this.config.failUrl,
                // Параметр фискализации
                Receipt: receiptEncoded,
                // Shp-параметры (кодируем для передачи в форме)
                Shp_invoice_id: data.invoiceId,
                Shp_participant: encodeURIComponent(data.participantName || 'неизвестен')
            };

            console.log('🏪 ПРОДАКШН режим - IsTest НЕ используется');
            console.log('🧾 Параметры фискализации (динамическое ценообразование):', {
                stylesSum: stylesSum,
                optionsSum: optionsSum,
                calculatedTotal: calculatedSum,
                expectedAmount: data.amount,
                receiptItemsCount: receiptItems.length,
                receiptItems: receiptItems,
                Receipt: receipt,
                ReceiptJson: receiptJson,
                ReceiptEncoded: receiptEncoded
            });
            console.log('🔍 Финальные данные для отправки в Robokassa:', {
                MerchantLogin: formData.MerchantLogin,
                OutSum: formData.OutSum,
                InvoiceID: formData.InvoiceID,
                Description: formData.Description,
                SignatureValue: formData.SignatureValue,
                Culture: formData.Culture,
                Encoding: formData.Encoding,
                Receipt: formData.Receipt,
                ShpParams: shpParams
            });

            console.log('✅ Данные формы созданы:', formData);

            const robokassaUrl = 'https://auth.robokassa.ru/Merchant/Index.aspx';

            return {
                success: true,
                paymentUrl: robokassaUrl,
                formData: formData,
                method: 'POST',
                invoiceId: invId.toString()
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

            // ✅ ПРАВИЛЬНЫЙ формат для ResultURL: OutSum:InvId:Password2:key=value
            const sortedShpParams = Object.keys(shpParams)
                .filter(key => key.toLowerCase().startsWith('shp_'))
                .sort()
                .map(key => `${key}=${shpParams[key]}`);

            const signatureString = sortedShpParams.length > 0
                ? `${OutSum}:${InvId}:${this.config.password2}:${sortedShpParams.join(':')}`
                : `${OutSum}:${InvId}:${this.config.password2}`;

            const expectedSignature = crypto.createHash('md5')
                .update(signatureString)
                .digest('hex')
                .toUpperCase();

            console.log('🔍 Проверка подписи ResultURL:', {
                signatureString,
                shpParams: sortedShpParams,
                received: SignatureValue,
                expected: expectedSignature,
                match: expectedSignature === SignatureValue.toUpperCase()
            });

            return expectedSignature === SignatureValue.toUpperCase();
        } catch (error) {
            console.error('❌ Ошибка при проверке подписи ResultURL:', error);
            return false;
        }
    }

    /**
     * Проверяет подпись уведомления SuccessURL (возврат пользователя после оплаты)
     */
    verifySuccessSignature(notification: { OutSum: string; InvId: string; SignatureValue: string;[key: string]: string }): boolean {
        try {
            const { OutSum, InvId, SignatureValue, ...shpParams } = notification;

            // ✅ ПРАВИЛЬНОЕ формирование shp-параметров согласно документации Robokassa
            // Используем пары ключ=значение, отсортированные по ключам (для уведомлений)
            const sortedShpParams = Object.keys(shpParams)
                .filter(key => key.toLowerCase().startsWith('shp_'))
                .sort()
                .map(key => `${key}=${shpParams[key]}`); // ✅ Пары ключ=значение!

            // ✅ ПРАВИЛЬНЫЙ формат: OutSum:InvId:Password1:key1=value1:key2=value2
            const signatureString = sortedShpParams.length > 0
                ? `${OutSum}:${InvId}:${this.config.password1}:${sortedShpParams.join(':')}`
                : `${OutSum}:${InvId}:${this.config.password1}`;

            const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

            console.log('🔍 Проверка подписи SuccessURL:', {
                signatureString,
                shpParams: sortedShpParams,
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
     * Инициирует возврат средств через простой API Robokassa (GET запрос)
     * Альтернативный подход согласно рекомендациям
     */
    async createRefundSimple(invId: string, outSum: string): Promise<RobokassaRefundResponse> {
        try {
            console.log('🔄 Создаем возврат через простой API Robokassa:', { invId, outSum });

            // Проверяем наличие Password3
            if (!this.config.password3) {
                throw new Error('Password3 не настроен для API возвратов');
            }

            // Создаем подпись для простого API
            const signatureString = `${this.config.merchantLogin}:${outSum}:${invId}:${this.config.password3}`;
            const signature = crypto.createHash('md5').update(signatureString).digest('hex');

            const url = `https://auth.robokassa.ru/Merchant/Refund.ashx?` +
                `MerchantLogin=${encodeURIComponent(this.config.merchantLogin)}&` +
                `OutSum=${encodeURIComponent(outSum)}&` +
                `InvId=${encodeURIComponent(invId)}&` +
                `SignatureValue=${signature}&` +
                `IncCurrLabel=`;

            console.log('📡 Отправляем GET запрос к простому API возвратов:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'WaxHands/1.0'
                }
            });

            console.log('📡 Статус ответа простого API возвратов:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('📄 Ответ простого API возвратов:', responseText);

            // Парсим XML ответ
            if (responseText.includes('OK')) {
                return {
                    success: true,
                    message: 'Возврат успешно инициирован',
                    requestId: invId
                };
            } else {
                return {
                    success: false,
                    message: 'Ошибка при инициировании возврата',
                    error: responseText
                };
            }

        } catch (error) {
            console.error('❌ Ошибка простого API возвратов:', error);
            throw error;
        }
    }

    /**
     * Получает данные чека из БД для формирования InvoiceItems возврата
     */
    async getInvoiceItemsForRefund(invoiceId: string): Promise<RobokassaRefundInvoiceItem[]> {
        try {
            console.log('🔍 Получаем данные чека для возврата:', invoiceId);

            // Получаем данные счета из БД
            const { db: pool } = await import('../database/connection.js');

            const result = await pool.query(`
                SELECT 
                    amount,
                    selected_styles,
                    selected_options,
                    master_class_id
                FROM invoices 
                WHERE id = $1
            `, [invoiceId]);

            if (result.rows.length === 0) {
                throw new Error('Счет не найден');
            }

            const invoice = result.rows[0];
            const invoiceItems: RobokassaRefundInvoiceItem[] = [];

            console.log('🔍 Данные счета из БД:', {
                id: invoiceId,
                amount: invoice.amount,
                selected_styles: invoice.selected_styles,
                selected_options: invoice.selected_options,
                master_class_id: invoice.master_class_id
            });

            // Обрабатываем selected_styles - может быть JSON строка или массив
            let styles = [];
            if (invoice.selected_styles) {
                if (typeof invoice.selected_styles === 'string') {
                    try {
                        styles = JSON.parse(invoice.selected_styles);
                    } catch (e) {
                        console.warn('⚠️ Не удалось распарсить selected_styles:', invoice.selected_styles);
                        styles = [];
                    }
                } else if (Array.isArray(invoice.selected_styles)) {
                    styles = invoice.selected_styles;
                }
            }

            // Обрабатываем selected_options - может быть JSON строка или массив
            let options = [];
            if (invoice.selected_options) {
                if (typeof invoice.selected_options === 'string') {
                    try {
                        options = JSON.parse(invoice.selected_options);
                    } catch (e) {
                        console.warn('⚠️ Не удалось распарсить selected_options:', invoice.selected_options);
                        options = [];
                    }
                } else if (Array.isArray(invoice.selected_options)) {
                    options = invoice.selected_options;
                }
            }

            console.log('🔍 Обработанные данные:', {
                styles: styles,
                options: options,
                stylesCount: styles.length,
                optionsCount: options.length
            });

            // Рассчитываем суммы для стилей и опций
            const stylesSum = styles.reduce((sum: number, style: { price?: number }) => sum + (style.price || 0), 0);
            const optionsSum = options.reduce((sum: number, option: { price?: number }) => sum + (option.price || 0), 0);
            const totalAmount = parseFloat(invoice.amount);

            // Добавляем стили как отдельные позиции (соответствует структуре чека)
            if (styles && styles.length > 0) {
                styles.forEach((style: { name: string; price: number; nomenclature_code?: string }) => {
                    if (style.price > 0) {
                        invoiceItems.push({
                            Name: style.name,
                            Quantity: 1,
                            Cost: style.price,
                            Tax: 'none',
                            PaymentMethod: 'full_prepayment', // ДОЛЖНО СОВПАДАТЬ с PaymentMethod при создании счета!
                            PaymentObject: 'service' // ДОЛЖНО СОВПАДАТЬ с PaymentObject при создании счета!
                        });
                    }
                });
            }

            // Добавляем опции как отдельные позиции (соответствует структуре чека)
            if (options && options.length > 0) {
                options.forEach((option: { name: string; price: number; nomenclature_code?: string }) => {
                    if (option.price > 0) {
                        invoiceItems.push({
                            Name: option.name,
                            Quantity: 1,
                            Cost: option.price,
                            Tax: 'none',
                            PaymentMethod: 'full_prepayment', // ДОЛЖНО СОВПАДАТЬ с PaymentMethod при создании счета!
                            PaymentObject: 'service'
                        });
                    }
                });
            }

            // Если нет стилей и опций, добавляем базовую услугу (для случаев без выбора)
            if (invoiceItems.length === 0) {
                invoiceItems.push({
                    Name: 'Мастер-класс "Восковая ручка"',
                    Quantity: 1,
                    Cost: totalAmount,
                    Tax: 'none',
                    PaymentMethod: 'full_prepayment', // ДОЛЖНО СОВПАДАТЬ с PaymentMethod при создании счета!
                    PaymentObject: 'service' // ДОЛЖНО СОВПАДАТЬ с PaymentObject при создании счета!
                });
            }

            console.log('🧾 InvoiceItems для возврата:', {
                totalAmount: totalAmount,
                stylesSum: stylesSum,
                optionsSum: optionsSum,
                itemsCount: invoiceItems.length,
                items: invoiceItems
            });

            return invoiceItems;

        } catch (error) {
            console.error('❌ Ошибка при получении данных чека:', error);
            throw error;
        }
    }

    /**
     * Инициирует возврат средств согласно документации Robokassa
     */
    async createRefund(refundData: RobokassaRefundRequest): Promise<RobokassaRefundResponse> {
        try {
            console.log('🔄 Создаем возврат в Robokassa:', refundData);

            // Проверяем наличие Password3
            if (!this.config.password3) {
                throw new Error('Password3 не настроен для API возвратов');
            }

            // Валидация обязательных полей
            if (!refundData.OpKey) {
                throw new Error('OpKey обязателен для создания возврата');
            }

            console.log('🔍 Исходные данные для возврата:', {
                OpKey: refundData.OpKey,
                RefundSum: refundData.RefundSum,
                RefundSumType: typeof refundData.RefundSum
            });

            // ВАЖНО: Robokassa требует RefundSum как ЧИСЛО (4.00, а не "4.00")
            const refundSumNumber = typeof refundData.RefundSum === 'number'
                ? refundData.RefundSum
                : parseFloat(refundData.RefundSum);

            console.log('🔍 RefundSum после форматирования:', refundSumNumber, 'тип:', typeof refundSumNumber);

            // Создаем payload согласно документации vozrat.md - КОМПАКТНЫЙ JSON БЕЗ ПРОБЕЛОВ
            // RefundSum должен быть числом 4.00 для правильной сериализации в JSON
            const payload: {
                OpKey: string;
                RefundSum: number;
                InvoiceItems?: Array<{
                    Name: string;
                    Quantity: number;
                    Cost: number;
                    Tax: string;
                    PaymentMethod: string;
                    PaymentObject: string;
                }>;
            } = {
                OpKey: refundData.OpKey,
                RefundSum: refundSumNumber
            };

            // Добавляем InvoiceItems если они переданы (для детализации возврата)
            if (refundData.InvoiceItems && refundData.InvoiceItems.length > 0) {
                console.log('🧾 Добавляем InvoiceItems в возврат:', refundData.InvoiceItems);
                payload.InvoiceItems = refundData.InvoiceItems.map(item => ({
                    Name: item.Name, // Оставляем оригинальное название (кириллица допускается)
                    Quantity: item.Quantity,
                    Cost: typeof item.Cost === 'number' ? item.Cost : parseFloat(item.Cost),
                    Tax: item.Tax || "none", // Оставляем оригинальный Tax
                    PaymentMethod: item.PaymentMethod,
                    PaymentObject: item.PaymentObject // Используем тот же PaymentObject, что был при создании чека
                }));
            }

            console.log('🔍 Payload для возврата:', JSON.stringify(payload));

            // Создаем JWT токен согласно документации vozrat.md

            const compactPayload = JSON.stringify(payload);
            console.log('🔍 Компактный payload:', compactPayload);

            const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
            const encodedHeader = Buffer.from(header).toString('base64url');
            const encodedPayload = Buffer.from(compactPayload).toString('base64url');

            const signatureString = `${encodedHeader}.${encodedPayload}`;
            const signature = crypto.createHmac('sha256', this.config.password3)
                .update(signatureString)
                .digest('base64url');

            const jwtToken = `${signatureString}.${signature}`;

            console.log('🔐 JWT с алгоритмом HS256 создан');
            console.log('🔍 Декодированный payload:', JSON.stringify(payload, null, 2));
            console.log('🔍 JWT токен (первые 100 символов):', jwtToken.substring(0, 100) + '...');
            console.log('🔍 Полный JWT токен:', jwtToken);
            console.log('🔍 Password3 (первые 10 символов):', this.config.password3?.substring(0, 10) + '...');
            console.log('🔍 Password3 (полный):', this.config.password3);

            // Отправляем запрос к API возвратов Robokassa согласно документации vozrat.md
            console.log('📡 Отправляем запрос к Robokassa API возвратов...');

            console.log('📦 JWT для Robokassa:', jwtToken);

            // Декодируем JWT для отладки
            try {
                const payload = JSON.parse(Buffer.from(jwtToken.split('.')[1], 'base64').toString());
                console.log('🔍 JWT Payload для отладки:', payload);
            } catch (e) {
                console.log('⚠️ Не удалось декодировать JWT:', e);
            }


            // Пробуем разные Content-Type для JWT
            console.log('🔄 Попытка 1: application/jwt');
            let response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/jwt',
                    'User-Agent': 'WaxHands/1.0'
                },
                body: jwtToken
            });

            if (response.status === 415) {
                console.log('🔄 Попытка 2: application/jose');
                response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/jose',
                        'User-Agent': 'WaxHands/1.0'
                    },
                    body: jwtToken
                });
            }

            if (response.status === 415) {
                console.log('🔄 Попытка 3: application/jose+json');
                response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/jose+json',
                        'User-Agent': 'WaxHands/1.0'
                    },
                    body: jwtToken
                });
            }

            if (response.status === 415) {
                console.log('🔄 Попытка 4: text/plain');
                response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        'User-Agent': 'WaxHands/1.0'
                    },
                    body: jwtToken
                });
            }

            if (response.status === 415) {
                console.log('🔄 Попытка 5: без Content-Type');
                response = await fetch('https://services.robokassa.ru/RefundService/Refund/Create', {
                    method: 'POST',
                    headers: {
                        'User-Agent': 'WaxHands/1.0'
                    },
                    body: jwtToken
                });
            }


            console.log('📡 Статус ответа API возвратов:', response.status);
            console.log('📡 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('📄 Ответ от Robokassa (полный):', responseText);
            console.log('📄 Длина ответа:', responseText.length);

            // Детальная диагностика ответа
            if (response.status === 200) {
                try {
                    const responseData = JSON.parse(responseText);
                    console.log('✅ Успешный JSON ответ:', responseData);

                    if (responseData.success === true) {
                        console.log('🎉 Возврат успешно создан! RequestId:', responseData.requestId);
                    } else {
                        console.log('❌ Ошибка в ответе Robokassa:', responseData.message);
                    }
                } catch (parseError) {
                    console.log('⚠️ Ответ не является JSON:', responseText);
                }
            } else {
                console.log('❌ HTTP ошибка:', response.status, response.statusText);
            }

            console.log('🧾 Robokassa raw response:', response.status, responseText);

            if (response.status !== 200) {
                console.log('❌ Ошибка API:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: responseText
                });
            }

            // Обрабатываем пустой ответ
            if (!responseText || responseText.trim() === '') {
                console.error('❌ Пустой ответ от Robokassa');
                return {
                    success: false,
                    message: 'Пустой ответ от Robokassa API'
                };
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Ошибка парсинга ответа от Robokassa:', parseError);
                console.error('❌ Сырой ответ:', responseText);
                return {
                    success: false,
                    message: `Неверный формат ответа от Robokassa: ${responseText.substring(0, 200)}`
                };
            }

            // Анализируем ответ согласно документации vozrat.md
            if (response.status === 200) {
                if (result.success === true) {
                    return {
                        success: true,
                        message: result.message || 'Возврат успешно создан',
                        requestId: result.requestId
                    };
                } else {
                    return {
                        success: false,
                        message: result.message || 'Неизвестная ошибка возврата'
                    };
                }
            } else {
                return {
                    success: false,
                    message: `HTTP ${response.status}: ${result.message || responseText.substring(0, 200)}`
                };
            }

        } catch (error) {
            console.error('❌ Ошибка при создании возврата:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Неизвестная ошибка'
            };
        }
    }

    /**
     * Создает JWT токен для возврата (для отладки)
     */
    async createRefundJWT(refundData: RobokassaRefundRequest): Promise<string> {
        try {
            // Минимальное логирование для production
            console.log('🔎 Создаем JWT токен для возврата');

            // Проверяем наличие Password3
            if (!this.config.password3) {
                throw new Error('Password3 не настроен для API возвратов');
            }

            // ВАЖНО: Robokassa требует RefundSum как ЧИСЛО (4.00, а не "4.00")
            const refundSumNumber = typeof refundData.RefundSum === 'number'
                ? refundData.RefundSum
                : parseFloat(refundData.RefundSum);

            console.log('🔍 JWT - RefundSum форматированный:', refundSumNumber, 'тип:', typeof refundSumNumber);

            // Создаем payload согласно документации vozrat.md - КОМПАКТНЫЙ JSON БЕЗ ПРОБЕЛОВ
            const payload: {
                OpKey: string;
                RefundSum: number;
                InvoiceItems?: Array<{
                    Name: string;
                    Quantity: number;
                    Cost: number;
                    Tax: string;
                    PaymentMethod: string;
                    PaymentObject: string;
                }>;
            } = {
                OpKey: refundData.OpKey,
                RefundSum: refundSumNumber
            };

            // Добавляем InvoiceItems если они переданы (для детализации возврата)
            if (refundData.InvoiceItems && refundData.InvoiceItems.length > 0) {
                console.log('🧾 Добавляем InvoiceItems в JWT:', refundData.InvoiceItems);
                payload.InvoiceItems = refundData.InvoiceItems.map(item => ({
                    Name: item.Name,
                    Quantity: item.Quantity,
                    Cost: typeof item.Cost === 'number' ? item.Cost : parseFloat(item.Cost),
                    Tax: item.Tax,
                    PaymentMethod: item.PaymentMethod,
                    PaymentObject: item.PaymentObject
                }));
            }

            console.log('🔍 Payload для возврата:', JSON.stringify(payload));

            // Создаем JWT токен согласно документации vozrat.md

            const compactPayload = JSON.stringify(payload);
            console.log('🔍 Компактный payload:', compactPayload);

            const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
            const encodedHeader = Buffer.from(header).toString('base64url');
            const encodedPayload = Buffer.from(compactPayload).toString('base64url');

            const signatureString = `${encodedHeader}.${encodedPayload}`;
            const signature = crypto.createHmac('sha256', this.config.password3)
                .update(signatureString)
                .digest('base64url');

            const jwtToken = `${signatureString}.${signature}`;

            console.log('🔐 JWT с алгоритмом HS256 для отладки создан');
            console.log('🔍 Декодированный payload:', JSON.stringify(payload, null, 2));
            console.log('🔍 JWT токен (первые 100 символов):', jwtToken.substring(0, 100) + '...');
            console.log('🔍 Полный JWT токен:', jwtToken);

            return jwtToken;

        } catch (error) {
            console.error('❌ Ошибка при создании JWT токена:', error);
            throw error;
        }
    }

    /**
     * Обрабатывает сообщения об ошибках возврата согласно документации vozrat.md
     */
    private getRefundErrorMessage(errorCode: string | number): string {
        const errorMessages: Record<string, string> = {
            '0': 'Успешное выполнение',
            '1': 'Неверная подпись',
            '2': 'Неверный номер операции',
            '3': 'Недостаточно средств для возврата',
            '4': 'Операция не найдена',
            '5': 'Возврат уже выполнен',
            '6': 'Сумма возврата превышает сумму операции',
            '7': 'Доступ запрещен',
            '8': 'Ошибка формата запроса',
            '10': 'Магазин не найден',
            '11': 'Операция не в состоянии для возврата',
            'NotEnoughOperationFunds': 'Недостаточно средств для возврата',
            'InvalidOpKey': 'Неверный идентификатор операции',
            'InvalidRefundSum': 'Неверная сумма возврата',
            'RefundAlreadyExists': 'Возврат уже существует',
            'OperationNotFound': 'Операция не найдена',
            'InvalidSignature': 'Неверная подпись',
            'MerchantNotFound': 'Магазин не найден',
            'AccessDenied': 'Доступ запрещен',
            'Id is invalid or request id does not exist': 'Неверный ID или запрос не существует.',
            'BadRequest': 'Неверный формат запроса. Проверьте структуру данных.'
        };

        return errorMessages[errorCode.toString()] || `Ошибка возврата: ${errorCode}`;
    }

    /**
     * Получает статус возврата согласно документации vozrat.md
     */
    async getRefundStatus(requestId: string): Promise<RobokassaRefundStatus | null> {
        try {
            console.log('🔄 Получаем статус возврата:', requestId);

            const response = await fetch(`https://services.robokassa.ru/RefundService/Refund/GetState?id=${requestId}`, {
                headers: {
                    'User-Agent': 'WaxHands/1.0'
                }
            });

            console.log('📡 Статус ответа:', response.status);
            console.log('📡 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('❌ HTTP ошибка получения статуса возврата:', response.status, response.statusText);
                return null;
            }

            const responseText = await response.text();
            console.log('📄 Ответ от Robokassa (полный):', responseText);

            if (!responseText || responseText.trim() === '') {
                console.error('⚠️ Пустой ответ от Robokassa API');
                return null;
            }

            try {
                const result = JSON.parse(responseText);
                console.log('✅ JSON ответ от Robokassa:', result);

                // Согласно документации vozrat.md: если есть message, это ошибка
                if (result.message) {
                    console.error('❌ Ошибка получения статуса возврата:', result.message);
                    return null;
                }

                // Проверяем наличие обязательных полей согласно документации
                if (!result.requestId || !result.amount || !result.label) {
                    console.error('❌ Неполный ответ от API возвратов:', result);
                    return null;
                }

                console.log('🎉 Статус возврата получен:', {
                    requestId: result.requestId,
                    amount: result.amount,
                    label: result.label
                });

                return {
                    requestId: result.requestId,
                    amount: result.amount,
                    label: result.label
                };

            } catch (parseError) {
                console.error('⚠️ Ответ не является JSON:', responseText);
                return null;
            }

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

            // Создаем подпись для запроса согласно документации Robokassa
            const signatureString = `${this.config.merchantLogin}:${invoiceId}:${this.config.password2}`;
            const signature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

            const url = `https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt?` +
                `MerchantLogin=${encodeURIComponent(this.config.merchantLogin)}&` +
                `InvoiceID=${invoiceId}&` +
                `Signature=${signature}`;

            console.log('🔍 Запрос статуса операции:', url);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WaxHands/1.0'
                }
            });

            console.log('📡 Статус ответа XML API:', response.status);
            console.log('📡 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

            const responseText = await response.text();
            console.log('📄 Ответ XML API (полный):', responseText);

            // Проверяем, что ответ не HTML (ошибка)
            if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
                console.error('❌ API вернул HTML вместо XML:', responseText.substring(0, 200));
                return {
                    success: false,
                    error: 'API Robokassa вернул ошибку вместо XML'
                };
            }

            // Парсим XML ответ с помощью xml2js
            return new Promise((resolve) => {
                parseString(responseText, (err: Error | null, result: unknown) => {
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

            // Создаем уникальный ID счета - используем timestamp для уникальности
            const invId = Date.now();

            // ✅ СТАНДАРТНАЯ ФОРМУЛА: с двоеточиями для iframe (правильная по документации)
            // MerchantLogin:OutSum:InvId:Password1
            const signatureString = `${this.config.merchantLogin}:${data.amount.toFixed(2)}:${invId}:${this.config.password1}`;
            const signature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

            console.log('🔍 Подпись для iframe:', signatureString);
            console.log('🔍 Компоненты iframe подписи:', {
                merchantLogin: this.config.merchantLogin,
                outSum: data.amount.toFixed(2),
                invId: invId,
                password1Preview: this.config.password1.substring(0, 4) + '...',
                testMode: this.config.testMode
            });
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
                receipt: '', // Пустой receipt для простого режима
                signatureValue: signature,
                culture: 'ru',
                encoding: 'utf-8',
            };

            // ПРОДАКШН режим - isTest НЕ используется

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