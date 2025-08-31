/**
 * @file: PaymentMonitoringTab.tsx
 * @description: Вкладка мониторинга платежей для админ-панели
 * @dependencies: Card, Table, Badge, Button, useWebSocket
 * @created: 2025-01-26
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, RefreshCw, Search, Filter } from 'lucide-react';

interface PaymentRecord {
    id: string;
    invoiceId: string;
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    sender?: string;
    operationId: string;
    label?: string;
    status: 'success' | 'pending' | 'failed';
    createdAt: string;
}

interface PaymentStats {
    totalPayments: number;
    totalAmount: number;
    successPayments: number;
    failedPayments: number;
    pendingPayments: number;
    averageAmount: number;
}

const PaymentMonitoringTab: React.FC = () => {
    const { toast } = useToast();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [stats, setStats] = useState<PaymentStats>({
        totalPayments: 0,
        totalAmount: 0,
        successPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        averageAmount: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        paymentMethod: 'all',
        dateFrom: '',
        dateTo: '',
        search: ''
    });

    // WebSocket для получения обновлений в реальном времени
    const { isConnected, subscribe, unsubscribe } = useWebSocket({
        onMessage: (message) => {
            if (message.type === 'payment_update') {
                // Обновляем статистику и список платежей
                refreshPayments();
                toast({
                    title: 'Новый платеж',
                    description: `Получен платеж на сумму ${message.data.amount} ${message.data.currency}`,
                });
            }
        }
    });

    // Подписываемся на обновления платежей
    useEffect(() => {
        subscribe('payments', 'admin');

        return () => {
            unsubscribe('payments');
        };
    }, [subscribe, unsubscribe]);

    // Загружаем данные при монтировании
    useEffect(() => {
        refreshPayments();
    }, []);

    // Функция для загрузки платежей
    const refreshPayments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/payments/history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setPayments(data.data.payments || []);
                    setStats(data.data.stats || stats);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки платежей:', error);
            toast({
                title: 'Ошибка',
                description: 'Не удалось загрузить данные о платежах',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Фильтрация платежей
    const filteredPayments = payments.filter(payment => {
        if (filters.status !== 'all' && payment.status !== filters.status) return false;
        if (filters.paymentMethod !== 'all' && payment.paymentMethod !== filters.paymentMethod) return false;
        if (filters.search && !payment.invoiceId.includes(filters.search) && !payment.paymentId.includes(filters.search)) return false;
        if (filters.dateFrom && new Date(payment.paymentDate) < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && new Date(payment.paymentDate) > new Date(filters.dateTo)) return false;
        return true;
    });

    // Функция для получения цвета статуса
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Функция для получения текста статуса
    const getStatusText = (status: string) => {
        switch (status) {
            case 'success':
                return 'Успешно';
            case 'pending':
                return 'В обработке';
            case 'failed':
                return 'Ошибка';
            default:
                return 'Неизвестно';
        }
    };

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Мониторинг платежей</h2>
                    <p className="text-muted-foreground">
                        Отслеживание всех платежей и статистика в реальном времени
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <div className="flex items-center gap-1 text-green-600">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span className="text-sm">WebSocket подключен</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-red-600">
                                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                <span className="text-sm">WebSocket отключен</span>
                            </div>
                        )}
                    </div>
                    <Button onClick={refreshPayments} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Обновить
                    </Button>
                </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm text-green-600">Общая сумма</p>
                                <p className="text-xl font-bold text-green-800">{stats.totalAmount} ₽</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-600">Успешных платежей</p>
                                <p className="text-xl font-bold text-blue-800">{stats.successPayments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-sm text-yellow-600">В обработке</p>
                                <p className="text-xl font-bold text-yellow-800">{stats.pendingPayments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <div>
                                <p className="text-sm text-red-600">Ошибок</p>
                                <p className="text-xl font-bold text-red-800">{stats.failedPayments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Фильтры */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Фильтры
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Статус</label>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Все статусы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="success">Успешно</SelectItem>
                                    <SelectItem value="pending">В обработке</SelectItem>
                                    <SelectItem value="failed">Ошибка</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Метод оплаты</label>
                            <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Все методы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все методы</SelectItem>
                                    <SelectItem value="P2P transfer">P2P перевод</SelectItem>
                                    <SelectItem value="Card payment">Оплата картой</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Дата от</label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Дата до</label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Поиск</label>
                            <Input
                                placeholder="ID счета или платежа"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Таблица платежей */}
            <Card>
                <CardHeader>
                    <CardTitle>История платежей</CardTitle>
                    <CardDescription>
                        Найдено: {filteredPayments.length} платежей
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <DollarSign className="mx-auto h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">Платежи не найдены</p>
                            <p className="text-sm">Попробуйте изменить параметры фильтрации</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID платежа</TableHead>
                                        <TableHead>ID счета</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Метод</TableHead>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Отправитель</TableHead>
                                        <TableHead>Метка</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono text-sm">
                                                {payment.paymentId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {payment.invoiceId.slice(0, 8)}...
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">
                                                {payment.amount} {payment.currency}
                                            </TableCell>
                                            <TableCell>{payment.paymentMethod}</TableCell>
                                            <TableCell>
                                                {new Date(payment.paymentDate).toLocaleDateString('ru-RU')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(payment.status)}>
                                                    {getStatusText(payment.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {payment.sender || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {payment.label ? (
                                                    <div className="text-xs font-mono bg-gray-100 p-1 rounded">
                                                        {payment.label.slice(0, 20)}...
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentMonitoringTab;

