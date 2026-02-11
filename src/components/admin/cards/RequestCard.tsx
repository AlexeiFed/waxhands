/**
 * @file: RequestCard.tsx
 * @description: Карточка заявки на мастер-класс для мобильной админ-панели
 * @dependencies: AdminCardBase, Badge, Button, AlertDialog, types
 * @created: 2025-11-10
 */

import React from 'react';
import { WorkshopRequestWithParent } from '@/types';
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
import {
    GraduationCap,
    MapPin,
    Calendar as CalendarIcon,
    User,
    Mail,
    Phone,
    FileText,
    Trash2,
    MessageCircleWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RequestStatus = WorkshopRequestWithParent['status'];

const STATUS_META: Record<RequestStatus, { label: string; className: string; tone: 'default' | 'success' | 'warning' | 'danger' }> = {
    pending: {
        label: '⏳ В ожидании',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        tone: 'warning',
    },
    approved: {
        label: '✅ Подтверждена',
        className: 'bg-green-100 text-green-700 border-green-200',
        tone: 'success',
    },
    rejected: {
        label: '❌ Отклонена',
        className: 'bg-red-100 text-red-700 border-red-200',
        tone: 'danger',
    },
};

interface RequestCardProps {
    request: WorkshopRequestWithParent;
    onChangeStatus?: (request: WorkshopRequestWithParent) => void;
    onDelete?: (request: WorkshopRequestWithParent) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
    request,
    onChangeStatus,
    onDelete,
}) => {
    const statusMeta = STATUS_META[request.status] ?? STATUS_META.pending;
    const formattedCreated = new Date(request.created_at).toLocaleString('ru-RU');
    const updatedBlock =
        request.updated_at && request.updated_at !== request.created_at
            ? new Date(request.updated_at).toLocaleString('ru-RU')
            : null;

    const schoolLine = request.school_name
        ? `${request.school_name}${request.city ? ` • ${request.city}` : ''}`
        : request.city ?? undefined;

    return (
        <AdminCardBase
            title={`${request.parent_name}${request.parent_surname ? ` ${request.parent_surname}` : ''}`}
            subtitle={request.class_group ? `Класс/группа: ${request.class_group}` : undefined}
            meta={(
                <Badge className={cn('border px-2 py-0.5 text-xs', statusMeta.className)}>
                    {statusMeta.label}
                </Badge>
            )}
            leading={(
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <MessageCircleWarning className="h-5 w-5" />
                </span>
            )}
            tone={statusMeta.tone}
            footer={(
                <div className="flex flex-wrap items-center gap-2">
                    {onChangeStatus && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700"
                            onClick={(event) => {
                                event.stopPropagation();
                                onChangeStatus(request);
                            }}
                        >
                            <FileText className="mr-1 h-4 w-4" />
                            Изменить статус
                        </Button>
                    )}
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Удалить
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие нельзя отменить. Заявка будет удалена навсегда.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(request)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Удалить
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}
        >
            <div className="space-y-3 text-sm text-gray-700">
                {schoolLine && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span>{schoolLine}</span>
                    </div>
                )}

                {request.desired_date && (
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-blue-500" />
                        <span>Желаемая дата: {new Date(request.desired_date).toLocaleDateString('ru-RU')}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
                    {request.parent_phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            <span>{request.parent_phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-purple-500" />
                        <span className="break-all">{request.parent_email}</span>
                    </div>
                    {request.admin_name && (
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>Администратор: {request.admin_name}</span>
                        </div>
                    )}
                </div>

                {request.notes && (
                    <div className="rounded-lg bg-orange-50/80 p-3 text-xs text-gray-600">
                        <span className="font-semibold text-orange-700">Примечания:</span>
                        <div className="mt-1">{request.notes}</div>
                    </div>
                )}

                {request.admin_notes && (
                    <div className="rounded-lg bg-blue-50/80 p-3 text-xs text-blue-600">
                        <span className="font-semibold text-blue-700">Заметки администратора:</span>
                        <div className="mt-1">{request.admin_notes}</div>
                    </div>
                )}

                <div className="text-xs text-gray-500 border-t pt-2">
                    Создано: {formattedCreated}
                    {updatedBlock && ` • Обновлено: ${updatedBlock}`}
                </div>
            </div>
        </AdminCardBase>
    );
};

export default RequestCard;








