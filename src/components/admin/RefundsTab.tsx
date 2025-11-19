/**
 * @file: RefundsTab.tsx
 * @description: Вкладка возвратов в админ панели
 * @dependencies: Table, Card, Badge, Button
 * @created: 2025-01-27
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search,
    RefreshCw,
    Calendar,
    User,
    MessageSquare,
    RotateCcw
} from 'lucide-react';

interface RefundData {
    id: string;
    invoiceId: string;
    workshopDate: string;
    refundDate: string;
    parentName: string;
    parentSurname: string;
    email?: string | null;
    reason: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    refundRequestId?: string;
    serviceName?: string;
}

export const RefundsTab: React.FC = () => {
    const [refunds, setRefunds] = useState<RefundData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { toast } = useToast();

    const loadRefunds = async () => {
        try {
            setLoading(true);
            const response = await api.admin.getRefunds();
            if (response.success && response.data) {
                const mappedRefunds = (response.data as Array<Record<string, unknown>>)
                    .map((item) => {
                        const rawStatus = (item.status as string | undefined)?.toLowerCase() ?? 'pending';
                        const isKnownStatus = rawStatus === 'pending' || rawStatus === 'completed' || rawStatus === 'cancelled';

                        if (!isKnownStatus) {
                            return null;
                        }

                        return {
                            id: item.id as string,
                            invoiceId: (item.invoice_id as string) ?? (item.id as string),
                            workshopDate: item.workshop_date as string,
                            refundDate: item.refund_date as string,
                            parentName: item.parent_name as string,
                            parentSurname: item.parent_surname as string,
                            email: (item.refund_email as string) || '',
                            reason: (item.reason as string) || '',
                            amount: Number(item.amount) || 0,
                            status: rawStatus as RefundData['status'],
                            refundRequestId: item.refund_request_id as string | undefined,
                            serviceName: item.service_name as string | undefined,
                        };
                    })
                    .filter((item): item is RefundData => item !== null);

                setRefunds(mappedRefunds);
            }
        } catch (error) {
            console.error('Ошибка загрузки возвратов:', error);
            toast({
                title: "Ошибка",
                description: "Не удалось загрузить данные о возвратах",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRefunds();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">В обработке</Badge>;
            case 'completed':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Завершен</Badge>;
            case 'cancelled':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Отменен</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredRefunds = refunds.filter(refund => {
        const matchesSearch = searchTerm === '' ||
            refund.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refund.parentSurname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refund.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            refund.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (refund.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5" />
                        Возвраты
                    </CardTitle>
                    <CardDescription>
                        Управление возвратами средств по мастер-классам
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Фильтры и поиск */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Поиск по имени, фамилии, причине или услуге..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Статус" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все статусы</SelectItem>
                                <SelectItem value="pending">В обработке</SelectItem>
                                <SelectItem value="completed">Завершен</SelectItem>
                                <SelectItem value="cancelled">Отменен</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={loadRefunds}
                            variant="outline"
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Обновить
                        </Button>
                    </div>

                    {/* Таблица возвратов */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Дата мастер-класса</TableHead>
                                    <TableHead>Дата возврата</TableHead>
                                    <TableHead>Родитель</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Услуга</TableHead>
                                    <TableHead>Сумма</TableHead>
                                    <TableHead>Причина возврата</TableHead>
                                    <TableHead>Статус</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Загрузка...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRefunds.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            Возвраты не найдены
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRefunds.map((refund) => (
                                        <TableRow key={refund.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {format(new Date(refund.workshopDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(refund.refundDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    {refund.parentName} {refund.parentSurname}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {refund.email ? (
                                                    <a href={`mailto:${refund.email}`} className="text-blue-600 hover:underline">
                                                        {refund.email}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">Не указан</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {refund.serviceName || 'Не указано'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{refund.amount.toLocaleString('ru-RU')} ₽</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-600 line-clamp-2">
                                                        {refund.reason?.trim() ? refund.reason : 'Не указана'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(refund.status)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Статистика */}
                    {refunds.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {refunds.filter(r => r.status === 'pending').length}
                                    </div>
                                    <p className="text-sm text-gray-600">В обработке</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {refunds.filter(r => r.status === 'completed').length}
                                    </div>
                                    <p className="text-sm text-gray-600">Завершено</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {refunds.reduce((sum, r) => sum + r.amount, 0)} ₽
                                    </div>
                                    <p className="text-sm text-gray-600">Общая сумма</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
