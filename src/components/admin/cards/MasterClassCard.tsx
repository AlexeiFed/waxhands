/**
 * @file: MasterClassCard.tsx
 * @description: Карточка мастер-класса для мобильного режима админ-панели
 * @dependencies: AdminCardBase, MasterClassEvent, shadcn/ui
 * @created: 2025-11-10
 */

import React from 'react';
import { MasterClassEvent } from '@/types/services';
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
    Calendar,
    Building2,
    Users,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    Ticket,
    GraduationCap,
    DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasterClassCardProps {
    masterClass: MasterClassEvent;
    className?: string;
    onEdit?: (masterClass: MasterClassEvent) => void;
    onDelete?: (masterClass: MasterClassEvent) => void;
    onOpenDetails?: (masterClass: MasterClassEvent) => void;
}

const STATUS_BADGES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-purple-100 text-purple-700 border-purple-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const getStatusBadgeClass = (status?: string) => STATUS_BADGES[status ?? 'scheduled'] ?? STATUS_BADGES.scheduled;

const formatDateTime = (date?: string, time?: string) => {
    if (!date) return 'Дата не указана';
    try {
        const localeDate = new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
        return time ? `${localeDate}, ${time}` : localeDate;
    } catch (error) {
        console.error('Ошибка форматирования даты мастер-класса:', error);
        return date;
    }
};

export const MasterClassCard: React.FC<MasterClassCardProps> = ({
    masterClass,
    className,
    onEdit,
    onDelete,
    onOpenDetails,
}) => {
    const statusBadge = (
        <Badge className={cn('border px-2 py-0.5 text-xs capitalize', getStatusBadgeClass(masterClass.status))}>
            <Ticket className="mr-1 h-3 w-3" />
            {masterClass.status ?? 'scheduled'}
        </Badge>
    );

    const leading = (
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <GraduationCap className="h-5 w-5" />
        </span>
    );

    const schoolName = masterClass.school?.name ?? masterClass.schoolName ?? 'Школа не указана';
    const executors = masterClass.executors_full?.map((executor) => executor.fullName ?? executor.name).filter(Boolean) ?? [];
    const participantsCount = masterClass.participants?.length ?? 0;
    const totalParticipants = masterClass.statistics?.totalParticipants ?? participantsCount;
    const totalAmount = masterClass.statistics?.totalAmount ?? masterClass.totalAmount ?? 0;

    return (
        <AdminCardBase
            title={masterClass.name ?? 'Без названия'}
            subtitle={formatDateTime(masterClass.date, masterClass.time)}
            leading={leading}
            meta={statusBadge}
            onClick={onOpenDetails ? () => onOpenDetails(masterClass) : undefined}
            actions={
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(masterClass);
                            }}
                            aria-label="Редактировать мастер-класс"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label="Удалить мастер-класс"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить мастер-класс?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Это действие нельзя отменить. Мастер-класс будет удалён без возможности восстановления.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(masterClass)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Удалить
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            }
            className={className}
        >
            <div className="space-y-3 text-sm text-gray-700">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <span>{schoolName}</span>
                    </div>

                    {masterClass.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-purple-500" />
                            <span>{masterClass.location}</span>
                        </div>
                    )}

                    {masterClass.time && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>{masterClass.time}</span>
                        </div>
                    )}
                </div>

                {executors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        {executors.slice(0, 3).map((name) => (
                            <Badge key={name} variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                {name}
                            </Badge>
                        ))}
                        {executors.length > 3 && (
                            <span className="text-xs text-muted-foreground">+ ещё {executors.length - 3}</span>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 text-orange-400" />
                    <span>ID: {masterClass.id}</span>
                    <span className="mx-1">•</span>
                    <span>Участников: {totalParticipants}</span>
                    {totalAmount > 0 && (
                        <>
                            <span className="mx-1">•</span>
                            <span className="inline-flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-green-500" />
                                {totalAmount} ₽
                            </span>
                        </>
                    )}
                </div>
            </div>
        </AdminCardBase>
    );
};

export default MasterClassCard;

