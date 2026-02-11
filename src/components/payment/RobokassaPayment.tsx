/**
 * @file: RobokassaPayment.tsx
 * @description: Компонент для оплаты через Robokassa
 * @dependencies: React, types/index.ts
 * @created: 2025-01-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle, RotateCcw, MessageCircle } from 'lucide-react';
import { Invoice } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoiceById } from '@/hooks/use-invoices';
import { useMasterClassesWebSocket } from '@/hooks/use-master-classes-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useSchools } from '@/hooks/use-schools';

interface RobokassaPaymentProps {
    invoiceId: string;
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
            InvId: number | string; // Может быть как число, так и строка
            Receipt?: string; // Опционально для фискализации
            receipt?: string; // Альтернативное имя параметра
            Description: string;
            SignatureValue: string;
            Culture: string;
            Encoding: string;
            TaxationSystem?: string; // Опционально - система налогообложения
            taxationSystem?: string; // Альтернативное имя параметра
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
    invoiceId,
    onPaymentSuccess,
    onPaymentError,
    onRefundSuccess
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: invoice, isLoading: invoiceLoading, error: invoiceError } = useInvoiceById(invoiceId, {
        enabled: !!invoiceId
    });
    const { schools } = useSchools();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRefunding, setIsRefunding] = useState(false);
    const [refundAvailable, setRefundAvailable] = useState(false);
    const [schoolPaymentDisabled, setSchoolPaymentDisabled] = useState(false);

    // Проверяем, отключена ли оплата для школы
    useEffect(() => {
        if (invoice?.school_name && schools.length > 0) {
            const school = schools.find(s => s.name === invoice.school_name);
            setSchoolPaymentDisabled(school?.paymentDisabled || false);
        }
    }, [invoice?.school_name, schools]);

    // WebSocket для автоматических обновлений данных счета
    const { isConnected: masterClassesWsConnected } = useMasterClassesWebSocket({
        userId: user?.id,
        enabled: !!invoiceId, // Включаем только когда есть invoiceId
        onMasterClassUpdate: useCallback(() => {
            console.log('🔄 WebSocket: Обновление данных счета в RobokassaPayment');

            // Принудительно обновляем данные счета
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
            queryClient.refetchQueries({ queryKey: ['invoice', invoiceId] });

            // Обновляем данные счетов родителя
            if (user?.id) {
                queryClient.invalidateQueries({ queryKey: ['invoices', 'parent', user.id] });
                queryClient.refetchQueries({ queryKey: ['invoices', 'parent', user.id] });
            }
        }, [invoiceId, user?.id, queryClient])
    });

    // Проверяем, доступна ли оплата для пользователя
    const isPaymentAvailable = !!user; // Оплата доступна для всех авторизованных пользователей

    // Принудительное обновление данных при изменении invoiceId
    useEffect(() => {
        if (invoiceId) {
            console.log('🔄 RobokassaPayment: Обновляем данные счета при изменении invoiceId');

            // Принудительно обновляем данные счета
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
            queryClient.refetchQueries({ queryKey: ['invoice', invoiceId] });
        }
    }, [invoiceId, queryClient]);

    // Проверяем возможность возврата (до 3 часов до мастер-класса)
    useEffect(() => {
        if (invoice?.status === 'paid' && invoice?.workshop_date) {
            const workshopDate = new Date(invoice.workshop_date);
            const now = new Date();
            const threeHoursBefore = new Date(workshopDate.getTime() - 3 * 60 * 60 * 1000);

            setRefundAvailable(now <= threeHoursBefore);
        }
    }, [invoice?.status, invoice?.workshop_date]);

    // Если invoiceId не определен, показываем ошибку
    if (!invoiceId) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                    Ошибка: ID счета не определен
                </AlertDescription>
            </Alert>
        );
    }

    // Если счет загружается или произошла ошибка
    if (invoiceLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Загрузка данных счета...</span>
            </div>
        );
    }

    if (invoiceError || !invoice) {
        return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                    Ошибка загрузки счета: {invoiceError?.message || 'Счет не найден'}
                </AlertDescription>
            </Alert>
        );
    }

    // Отладочная информация

    const handlePayment = async () => {
        if (!isPaymentAvailable) {
            setError('Оплата временно недоступна. Пожалуйста, авторизуйтесь.');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Определяем, запущено ли приложение как PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as { standalone?: boolean }).standalone === true;

        // Определяем iOS устройство
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as { MSStream?: boolean }).MSStream;
        
        // Определяем Android устройство
        const isAndroid = /Android/.test(navigator.userAgent);

        // На iOS и Android НЕ открываем предварительное окно - это блокируется
        // Вместо этого будем перенаправлять напрямую после получения URL
        let pendingWindow: Window | null = null;

        // Открываем окно только на десктопе
        if (!isStandalone && !isIOS && !isAndroid) {
            try {
                pendingWindow = window.open('', 'robokassa_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
                if (pendingWindow) {
                    pendingWindow.document.write('<p style="font-family: sans-serif; text-align: center; padding-top: 40px;">Загружаем форму оплаты…</p>');
                }
            } catch (popupError) {
                console.warn('⚠️ Не удалось открыть предварительное окно оплаты:', popupError);
                pendingWindow = null;
            }
        }

        console.log('📱 Устройство:', { isStandalone, isIOS, isAndroid, hasPendingWindow: !!pendingWindow });

        try {

            const token = localStorage.getItem('authToken');
            console.log('🔍 Токен авторизации:', token?.substring(0, 20) + '...');

            // Принудительно очищаем кэш
            setPaymentUrl(null);

            // Используем стандартный API путь с принудительным обходом кэша
            const directUrl = `${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/pay?t=${Date.now()}&nocache=${Math.random()}`;

            console.log('🔗 Запрос к API:', directUrl);

            // Используем стандартный fetch с обходом кэша
            const response = await fetch(directUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });

            console.log('📡 Статус ответа:', response.status);
            console.log('📡 Заголовки ответа:', Object.fromEntries(response.headers.entries()));

            // Проверяем статус ответа
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка API:', response.status, errorText);
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }

            // Проверяем тип ответа
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                // JSON ответ
                const result: PaymentResponse = await response.json();

                console.log('📦 Ответ API:', result);

                if (result.success && result.data) {
                    if (result.data.formData) {
                        // Новая структура с POST формой и фискализацией
                        console.log('✅ Получены данные формы для оплаты:', result.data.formData);

                        const finalUrl = result.data.paymentUrl || 'https://auth.robokassa.ru/Merchant/Index.aspx';
                        setPaymentUrl(finalUrl);
                        // Создаем и отправляем POST форму (передаем флаги устройства)
                        submitPaymentForm(finalUrl, result.data.formData, pendingWindow, isStandalone, isIOS || isAndroid);
                    } else if (result.data.paymentUrl) {
                        // Fallback на старую структуру с URL
                        console.log('⚠️ Получена ссылка на оплату (возможно без фискализации):', result.data.paymentUrl);
                        setPaymentUrl(result.data.paymentUrl);
                        openPaymentIframe(result.data.paymentUrl, pendingWindow, isStandalone, isIOS || isAndroid);
                    } else {

                        setError('Неизвестная структура ответа от сервера');
                        onPaymentError?.('Неизвестная структура ответа от сервера');
                    }
                } else {

                    setError(result.error || 'Ошибка создания ссылки на оплату');
                    onPaymentError?.(result.error || 'Ошибка создания ссылки на оплату');
                }
            } else {
                // HTML ответ или JSON с HTML - извлекаем URL из iframe
                const responseText = await response.text();

                let htmlText = responseText;

                // Проверяем, это JSON с HTML или чистый HTML
                try {
                    const jsonData = JSON.parse(responseText);
                    if (jsonData.html || jsonData.data) {
                        htmlText = jsonData.html || jsonData.data;

                    }
                } catch (e) {
                    // Это не JSON, используем как есть

                }

                // Ищем URL в iframe
                const iframeMatch = htmlText.match(/src="([^"]+)"/);
                if (iframeMatch && iframeMatch[1]) {
                                const paymentUrl = iframeMatch[1];

                    setPaymentUrl(paymentUrl);
                    openPaymentIframe(paymentUrl, pendingWindow, isStandalone, isIOS || isAndroid);
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

                            // Ищем URL в извлеченном HTML
                            const iframeMatch2 = decodedHtml.match(/src="([^"]+)"/);
                            if (iframeMatch2 && iframeMatch2[1]) {
                                const paymentUrl = iframeMatch2[1];

                                setPaymentUrl(paymentUrl);
                                openPaymentIframe(paymentUrl, pendingWindow, isStandalone, isIOS || isAndroid);
                                return;
                            }

                            // Если URL не найден, показываем декодированный HTML
                            if (pendingWindow && !pendingWindow.closed) {
                                pendingWindow.close();
                                pendingWindow = null;
                            }
                            showPaymentModal(decodedHtml);
                        } else {
                            if (pendingWindow && !pendingWindow.closed) {
                                pendingWindow.close();
                                pendingWindow = null;
                            }
                            showPaymentModal(htmlText);
                        }
                    } else {
                        // Если не удалось извлечь URL, показываем HTML в модальном окне
                        if (pendingWindow && !pendingWindow.closed) {
                            pendingWindow.close();
                            pendingWindow = null;
                        }
                        showPaymentModal(htmlText);
                    }
                }
            }
        } catch (err) {
            let errorMessage = 'Произошла ошибка при создании ссылки на оплату';

            if (err instanceof Error) {
                errorMessage = err.message;

                // Специальная обработка для различных типов ошибок
                if (err.message.includes('401')) {
                    errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему заново.';
                } else if (err.message.includes('403')) {
                    errorMessage = 'Доступ запрещен. Обратитесь к администратору.';
                } else if (err.message.includes('404')) {
                    errorMessage = 'Счет не найден. Пожалуйста, обновите страницу.';
                } else if (err.message.includes('500')) {
                    errorMessage = 'Внутренняя ошибка сервера. Попробуйте позже.';
                } else if (err.message.includes('Network error')) {
                    errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
                }
            }

            console.error('❌ Ошибка при создании ссылки на оплату:', err);
            setError(errorMessage);
            onPaymentError?.(errorMessage);
            if (pendingWindow && !pendingWindow.closed) {
                pendingWindow.close();
            }
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

    const submitPaymentForm = (
        url: string,
        formData: NonNullable<PaymentResponse['data']>['formData'],
        targetWindow: Window | null,
        isStandalone: boolean,
        isMobile: boolean = false
    ) => {
        if (!formData) {
            console.error('❌ Данные формы отсутствуют');
            return;
        }

        // Проверяем обязательные параметры для фискализации (более гибкая валидация)
        console.log('🔍 Проверка параметров формы:', Object.keys(formData));

        if (!formData.Receipt && !formData.receipt) {
            console.warn('⚠️ Параметр Receipt отсутствует, но продолжаем (возможно, фискализация отключена)');
        }

        if (!formData.TaxationSystem && !formData.taxationSystem) {
            console.warn('⚠️ Параметр TaxationSystem отсутствует, но продолжаем');
        }

        // Проверяем тип InvId - может быть как число, так и строка
        if (formData.InvId === null || formData.InvId === undefined || formData.InvId === '') {
            console.error('❌ InvId отсутствует или пустой');
            setError('Ошибка формата номера счета');
            return;
        }

        // Преобразуем InvId в число если это строка
        const invIdNumber = typeof formData.InvId === 'string' ? parseInt(formData.InvId, 10) : formData.InvId;
        if (isNaN(invIdNumber)) {
            console.error('❌ InvId не может быть преобразован в число:', formData.InvId);
            setError('Ошибка формата номера счета');
            return;
        }

        // Создаем форму
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        
        // На мобильных устройствах или PWA - открываем в том же окне
        // На десктопе - пытаемся открыть в popup если он существует
        if (isMobile || isStandalone || !targetWindow || targetWindow.closed) {
            form.target = '_self'; // Открываем в том же окне на мобильных
            console.log('📱 Открываем платежную форму в том же окне (мобильное устройство или PWA)');
        } else {
            const targetName = targetWindow.name || 'robokassa_payment';
            if (!targetWindow.name) {
                targetWindow.name = targetName;
            }
            form.target = targetName;
            console.log('💻 Открываем платежную форму в popup окне (десктоп)');
        }
        
        form.style.display = 'none';
        form.enctype = 'application/x-www-form-urlencoded';

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

        // Пытаемся сфокусировать окно только на десктопе
        if (!isMobile && !isStandalone && targetWindow && !targetWindow.closed) {
            try {
                targetWindow.focus();
            } catch (focusError) {
                console.warn('⚠️ Не удалось сфокусировать окно оплаты:', focusError);
            }
        }

    };

    const openPaymentIframe = (url: string, existingWindow: Window | null, isStandalone: boolean, isMobile: boolean = false) => {
        // Все ссылки Robokassa открываем в новом окне (iframe блокируется политикой безопасности)

        // Для PWA или мобильных устройств открываем в том же окне
        if (isStandalone || isMobile) {
            console.log('📱 Перенаправление на оплату в том же окне (PWA или мобильное устройство)');
            window.location.href = url;
            return;
        }

        // Обычный браузер (десктоп) - пытаемся открыть в новом окне
        let paymentWindow = existingWindow;

        if (paymentWindow && paymentWindow.closed) {
            paymentWindow = null;
        }

        if (paymentWindow) {
            paymentWindow.location.href = url;
        } else {
            paymentWindow = window.open(url, 'robokassa_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
        }

        if (!paymentWindow) {
            // Если не удалось открыть новое окно (блокировка popup), открываем в том же
            console.log('⚠️ Popup заблокирован, перенаправление в том же окне');
            window.location.href = url;
            return;
        }

        // Слушаем закрытие окна
        const checkClosed = setInterval(() => {
            try {
                if (paymentWindow && paymentWindow.closed) {
                    clearInterval(checkClosed);
                    // Обновляем страницу для отображения нового статуса
                    window.location.reload();
                }
            } catch (e) {
                // Игнорируем ошибки доступа к окну
            }
        }, 1000);

        // Дополнительная проверка через 30 секунд
        setTimeout(() => {
            clearInterval(checkClosed);
        }, 30000);

    };

    const handleRefund = async () => {
        if (!refundAvailable) return;

        setIsRefunding(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken');

            // Сначала получаем JWT токен для отладки
            console.log('🔍 Получаем JWT токен для отладки...');
            console.log('🔍 URL для JWT токена:', `${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/refund/jwt`);
            console.log('🔍 Токен авторизации:', token ? `${token.substring(0, 20)}...` : 'НЕТ ТОКЕНА');

            const jwtResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/refund/jwt`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('🔍 JWT Response status:', jwtResponse.status);
            console.log('🔍 JWT Response ok:', jwtResponse.ok);

            if (jwtResponse.ok) {
                const jwtData = await jwtResponse.json();
                console.log('🔐 JWT токен для возврата:', jwtData.jwtToken);
                console.log('📋 Данные для возврата:', jwtData.refundData);
                console.log('🔍 Декодированный payload:', JSON.parse(atob(jwtData.jwtToken.split('.')[1])));
            } else {
                const errorText = await jwtResponse.text();
                console.warn('⚠️ Не удалось получить JWT токен для отладки:', jwtResponse.status, errorText);
            }

            const finalEmail = (user?.email || (invoice as Invoice)?.participant_email || '').trim();
            const finalReason = 'Возврат по запросу пользователя';

            if (!finalEmail) {
                throw new Error('Не удалось определить e-mail для возврата. Обратитесь в поддержку.');
            }

            // Отправляем запрос на возврат c указанием причины и e-mail
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://waxhands.ru/api'}/robokassa/invoices/${invoice.id}/refund/initiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: finalReason,
                    email: finalEmail
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка API возврата:', response.status, errorText);
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }

            const result: RefundResponse = await response.json();

            if (result.success) {
                console.log('✅ Возврат инициирован успешно:', result);
                onRefundSuccess?.();
                // Обновляем страницу для отображения нового статуса
                window.location.reload();
            } else {
                setError(result.error || 'Ошибка создания возврата');
            }
        } catch (err) {
            console.error('❌ Ошибка при создании возврата:', err);
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании возврата';
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
                        Оплата
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
                    Оплата
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
                        {schoolPaymentDisabled ? (
                            <div className="text-center text-sm text-gray-600 p-4 border rounded-md bg-gray-50">
                                <p className="font-medium mb-2">Оплата на данный мастер-класс закрыта.</p>
                                <p>Для оплаты напишите в WhatsApp:</p>
                                <div className="flex flex-col gap-1 mt-2">
                                    <a href="https://wa.me/79145470606" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                                        <MessageCircle className="h-4 w-4" /> +7 914 547-06-06
                                    </a>
                                    <a href="https://wa.me/79145450606" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                                        <MessageCircle className="h-4 w-4" /> +7 914 545-06-06
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>
                )}

                {invoice.status === 'paid' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Счет оплачен</span>
                            {invoice.payment_method === 'cash' && (
                                <span className="text-xs text-gray-500">(наличными)</span>
                            )}
                        </div>

                        {/* Кнопка возврата показывается только для онлайн оплаты (не для наличных) */}
                        {refundAvailable && invoice.payment_method !== 'cash' && (
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

                        {!refundAvailable && invoice.payment_method !== 'cash' && (
                            <p className="text-sm text-muted-foreground">
                                Возврат возможен только до 3 часов до начала мастер-класса
                            </p>
                        )}

                        {invoice.payment_method === 'cash' && (
                            <p className="text-sm text-gray-600">
                                Оплата произведена наличными. Возврат оформляется напрямую с администратором.
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
