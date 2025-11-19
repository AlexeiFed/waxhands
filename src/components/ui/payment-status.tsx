/**
 * @file: payment-status.tsx
 * @description: Компонент для отображения статуса оплаты с WebSocket обновлениями
 * @dependencies: Badge, Button, useWebSocket
 * @created: 2025-01-26
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, XCircle, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';

interface PaymentStatusProps {
    invoiceId: string;
    status: 'pending' | 'paid' | 'cancelled';
    paymentMethod?: string;
    paymentDate?: string;
    paymentId?: string;
    paymentLabel?: string;
    onStatusUpdate?: (newStatus: string) => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
    invoiceId,
    status,
    paymentMethod,
    paymentDate,
    paymentId,
    paymentLabel,
    onStatusUpdate
}) => {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(status);

    // WebSocket для получения обновлений в реальном времени
    const { isConnected, subscribe, unsubscribe } = useWebSocket({
        onMessage: (message) => {
            if (message.type === 'invoice_update' && message.data.invoiceId === invoiceId) {
                const newStatus = message.data.status;
                if (newStatus !== currentStatus) {
                    setCurrentStatus(newStatus);
                    onStatusUpdate?.(newStatus);
                    toast({
                        title: 'Статус обновлен',
                        description: `Статус счета изменен на: ${newStatus}`,
                    });
                }
            }
        }
    });

    // Подписываемся на обновления для конкретного счета
    useEffect(() => {
        const handleInvoiceUpdate = (data: { invoiceId: string; status: string }) => {
            if (data.invoiceId === invoiceId) {
                // Проверяем, что статус соответствует ожидаемым значениям
                const validStatus = data.status as 'pending' | 'paid' | 'cancelled';
                if (['pending', 'paid', 'cancelled'].includes(validStatus)) {
                    setCurrentStatus(validStatus);
                }
            }
        };

        const unsubscribeFn = subscribe('invoices', handleInvoiceUpdate);

        return unsubscribeFn;
    }, [subscribe, invoiceId]);

    // Обновляем локальный статус при изменении пропса
    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    // Функция для получения иконки статуса
    const getStatusIcon = () => {
        switch (currentStatus) {
            case 'paid':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-600" />;
        }
    };

    // Функция для получения цвета бейджа
    const getStatusColor = () => {
        switch (currentStatus) {
            case 'paid':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Функция для получения текста статуса
    const getStatusText = () => {
        switch (currentStatus) {
            case 'paid':
                return 'Оплачено';
            case 'pending':
                return 'Ожидает оплаты';
            case 'cancelled':
                return 'Отменено';
            default:
                return 'Неизвестно';
        }
    };

    // Функция для обновления статуса
    const refreshStatus = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const updatedInvoice = data.data;
                    if (updatedInvoice.status !== status) {
                        onStatusUpdate?.(updatedInvoice.status);
                        toast({
                            title: 'Статус обновлен',
                            description: `Статус счета изменен на: ${updatedInvoice.status}`,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось обновить статус счета',
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* Основной статус */}
            <div className="flex items-center gap-2">
                {getStatusIcon()}
                <Badge className={getStatusColor()}>
                    {getStatusText()}
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshStatus}
                    disabled={isRefreshing}
                    className="h-6 w-6 p-0"
                >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                {/* Индикатор WebSocket соединения */}
                <div className="flex items-center gap-1">
                    {isConnected ? (
                        <Wifi className="w-3 h-3 text-green-600" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-red-600" />
                    )}
                </div>
            </div>

            {/* Детали оплаты */}
            {currentStatus === 'paid' && (
                <div className="text-xs space-y-1 text-gray-600">
                    {paymentMethod && (
                        <div>Метод: {paymentMethod}</div>
                    )}
                    {paymentDate && (
                        <div>Дата: {new Date(paymentDate).toLocaleDateString('ru-RU')}</div>
                    )}
                    {paymentId && (
                        <div className="font-mono">ID платежа: {paymentId.slice(0, 8)}...</div>
                    )}
                </div>
            )}

            {/* Метка платежа */}
            {paymentLabel && (
                <div className="text-xs">
                    <span className="text-gray-500">Метка: </span>
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {paymentLabel}
                    </span>
                </div>
            )}
        </div>
    );
};

export default PaymentStatus;
