/**
 * @file: yandex-payment-button.tsx
 * @description: Компонент для оплаты мастер-классов через Яндекс.Формы и ЮMoney
 * @dependencies: Button, useToast, useAuth
 * @created: 2024-12-19
 */

import React, { useState } from 'react';
import { Button } from './button';
import { CreditCard, Loader2, CheckCircle, XCircle, ExternalLink, Users } from 'lucide-react';
import { useToast } from './use-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Child {
    id: string;
    name: string;
    age?: number;
    selectedServices: string[];
    totalAmount: number;
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

const YandexPaymentButton: React.FC<YandexPaymentButtonProps> = ({
    invoiceId,
    amount,
    description,
    children,
    masterClassName = 'Мастер-класс',
    eventDate,
    eventTime,
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

    const handlePaymentClick = async () => {
        if (isPaymentDisabled) {
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
            // Формируем детализированные данные для Яндекс.Формы
            const formData: {
                invoice_id: string;
                amount: number;
                description: string;
                master_class_name: string;
                event_date: string;
                event_time: string;
                customer_name: string;
                customer_phone: string;
                children_count: number;
                children_names: string;
                children_details: Array<{
                    name: string;
                    age: string;
                    services: string;
                    amount: number;
                }>;
                services_summary: string;
                timestamp: number;
                payment_label?: string;
            } = {
                // Основная информация о счете
                invoice_id: invoiceId,
                amount: amount,
                description: description,
                master_class_name: masterClassName,
                event_date: eventDate || 'Не указана',
                event_time: eventTime || 'Не указано',

                // Информация о плательщике
                customer_name: user.name || '',
                customer_phone: user.phone || '',

                // Информация о детях
                children_count: children.length,
                children_names: children.map(child => child.name).join(', '),
                children_details: children.map(child => ({
                    name: child.name,
                    age: String(child.age || 'Не указан'),
                    services: child.selectedServices.join(', '),
                    amount: child.totalAmount
                })),

                // Детализация услуг
                services_summary: children.map(child =>
                    `${child.name}: ${child.selectedServices.join(', ')} - ${child.totalAmount} ₽`
                ).join('\n'),

                // Временная метка
                timestamp: Date.now()
            };

            // Получаем payment_label для счета
            let paymentLabel = '';
            try {
                console.log('🔍 Запрашиваем данные счета:', invoiceId);
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/${invoiceId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                console.log('📡 Ответ API:', response.status, response.ok);

                if (response.ok) {
                    const invoiceData = await response.json();
                    console.log('📋 Данные счета:', invoiceData);

                    if (invoiceData.success && invoiceData.data && invoiceData.data.payment_label) {
                        paymentLabel = invoiceData.data.payment_label;
                        console.log('🏷️ Получена метка платежа:', paymentLabel);
                    } else {
                        console.warn('⚠️ payment_label не найден в ответе:', {
                            success: invoiceData.success,
                            hasData: !!invoiceData.data,
                            payment_label: invoiceData.data?.payment_label
                        });
                    }
                } else {
                    console.error('❌ Ошибка API:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('❌ Ошибка получения метки платежа:', error);
            }

            // Добавляем payment_label в formData
            if (paymentLabel) {
                formData.payment_label = paymentLabel;
                console.log('✅ payment_label добавлен в formData:', paymentLabel);
            } else {
                console.warn('⚠️ payment_label не добавлен - пустой');
            }

            // Создаем URL для Яндекс.Формы с параметрами
            const yandexFormUrl = new URL(import.meta.env.VITE_YANDEX_FORM_URL || 'https://forms.yandex.ru/your-form-id');

            console.log('🔗 Базовый URL формы:', yandexFormUrl.toString());
            console.log('📋 formData для передачи:', formData);

            // Добавляем параметры в URL
            Object.entries(formData).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    // Для объектов (например, children_details) передаем как JSON строку
                    yandexFormUrl.searchParams.append(key, JSON.stringify(value));
                    console.log(`📤 Добавлен параметр ${key}:`, JSON.stringify(value));
                } else {
                    yandexFormUrl.searchParams.append(key, value.toString());
                    console.log(`📤 Добавлен параметр ${key}:`, value.toString());
                }
            });

            console.log('🔗 Финальный URL с параметрами:', yandexFormUrl.toString());

            // Добавляем параметры для ЮMoney (важно для webhook'ов)
            yandexFormUrl.searchParams.append('yumoney_metadata', JSON.stringify({
                invoice_id: invoiceId,
                participant_name: children.map(child => child.name).join(', '),
                master_class_name: masterClassName,
                amount: amount,
                description: description
            }));

            console.log('🔗 Открываем Яндекс.Форму с параметрами:', yandexFormUrl.toString());

            // Открываем Яндекс.Форму в новом окне
            const paymentWindow = window.open(
                yandexFormUrl.toString(),
                'yandex_payment',
                'width=900,height=700,scrollbars=yes,resizable=yes'
            );

            if (!paymentWindow) {
                throw new Error('Не удалось открыть окно оплаты. Проверьте блокировщик рекламы.');
            }

            // Начинаем проверку статуса оплаты
            checkPaymentStatus(invoiceId);

        } catch (error) {
            console.error('Ошибка открытия формы оплаты:', error);
            setPaymentStatus({
                status: 'error',
                message: 'Не удалось открыть форму оплаты'
            });
            onPaymentError?.('Не удалось открыть форму оплаты');
        }
    };

    // Функция для проверки статуса оплаты
    const checkPaymentStatus = async (invoiceId: string) => {
        const maxAttempts = 60; // 5 минут с интервалом 5 секунд
        let attempts = 0;

        const checkInterval = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/${invoiceId}`, {
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
                console.error('Ошибка проверки статуса:', error);
            }

            // Прерываем проверку если превышено количество попыток
            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                setPaymentStatus({ status: 'idle' });
                toast({
                    title: "Время ожидания истекло",
                    description: "Проверьте статус оплаты в личном кабинете или обратитесь к администратору.",
                    variant: "destructive",
                });
            }
        }, 5000); // Проверяем каждые 5 секунд
    };

    const getButtonContent = () => {
        if (isPaymentDisabled) {
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
                        Открываем форму...
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

    const isButtonDisabled = disabled || isPaymentDisabled || paymentStatus.status === 'loading' || paymentStatus.status === 'success';

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

            {paymentStatus.status === 'idle' && !isPaymentDisabled && (
                <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                        После нажатия откроется Яндекс.Форма для проверки данных, затем переход в ЮMoney
                    </p>
                    {children.length > 1 && (
                        <p className="text-xs text-blue-600">
                            💡 Записано детей: {children.length} • Общая сумма: {amount} ₽
                        </p>
                    )}
                </div>
            )}

            {isPaymentDisabled && (
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
