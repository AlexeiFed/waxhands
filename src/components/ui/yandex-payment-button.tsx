/**
 * @file: yandex-payment-button.tsx
 * @description: Упрощенная кнопка оплаты через Robokassa (быстрый доступ после записи)
 * @dependencies: Button, useToast, useAuth, usePaymentSettings
 * @created: 2024-12-19
 * @updated: 2025-11-09
 */

import React, { useState } from 'react';
import { Button } from './button';
import { CreditCard, Loader2, CheckCircle, XCircle, ExternalLink, Users } from 'lucide-react';
import { useToast } from './use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { usePaymentSettings } from '@/hooks/use-payment-settings';

interface Child {
    id: string;
    name: string;
    age?: number;
    selectedServices: string[];
    totalAmount: number;
}

interface PaymentResponse {
    success: boolean;
    data?: {
        paymentUrl?: string;
        invoiceId?: string;
        formData?: Record<string, string | number | undefined>;
    };
    error?: string;
}

interface YandexPaymentButtonProps {
    invoiceId: string;
    amount: number;
    description: string;
    children: Child[];
    masterClassName?: string;
    eventDate?: string;
    eventTime?: string;
    onPaymentSuccess?: () => void;
    onPaymentError?: (error: string) => void;
    className?: string;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    disabled?: boolean;
    isPaymentDisabled?: boolean;
}

interface PaymentStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://waxhands.ru/api';

const openRobokassaWindow = (url: string) => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true) {
        window.location.href = url;
        return;
    }

    const paymentWindow = window.open(url, 'robokassa_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (!paymentWindow) {
        window.location.href = url;
        return;
    }

    const checkClosed = setInterval(() => {
        if (paymentWindow.closed) {
            clearInterval(checkClosed);
            window.location.reload();
        }
    }, 1000);

    setTimeout(() => {
        if (!paymentWindow.closed) {
            console.log('Окно оплаты Robokassa все еще открыто');
        }
    }, 30000);
};

const submitPaymentForm = (url: string, formData: NonNullable<PaymentResponse['data']>['formData']) => {
    if (!formData) {
        console.error('❌ Данные формы Robokassa отсутствуют');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';
    form.style.display = 'none';
    form.enctype = 'application/x-www-form-urlencoded';

    Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        }
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};

const showPaymentModal = (htmlContent: string) => {
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

    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
};

const processHtmlResponse = (rawText: string) => {
    let htmlText = rawText;

    try {
        const jsonData = JSON.parse(rawText);
        if (jsonData.html || jsonData.data) {
            htmlText = jsonData.html || jsonData.data;
        }
    } catch {
        // Не JSON — используем как HTML
    }

    const iframeMatch = htmlText.match(/src="([^"]+)"/);
    if (iframeMatch && iframeMatch[1]) {
        openRobokassaWindow(iframeMatch[1]);
        return;
    }

    if (htmlText.includes('document.write')) {
        const writeMatch = htmlText.match(/document\.write\("(.*)"\)/);
        if (writeMatch && writeMatch[1]) {
            const decodedHtml = writeMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\\//g, '/')
                .replace(/\\n/g, '')
                .replace(/\\t/g, '');

            const iframeMatch2 = decodedHtml.match(/src="([^"]+)"/);
            if (iframeMatch2 && iframeMatch2[1]) {
                openRobokassaWindow(iframeMatch2[1]);
                return;
            }

            showPaymentModal(decodedHtml);
            return;
        }
    }

    showPaymentModal(htmlText);
};

