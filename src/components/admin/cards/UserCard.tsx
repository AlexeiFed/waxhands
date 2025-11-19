/**
 * @file: UserCard.tsx
 * @description: Карточка пользователя для мобильной админ-панели
 * @dependencies: AdminCardBase, Badge, Button, utils, types
 * @created: 2025-11-10
 */

import React from 'react';
import { User, UserRole } from '@/types';
import { AdminCardBase } from './AdminCardBase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Mail, School, Users, Edit, Trash2, ExternalLink, Shield, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface UserCardProps {
    user: User;
    parentUser?: User | null;
    childSchoolName?: string | null;
    className?: string;
    selectable?: boolean;
    selected?: boolean;
    onSelectChange?: (selected: boolean) => void;
    onOpenDetails?: (user: User) => void;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Администратор',
    parent: 'Родитель',
    child: 'Ребенок',
    executor: 'Исполнитель'
};

const ROLE_BADGE_STYLE: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    parent: 'bg-blue-100 text-blue-700 border-blue-200',
    child: 'bg-teal-100 text-teal-700 border-teal-200',
    executor: 'bg-amber-100 text-amber-700 border-amber-200'
};

const getInitials = (user: User) => {
    const letters = [user.name, user.surname]
        .filter(Boolean)
        .map((part) => part!.charAt(0).toUpperCase());
    return letters.join('').slice(0, 2) || '??';
};

const RoleIcon: React.FC<{ role: UserRole }> = ({ role }) => {
    switch (role) {
        case 'admin':
            return <Shield className="h-4 w-4" />;
        case 'executor':
            return <Users className="h-4 w-4" />;
        case 'child':
            return <Baby className="h-4 w-4" />;
        default:
            return <Users className="h-4 w-4" />;
    }
};

export const UserCard: React.FC<UserCardProps> = ({
    user,
    parentUser,
    childSchoolName,
    className,
    selectable,
    selected,
    onSelectChange,
    onOpenDetails,
    onEdit,
    onDelete
}) => {
    const fullName = [user.name, user.surname].filter(Boolean).join(' ');
    const childrenCount = user.children?.length ?? 0;

    const footer = (onOpenDetails || onEdit || onDelete) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="h-3 w-3 text-orange-400" />
                <span>Аккаунт создан: {new Date(user.createdAt ?? Date.now()).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-2">
                {onOpenDetails && (
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700" onClick={() => onOpenDetails(user)}>
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Подробнее
                    </Button>
                )}
                {onEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(user)} aria-label="Редактировать">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
                {onDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" aria-label="Удалить">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Это действие нельзя отменить. Пользователь будет удален навсегда.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(user)} className="bg-red-600 hover:bg-red-700">
                                    Удалить
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );

    return (
        <AdminCardBase
            title={fullName || 'Без имени'}
            subtitle={user.email ?? 'E-mail не указан'}
            meta={(
                <Badge className={cn('border px-2 py-0.5 text-xs', ROLE_BADGE_STYLE[user.role])}>
                    <RoleIcon role={user.role} />
                    <span className="ml-1">{ROLE_LABELS[user.role]}</span>
                </Badge>
            )}
            leading={(
                <Avatar className="h-10 w-10 bg-orange-100 text-orange-600">
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                </Avatar>
            )}
            actions={childrenCount > 0 && user.role === 'parent' ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                    👶 {childrenCount}
                </Badge>
            ) : null}
            footer={footer}
            selectable={selectable}
            selected={selected}
            onSelectToggle={onSelectChange}
            onClick={onOpenDetails ? () => onOpenDetails(user) : undefined}
            className={className}
        >
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <span>{user.phone || 'Телефон не указан'}</span>
                </div>

                {(user.schoolName || childSchoolName) && (
                    <div className="flex items-center gap-2 text-gray-700">
                        <School className="h-4 w-4 text-purple-500" />
                        <span>
                            {user.schoolName || childSchoolName}
                            {user.class ? ` • ${user.class}` : ''}
                        </span>
                    </div>
                )}

                {user.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="break-all">{user.email}</span>
                    </div>
                )}

                {user.role === 'parent' && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <span>⚙️ ID: {user.id}</span>
                    </div>
                )}
            </div>

            {user.role === 'child' && parentUser && (
                <div className="rounded-xl bg-orange-50/80 px-3 py-2 text-xs text-gray-600">
                    <div className="font-semibold text-gray-700 flex items-center gap-2">
                        <Users className="h-3 w-3 text-orange-500" />
                        Родитель: {parentUser.name} {parentUser.surname}
                    </div>
                    <div className="mt-1 flex flex-col gap-1 text-[11px] text-gray-500">
                        <span>Контакт: {parentUser.phone || parentUser.email || '—'}</span>
                        <span>ID родителя: {parentUser.id}</span>
                    </div>
                </div>
            )}
        </AdminCardBase>
    );
};

export default UserCard;

