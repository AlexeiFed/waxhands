/**
 * @file: InvoicesTab.tsx
 * @description: Вкладка управления счетами для админ-панели
 * @dependencies: Table, Button, Badge, Input, Select, useInvoices, useUpdateInvoiceStatus, Calendar, useQueryClient
 * @created: 2024-12-19
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardContentCompact, CardDescription, CardHeader, CardHeaderCompact, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useInvoices, useUpdateInvoiceStatus } from '@/hooks/use-invoices';
import { Invoice, InvoiceFilters } from '@/types';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, DollarSign, Calendar as CalendarIcon, MapPin, Users, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ru } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const InvoicesTab: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [filters, setFilters] = useState<InvoiceFilters>({
        city: '',
        school_name: '',
        class_group: '',
        status: 'all',
        workshop_date: ''
    });
    const [userFullNames, setUserFullNames] = useState<{ [key: string]: string }>({});

    const { data: invoicesData, isLoading, error } = useInvoices(filters);
    const updateStatusMutation = useUpdateInvoiceStatus();

    // Функция для получения полных имен пользователей
    const fetchUserFullNames = async (userIds: string[]) => {
        try {
            const uniqueIds = [...new Set(userIds)].filter(id => !userFullNames[id]);
            if (uniqueIds.length === 0) return;

            const promises = uniqueIds.map(async (userId) => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/users/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            const user = data.data;
                            const fullName = user.surname ? `${user.name} ${user.surname}` : user.name;
                            return { userId, fullName };
                        }
                    }
                } catch (error) {
                    console.error(`Ошибка при получении данных пользователя ${userId}:`, error);
                }
                return null;
            });

            const results = await Promise.all(promises);
            const newNames = results
                .filter(Boolean)
                .reduce((acc, result) => {
                    if (result) {
                        acc[result.userId] = result.fullName;
                    }
                    return acc;
                }, {} as { [key: string]: string });

            if (Object.keys(newNames).length > 0) {
                setUserFullNames(prev => ({ ...prev, ...newNames }));
            }
        } catch (error) {
            console.error('Ошибка при получении полных имен пользователей:', error);
        }
    };

    // Автоматическая синхронизация при загрузке страницы (только один раз)
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);

    useEffect(() => {
        let isSyncing = false;

        const autoSync = async () => {
            if (isSyncing) return; // Предотвращаем повторный запуск

            try {
                isSyncing = true;
                setIsAutoSyncing(true);
                console.log('🔄 Автоматическая синхронизация счетов...');
                const result = await api.invoices.syncAllInvoicesWithParticipants();
                console.log('✅ Автосинхронизация завершена:', result);

                // Инвалидируем кэш для обновления отображения
                queryClient.invalidateQueries({ queryKey: ['master-classes'] });
                queryClient.invalidateQueries({ queryKey: ['workshop-stats'] });
                queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            } catch (error) {
                console.error('❌ Ошибка автосинхронизации:', error);
            } finally {
                isSyncing = false;
                setIsAutoSyncing(false);
            }
        };

        // Запускаем синхронизацию через 1 секунду после загрузки
        const timer = setTimeout(autoSync, 1000);
        return () => clearTimeout(timer);
    }, []); // Убираем queryClient из зависимостей

    console.log('InvoicesTab - invoicesData:', invoicesData);
    console.log('InvoicesTab - error:', error);
    console.log('InvoicesTab - invoicesData.invoices:', invoicesData?.invoices);
    console.log('InvoicesTab - invoicesData.total:', invoicesData?.total);

    const invoices = invoicesData?.invoices || [];
    const total = invoicesData?.total || 0;

    // Загружаем полные имена пользователей при изменении счетов
    useEffect(() => {
        if (invoices.length > 0) {
            const userIds = invoices.map(invoice => invoice.participant_id);
            fetchUserFullNames(userIds);
        }
    }, [invoices]);

    const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
        try {
            await updateStatusMutation.mutateAsync({ id: invoiceId, status: newStatus });

            // Инвалидируем кэш мастер-классов и статистики для обновления отображения
            queryClient.invalidateQueries({ queryKey: ['master-classes'] });
            queryClient.invalidateQueries({ queryKey: ['workshop-stats'] });
            queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });

            toast({
                title: "Статус обновлен",
                description: `Счет №${invoiceId} теперь имеет статус "${newStatus}"`,
            });
        } catch (error) {
            toast({
                title: "Ошибка",
                description: "Не удалось обновить статус счета",
                variant: "destructive",
            });
        }
    };



    const handleDeleteInvoice = async (invoiceId: string, masterClassId: string, participantId: string) => {
        try {
            // Сначала удаляем участника из мастер-класса
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/workshop-registrations/remove-participant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    workshopId: masterClassId,
                    userId: participantId
                })
            });

            // Затем удаляем сам счет
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invoices/${invoiceId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            toast({
                title: "Счет удален",
                description: "Счет и участник успешно удалены из мастер-класса",
            });

            // Обновляем данные без перезагрузки страницы
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['masterClasses'] });
        } catch (error) {
            console.error('Ошибка при удалении счета:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось удалить счет",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500 text-white">✅ Оплачено</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500 text-white">⏳ Ожидает оплаты</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-500 text-white">❌ Отменено</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getStatusActions = (invoice: Invoice) => {
        if (invoice.status === 'pending') {
            return (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                    >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Оплачено
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(invoice.id, 'cancelled')}
                    >
                        <XCircle className="w-4 h-4 mr-1" />
                        Отменить
                    </Button>
                </div>
            );
        } else if (invoice.status === 'paid') {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="cursor-not-allowed"
                >
                    ✅ Оплачено
                </Button>
            );
        } else if (invoice.status === 'cancelled') {
            return (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="cursor-not-allowed"
                    >
                        ❌ Отменено
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteInvoice(invoice.id, invoice.master_class_id, invoice.participant_id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                    </Button>
                </div>
            );
        } else {
            return (
                <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="cursor-not-allowed"
                >
                    ❌ Отменено
                </Button>
            );
        }
    };

    // Получение счетов для выбранной даты
    const getInvoicesForDate = (date: Date): Invoice[] => {
        // Используем локальную дату без смещения часового пояса
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        return invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.workshop_date);
            const invoiceYear = invoiceDate.getFullYear();
            const invoiceMonth = String(invoiceDate.getMonth() + 1).padStart(2, '0');
            const invoiceDay = String(invoiceDate.getDate()).padStart(2, '0');
            const invoiceDateStr = `${invoiceYear}-${invoiceMonth}-${invoiceDay}`;

            return invoiceDateStr === dateStr;
        });
    };

    // Обработка выбора даты в календаре
    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            // Используем локальную дату без смещения часового пояса
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            setFilters(prev => ({ ...prev, workshop_date: dateStr }));
        } else {
            setFilters(prev => ({ ...prev, workshop_date: '' }));
        }
    };

    // Сброс всех фильтров
    const resetFilters = () => {
        setFilters({
            city: '',
            school_name: '',
            class_group: '',
            status: 'all',
            workshop_date: ''
        });
        setSelectedDate(undefined);
    };

    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
    const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + invoice.amount, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-lg text-orange-600">Загрузка счетов...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                    <p className="text-red-600">Ошибка при загрузке счетов: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопки действий */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-primary">Счета мастер-классов</h2>
                    <p className="text-muted-foreground">
                        Управление счетами и статусами оплаты
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${isAutoSyncing
                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                        : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                        <RefreshCw className={`w-4 h-4 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                        <span>{isAutoSyncing ? 'Синхронизация...' : 'Автосинхронизация'}</span>
                    </div>
                </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-blue-600">Общая сумма</p>
                                <p className="text-xl font-bold text-blue-800">{totalAmount} ₽</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm text-green-600">Оплачено</p>
                                <p className="text-xl font-bold text-green-800">{paidAmount} ₽</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <div>
                                <p className="text-sm text-yellow-600">Ожидает оплаты</p>
                                <p className="text-xl font-bold text-yellow-800">{pendingAmount} ₽</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="text-sm text-purple-600">Всего счетов</p>
                                <p className="text-xl font-bold text-purple-800">{total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Фильтры и календарь в одной строке */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Фильтры - растягиваем на 2 колонки */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Фильтры поиска
                        </CardTitle>
                        <CardDescription>
                            Настройте параметры для поиска счетов
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city-filter">Город</Label>
                                <Input
                                    id="city-filter"
                                    placeholder="Все города"
                                    value={filters.city}
                                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="school-filter">Школа</Label>
                                <Input
                                    id="school-filter"
                                    placeholder="Все школы"
                                    value={filters.school_name}
                                    onChange={(e) => setFilters(prev => ({ ...prev, school_name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="class-filter">Класс</Label>
                                <Input
                                    id="class-filter"
                                    placeholder="Все классы"
                                    value={filters.class_group}
                                    onChange={(e) => setFilters(prev => ({ ...prev, class_group: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="status-filter">Статус</Label>
                                <Select value={filters.status} onValueChange={(value: 'all' | 'pending' | 'paid' | 'cancelled') => setFilters(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Все статусы" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все статусы</SelectItem>
                                        <SelectItem value="pending">Ожидает оплаты</SelectItem>
                                        <SelectItem value="paid">Оплачено</SelectItem>
                                        <SelectItem value="cancelled">Отменено</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date-filter">Дата</Label>
                                <Input
                                    id="date-filter"
                                    type="date"
                                    value={filters.workshop_date}
                                    onChange={(e) => setFilters(prev => ({ ...prev, workshop_date: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="flex-1"
                            >
                                Сбросить фильтры
                            </Button>
                            <Button
                                className="flex-1 bg-orange-500 hover:bg-orange-600"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Поиск
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Календарь - справа */}
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Календарь счетов
                        </CardTitle>
                        <CardDescription>
                            Нажмите на дату для фильтрации по счетам
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="rounded-md border w-full"
                            locale={ru}
                            weekStartsOn={1}
                            modifiers={{
                                hasInvoices: (date) => getInvoicesForDate(date).length > 0
                            }}
                            modifiersStyles={{
                                hasInvoices: { backgroundColor: "hsl(var(--accent))" }
                            }}
                            components={{
                                DayContent: ({ date, displayMonth, activeModifiers, ...props }) => {
                                    const dayInvoices = getInvoicesForDate(date);
                                    return (
                                        <div className="relative w-full h-full">
                                            <div
                                                {...props}
                                                className={`w-full h-full p-1 text-center text-sm ${activeModifiers.hasInvoices ? 'font-bold' : ''
                                                    }`}
                                            >
                                                {date.getDate()}
                                            </div>
                                            {dayInvoices.length > 0 && (
                                                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                                    {dayInvoices.length}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        />
                        {selectedDate && (
                            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-800">
                                    Счета на {selectedDate.toLocaleDateString('ru-RU')}:
                                </p>
                                <p className="text-lg font-bold text-orange-900">
                                    {getInvoicesForDate(selectedDate).length} шт.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Таблица счетов */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Счета мастер-классов</span>
                        <div className="text-sm text-muted-foreground">
                            Найдено: {invoices.length} счетов
                        </div>
                    </CardTitle>
                    <CardDescription>
                        Управление счетами и статусами оплаты
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <DollarSign className="mx-auto h-16 w-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium mb-2">Счета не найдены</p>
                            <p className="text-sm">Попробуйте изменить параметры поиска или создать новый счет</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>№</TableHead>
                                        <TableHead>Плательщик</TableHead>
                                        <TableHead>Мастер-класс</TableHead>
                                        <TableHead>Школа</TableHead>
                                        <TableHead>Класс</TableHead>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-mono text-sm">{invoice.id.slice(0, 8)}...</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {userFullNames[invoice.participant_id] || invoice.participant_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">ID: {invoice.participant_id.slice(0, 8)}...</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">Мастер-класс</p>
                                                    <p className="text-sm text-gray-500">ID: {invoice.master_class_id.slice(0, 8)}...</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <span>{invoice.school_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{invoice.class_group}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-1">
                                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                                    <span>{new Date(invoice.workshop_date).toLocaleDateString('ru-RU')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">{invoice.amount} ₽</TableCell>
                                            <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                            <TableCell>{getStatusActions(invoice)}</TableCell>
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

export default InvoicesTab;
