/**
 * @file: InvoiceCard.tsx
 * @description: Карточка счета для мобильной админ-панели
 * @dependencies: AdminCardBase, Badge, Button, AlertDialog, utils, types
 * @created: 2025-11-10
 */

import React from 'react';
import { Invoice } from '@/types';
import { AdminCardBase } from './AdminCardBase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import {
    CreditCard,
    MapPin,
    Calendar as CalendarIcon,
    Users,
    DollarSign,
    CheckCircle,
    XCircle,
    Trash2,
    FileText,
} from 'lucide-react';

type InvoiceStatus = Invoice['status'];

const STATUS_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
    pending: {
        label: '⏳ Ожидает оплаты',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    paid: {
        label: '✅ Оплачено',
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    cancelled: {
        label: '❌ Отменено',
        className: 'bg-red-100 text-red-700 border-red-200',
    },
};

const STATUS_TONE: Record<InvoiceStatus, 'default' | 'success' | 'warning' | 'danger'> = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'danger',
};

interface InvoiceCardProps {
    invoice: Invoice;
    participantFullName?: string;
    onViewDetails?: (invoice: Invoice) => void;
    onMarkPaid?: (invoice: Invoice) => void;
    onMarkCancelled?: (invoice: Invoice) => void;
    onDelete?: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
    invoice,
    participantFullName,
    onViewDetails,
    onMarkPaid,
    onMarkCancelled,
    onDelete,
}) => {
    const statusMeta = STATUS_BADGE[invoice.status];
    const tone = STATUS_TONE[invoice.status] ?? 'default';
    const schoolLine = invoice.school_name || invoice.city ? `${invoice.school_name ?? 'Неизвестная школа'}${invoice.city ? ` • ${invoice.city}` : ''}` : undefined;
    const formattedDate = invoice.workshop_date ? new Date(invoice.workshop_date).toLocaleDateString('ru-RU') : 'Дата не указана';

    const renderStatusActions = () => {
        if (invoice.status === 'pending') {
            return (
                <div className="flex flex-wrap items-center gap-2">
                    {onMarkPaid && (
                        <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={(event) => {
                                event.stopPropagation();
                                onMarkPaid(invoice);
                            }}
                        >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Оплачено
                        </Button>
                    )}
                    {onMarkCancelled && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                                event.stopPropagation();
                                onMarkCancelled(invoice);
                            }}
                        >
                            <XCircle className="mr-1 h-4 w-4" />
                            Отменить
                        </Button>
                    )}
                </div>
            );
        }

        if (invoice.status === 'cancelled' && onDelete) {
            return (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Удалить
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить счет?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Это действие нельзя отменить. Счет и связанные данные будут удалены.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(invoice)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Удалить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            );
        }

        if (invoice.status === 'paid') {
            return (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                    Оплата подтверждена
                </Badge>
            );
        }

        return null;
    };

    return (
        <AdminCardBase
            title={participantFullName || invoice.participant_name || 'Без имени'}
            subtitle={`Счет № ${invoice.id.slice(0, 8)}… • ${formattedDate}`}
            leading={(
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <CreditCard className="h-5 w-5" />
                </span>
            )}
            meta={(
                <Badge className={cn('border px-2 py-0.5 text-xs', statusMeta.className)}>
                    {statusMeta.label}
                </Badge>
            )}
            tone={tone}
            onClick={onViewDetails ? () => onViewDetails(invoice) : undefined}
            footer={(
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>ID участника: {invoice.participant_id.slice(0, 8)}…</span>
                        <span>•</span>
                        <span>ID мастер-класса: {invoice.master_class_id.slice(0, 8)}…</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {onViewDetails && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onViewDetails(invoice);
                                }}
                            >
                                <FileText className="mr-1 h-4 w-4" />
                                Подробнее
                            </Button>
                        )}
                        {renderStatusActions()}
                    </div>
                </div>
            )}
        >
            <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-base font-semibold text-gray-900">{invoice.amount.toLocaleString('ru-RU')} ₽</span>
                </div>

                {schoolLine && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span>{schoolLine}</span>
                    </div>
                )}

                {invoice.class_group && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>Класс: {invoice.class_group}</span>
                    </div>
                )}

                <div className="rounded-lg bg-orange-50/80 p-3 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between gap-2">
                        <span>Стилей:</span>
                        <span className="font-semibold">{invoice.selected_styles?.length ?? 0}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span>Опций:</span>
                        <span className="font-semibold">{invoice.selected_options?.length ?? 0}</span>
                    </div>
                </div>

                {(invoice.payment_label || invoice.payment_method || invoice.payment_date) && (
                    <div className="rounded-lg bg-green-50/80 p-3 text-xs text-gray-600 space-y-1">
                        <div className="font-semibold text-green-700">Детали оплаты</div>
                        {invoice.payment_label && (
                            <div className="font-mono break-all">{invoice.payment_label}</div>
                        )}
                        {invoice.payment_method && (
                            <div className="flex justify-between gap-2">
                                <span>Метод:</span>
                                <span className="font-semibold text-gray-700">{invoice.payment_method}</span>
                            </div>
                        )}
                        {invoice.payment_date && (
                            <div className="flex justify-between gap-2">
                                <span>Дата:</span>
                                <span>{new Date(invoice.payment_date).toLocaleDateString('ru-RU')}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminCardBase>
    );
};

export default InvoiceCard;





