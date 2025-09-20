/**
 * @file: RobokassaPayment.tsx
 * @description: Компонент для оплаты через Robokassa
 * @dependencies: React, types/index.ts
 * @created: 2025-01-26
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Invoice } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface RobokassaPaymentProps {
    invoice: Invoice;
    onPaymentSuccess?: () => void;
    onPaymentError?: (error: string) => void;
    onRefundSuccess?: () => void;
}

interface PaymentResponse {
    success: boolean;
    data?: {
        paymentUrl?: string;
        invoiceId?: string;
        formData?: {
            MerchantLogin: string;
            OutSum: string;
            InvoiceID: string;
            Receipt: string;
            Description: string;
            SignatureValue: string;
            Culture: string;
            Encoding: string;
            IsTest?: string;
        };
    };
    error?: string;
}

interface RefundResponse {
    success: boolean;
    data?: {
        requestId: string;
        message: string;
    };
    error?: string;
}

export const RobokassaPayment: React.FC<RobokassaPaymentProps> = ({
    invoice,
    onPaymentSuccess,
    onPaymentError,
    onRefundSuccess
}) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundAvailable, setRefundAvailable] = useState(false);

    // Проверяем, доступна ли оплата для пользователя
    const isPaymentAvailable = !!user; // Оплата доступна для всех авторизованных пользователей

    // Отладочная информация
    console.log('🔍 RobokassaPayment Debug:', {
        user: user,
        isPaymentAvailable: isPaymentAvailable
    });

    // Проверяем возможность возврата (до 3 часов до мастер-класса)
    useEffect(() => {
        if (invoice.status === 'paid' && invoice.workshop_date) {
            const workshopDate = new Date(invoice.workshop_date);
            const now = new Date();
            const threeHoursBefore = new Date(workshopDate.getTime() - 3 * 60 * 60 * 1000);

            setRefundAvailable(now <= threeHoursBefore);
        }
    }, [invoice.status, invoice.workshop_date]);

    const handlePayment = async () => {
        if (!isPaymentAvailable) {
            setError('Оплата временно недоступна. Пожалуйста, авторизуйтесь.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔄 Создаем ссылку на оплату для счета:', invoice.id);
            console.log('🔍 Текущий paymentUrl в состоянии:', paymentUrl);

            const token = localStorage.getItem('authToken');
            console.log('🔍 Токен авторизации:', token?.substring(0, 20) + '...');

            // Принудительно очищаем кэш
            setPaymentUrl(null);

            // Используем стандартный API путь с принудительным обходом кэша
            const directUrl = `${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/pay?t=${Date.now()}&nocache=${Math.random()}`;
            console.log('🔗 API URL с принудительным обходом кэша:', directUrl);

            // Полностью обходим Service Worker с прямым IP
            const response = await new Promise<Response>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', directUrl, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                xhr.setRequestHeader('Pragma', 'no-cache');
                xhr.setRequestHeader('Expires', '0');

                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const response = new Response(xhr.responseText, {
                                status: xhr.status,
                                statusText: xhr.statusText,
                                headers: new Headers({
                                    'content-type': xhr.getResponseHeader('content-type') || 'application/json'
                                })
                            });
                            resolve(response);
                        } else {
                            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send();
            });

            console.log('📡 Ответ от API:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            // Проверяем тип ответа
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                // JSON ответ
                const result: PaymentResponse = await response.json();
                console.log('📄 JSON ответ от API:', result);

                if (result.success && result.data) {
                    if (result.data.formData) {
                        // Новая структура с POST формой и фискализацией
                        console.log('✅ Получены данные POST формы с фискализацией:', result.data.formData);
                        setPaymentUrl(result.data.paymentUrl || 'https://auth.robokassa.ru/Merchant/Index.aspx');
                        // Создаем и отправляем POST форму
                        submitPaymentForm(result.data.paymentUrl, result.data.formData);
                    } else if (result.data.paymentUrl) {
                        // Fallback на старую структуру с URL
                        console.log('⚠️ Получена ссылка на оплату (возможно без фискализации):', result.data.paymentUrl);
                        setPaymentUrl(result.data.paymentUrl);
                        openPaymentIframe(result.data.paymentUrl);
                    } else {
                        console.log('❌ Неизвестная структура ответа API:', result);
                        setError('Неизвестная структура ответа от сервера');
                        onPaymentError?.('Неизвестная структура ответа от сервера');
                    }
                } else {
                    console.log('❌ Ошибка в ответе API:', result.error);
                    setError(result.error || 'Ошибка создания ссылки на оплату');
                    onPaymentError?.(result.error || 'Ошибка создания ссылки на оплату');
                }
            } else {
                // HTML ответ или JSON с HTML - извлекаем URL из iframe
                const responseText = await response.text();
                console.log('📄 Получен ответ от Robokassa:', responseText);

                let htmlText = responseText;

                // Проверяем, это JSON с HTML или чистый HTML
                try {
                    const jsonData = JSON.parse(responseText);
                    if (jsonData.html || jsonData.data) {
                        htmlText = jsonData.html || jsonData.data;
                        console.log('📄 Извлечен HTML из JSON:', htmlText);
                    }
                } catch (e) {
                    // Это не JSON, используем как есть
                    console.log('📄 Получен чистый HTML ответ');
                }

                // Ищем URL в iframe
                const iframeMatch = htmlText.match(/src="([^"]+)"/);
                if (iframeMatch && iframeMatch[1]) {
                    const paymentUrl = iframeMatch[1];
                    console.log('🔗 Извлечен URL оплаты:', paymentUrl);
                    setPaymentUrl(paymentUrl);
                    openPaymentIframe(paymentUrl);
                } else {
                    // Если не удалось извлечь URL, но есть HTML с document.write
                    if (htmlText.includes('document.write')) {
                        // Извлекаем содержимое из document.write
                        const writeMatch = htmlText.match(/document\.write\("(.*)"\)/);
                        if (writeMatch && writeMatch[1]) {
                            // Декодируем HTML из строки
                            const decodedHtml = writeMatch[1]
                                .replace(/\\"/g, '"')
                                .replace(/\\\//g, '/')
                                .replace(/\\n/g, '')
                                .replace(/\\t/g, '');

                            console.log('🔍 Извлечен HTML из document.write:', decodedHtml);

                            // Ищем URL в извлеченном HTML
                            const iframeMatch2 = decodedHtml.match(/src="([^"]+)"/);
                            if (iframeMatch2 && iframeMatch2[1]) {
                                const paymentUrl = iframeMatch2[1];
                                console.log('🔗 Извлечен URL оплаты из document.write:', paymentUrl);
                                setPaymentUrl(paymentUrl);
                                openPaymentIframe(paymentUrl);
                                return;
                            }

                            // Если URL не найден, показываем декодированный HTML
                            showPaymentModal(decodedHtml);
                        } else {
                            console.log('🖼️ Показываем исходный HTML форму оплаты');
                            showPaymentModal(htmlText);
                        }
                    } else {
                        // Если не удалось извлечь URL, показываем HTML в модальном окне
                        console.log('🖼️ Показываем HTML форму оплаты');
                        showPaymentModal(htmlText);
                    }
                }
            }
        } catch (err) {
            const errorMessage = 'Ошибка при создании ссылки на оплату';
            setError(errorMessage);
            onPaymentError?.(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const showPaymentModal = (htmlContent: string) => {
        // Создаем модальное окно для показа HTML формы оплаты
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        // Кнопка закрытия
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            z-index: 10001;
        `;
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };

        // Создаем iframe для HTML контента
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 200px;
            border: none;
            border-radius: 8px;
        `;
        iframe.srcdoc = htmlContent;

        content.appendChild(closeButton);
        content.appendChild(iframe);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Закрытие по клику вне модального окна
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    };

    const submitPaymentForm = (url: string, formData: NonNullable<PaymentResponse['data']>['formData']) => {
        if (!formData) {
            console.error('❌ Данные формы отсутствуют');
            return;
        }

        console.log('📝 Создаем и отправляем POST форму для RoboKassa:', { url, formData });

        // Создаем форму
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = '_blank';
        form.style.display = 'none';

        // Добавляем поля формы с правильной обработкой
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
            }
        });

        // Добавляем форму в DOM и отправляем
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        console.log('✅ POST форма отправлена в новом окне');
    };

    const openPaymentIframe = (url: string) => {
        // Все ссылки Robokassa открываем в новом окне (iframe блокируется политикой безопасности)
        console.log('🔗 Открываем ссылку Robokassa в новом окне:', url);

        // Для PWA лучше открывать в том же окне
        if (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as { standalone?: boolean }).standalone === true) {
            // PWA режим - открываем в том же окне
            console.log('📱 PWA режим: открываем в том же окне');
            window.location.href = url;
            return;
        }

        // Обычный браузер - пытаемся открыть в новом окне
        const paymentWindow = window.open(url, 'robokassa_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');

        if (!paymentWindow) {
            // Если не удалось открыть новое окно, открываем в том же
            console.log('🔄 Fallback: открываем в том же окне');
            window.location.href = url;
            return;
        }

        // Слушаем закрытие окна
        const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
                clearInterval(checkClosed);
                console.log('🔄 Окно оплаты закрыто, обновляем страницу');
                // Обновляем страницу для отображения нового статуса
                window.location.reload();
            }
        }, 1000);

        // Дополнительная проверка через 30 секунд
        setTimeout(() => {
            if (!paymentWindow.closed) {
                console.log('⏰ Окно оплаты все еще открыто через 30 секунд');
            }
        }, 30000);

    };

    const handleRefund = async () => {
        if (!refundAvailable) return;

        setIsRefunding(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    opKey: invoice.payment_id, // Используем payment_id как opKey
                    refundSum: invoice.amount
                })
            });

            const result: RefundResponse = await response.json();

            if (result.success) {
                onRefundSuccess?.();
                // Обновляем страницу для отображения нового статуса
                window.location.reload();
            } else {
                setError(result.error || 'Ошибка создания возврата');
            }
        } catch (err) {
            const errorMessage = 'Ошибка при создании возврата';
            setError(errorMessage);
        } finally {
            setIsRefunding(false);
        }
    };

    if (!isPaymentAvailable) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Оплата через Robokassa
                    </CardTitle>
                    <CardDescription>
                        Безопасная оплата картой или через СБП
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            Оплата временно недоступна. Пожалуйста, авторизуйтесь для доступа к оплате.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Оплата через Robokassa
                </CardTitle>
                <CardDescription>
                    Безопасная оплата картой или через СБП
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {invoice.status === 'pending' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Smartphone className="h-4 w-4" />
                            <span>Доступные способы оплаты: Банковские карты, СБП</span>
                        </div>

                        <Button
                            onClick={handlePayment}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Создание ссылки на оплату...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Оплатить {invoice.amount} ₽
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {invoice.status === 'paid' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Счет оплачен</span>
                        </div>

                        {refundAvailable && (
                            <Button
                                onClick={handleRefund}
                                disabled={isRefunding}
                                variant="outline"
                                className="w-full"
                            >
                                {isRefunding ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Создание возврата...
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Вернуть средства
                                    </>
                                )}
                            </Button>
                        )}

                        {!refundAvailable && (
                            <p className="text-sm text-muted-foreground">
                                Возврат возможен только до 3 часов до начала мастер-класса
                            </p>
                        )}
                    </div>
                )}

                {invoice.status === 'cancelled' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span>Счет отменен</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