const YandexPaymentButton: React.FC<YandexPaymentButtonProps> = ({
    invoiceId,
    amount,
    children,
    onPaymentSuccess,
    onPaymentError,
    className = '',
    variant = 'default',
    size = 'default',
    disabled = false,
    isPaymentDisabled = false
}) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
    const { isEnabled: globalPaymentEnabled, isLoading: paymentSettingsLoading } = usePaymentSettings();

    // Блокируем кнопку только если настройки загружены И оплата выключена
    // Во время загрузки (paymentSettingsLoading) не блокируем кнопку
    const paymentDisabled = isPaymentDisabled || (!paymentSettingsLoading && !globalPaymentEnabled);

    const handlePaymentClick = async () => {
        // Если настройки еще загружаются, показываем сообщение
        if (paymentSettingsLoading) {
            toast({
                title: "Загрузка настроек",
                description: "Пожалуйста, подождите, идет загрузка настроек оплаты...",
                variant: "default",
            });
            return;
        }

        if (paymentDisabled) {
            toast({
                title: "Оплата временно недоступна",
                description: "Функция оплаты будет доступна в ближайшее время. Спасибо за понимание!",
                variant: "default",
            });
            return;
        }

        if (!user) {
            toast({
                title: "Ошибка",
                description: "Необходимо войти в систему для оплаты.",
                variant: "destructive",
            });
            return;
        }

        setPaymentStatus({ status: 'loading' });

        try {
            const token = localStorage.getItem('authToken');
            const directUrl = `${API_BASE}/robokassa/invoices/${invoiceId}/pay?t=${Date.now()}&nocache=${Math.random()}`;

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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                const result: PaymentResponse = await response.json();

                if (result.success && result.data) {
                    if (result.data.formData) {
                        submitPaymentForm(result.data.paymentUrl || 'https://auth.robokassa.ru/Merchant/Index.aspx', result.data.formData);
                    } else if (result.data.paymentUrl) {
                        openRobokassaWindow(result.data.paymentUrl);
                    } else {
                        throw new Error('Неизвестная структура ответа от сервера');
                    }
                } else {
                    throw new Error(result.error || 'Ошибка создания ссылки на оплату');
                }
            } else {
                const responseText = await response.text();
                processHtmlResponse(responseText);
            }

            checkPaymentStatus(invoiceId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось открыть форму оплаты';
            console.error('Ошибка открытия Robokassa:', error);
            setPaymentStatus({
                status: 'error',
                message,
            });
            toast({
                title: "Ошибка оплаты",
                description: message,
                variant: "destructive",
            });
            onPaymentError?.(message);
        }
    };

    const checkPaymentStatus = async (invoiceId: string) => {
        const maxAttempts = 60;
        let attempts = 0;

        const checkInterval = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const invoice = data.data;

                    if (invoice.status === 'paid') {
                        clearInterval(checkInterval);
                        setPaymentStatus({ status: 'success', message: 'Оплата прошла успешно' });
                        toast({
                            title: "Оплата успешна! 🎉",
                            description: "Статус счета обновлен. Спасибо за оплату!",
                        });
                        onPaymentSuccess?.();
                        return;
                    }
                }
            } catch (error) {
                console.error('Ошибка проверки статуса оплаты:', error);
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                setPaymentStatus({ status: 'idle' });
                toast({
                    title: "Время ожидания истекло",
                    description: "Проверьте статус оплаты в личном кабинете или обратитесь к администратору.",
                    variant: "destructive",
                });
            }
        }, 5000);
    };

    const getButtonContent = () => {
        if (paymentDisabled) {
            return (
                <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Оплата будет доступна позднее
                </>
            );
        }

        switch (paymentStatus.status) {
            case 'loading':
                return (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Открываем Robokassa...
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Оплачено
                    </>
                );
            case 'error':
                return (
                    <>
                        <XCircle className="w-4 h-4 mr-2 text-red-500" />
                        Ошибка
                    </>
                );
            default:
                return (
                    <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Оплатить {amount} ₽
                        {children.length > 1 && (
                            <Users className="w-3 h-3 ml-1" />
                        )}
                        <ExternalLink className="w-3 h-3 ml-1" />
                    </>
                );
        }
    };

    const isButtonDisabled = disabled || paymentDisabled || paymentStatus.status === 'loading' || paymentStatus.status === 'success';

    return (
        <div className="space-y-2">
            <Button
                onClick={handlePaymentClick}
                disabled={isButtonDisabled}
                variant={variant}
                size={size}
                className={`${className} ${paymentStatus.status === 'success'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : paymentStatus.status === 'error'
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : ''
                    }`}
            >
                {getButtonContent()}
            </Button>

            {paymentStatus.message && (
                <p className={`text-sm ${paymentStatus.status === 'success' ? 'text-green-600' :
                    paymentStatus.status === 'error' ? 'text-red-600' :
                        'text-gray-600'
                    }`}>
                    {paymentStatus.message}
                </p>
            )}

            {paymentStatus.status === 'idle' && !paymentDisabled && (
                <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                        После нажатия откроется защищенная форма Robokassa. Следуйте инструкции в новом окне.
                    </p>
                    {children.length > 1 && (
                        <p className="text-xs text-blue-600">
                            💡 Записано детей: {children.length} • Общая сумма: {amount} ₽
                        </p>
                    )}
                </div>
            )}

            {paymentDisabled && (
                <div className="space-y-1">
                    <p className="text-xs text-amber-600">
                        💳 Система оплаты находится в разработке
                    </p>
                    <p className="text-xs text-gray-500">
                        Счет создан, но оплата будет доступна в ближайшее время
                    </p>
                </div>
            )}
        </div>
    );
};

export default YandexPaymentButton;

