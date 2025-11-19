/**
 * @file: ChatDialogCard.tsx
 * @description: Карточка диалога чата для мобильной админ-панели
 * @dependencies: AdminCardBase, Badge, types/chat
 * @created: 2025-11-10
 */

import React from 'react';
import { Chat } from '@/types/chat';
import { AdminCardBase } from './AdminCardBase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageCircle, MapPin, Phone, Calendar as CalendarIcon } from 'lucide-react';

type ChatStatus = Chat['status'];

const STATUS_META: Record<ChatStatus, { label: string; className: string; tone: 'default' | 'success' | 'warning' | 'danger' }> = {
    active: {
        label: 'Активен',
        className: 'bg-green-100 text-green-700 border-green-200',
        tone: 'success',
    },
    pending: {
        label: 'Ожидает',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        tone: 'warning',
    },
    closed: {
        label: 'Закрыт',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        tone: 'default',
    },
};

interface ChatDialogCardProps {
    chat: Chat;
    isSelected?: boolean;
    onSelect?: (chat: Chat) => void;
}

export const ChatDialogCard: React.FC<ChatDialogCardProps> = ({
    chat,
    isSelected = false,
    onSelect,
}) => {
    const statusMeta = STATUS_META[chat.status] ?? STATUS_META.pending;
    const unreadCount = chat.unreadCount ?? 0;
    const formattedTime = chat.lastMessageAt
        ? new Date(chat.lastMessageAt).toLocaleString('ru-RU')
        : '—';
    const userName = chat.user?.name
        ? `${chat.user.name}${chat.user.surname ? ` ${chat.user.surname}` : ''}`.trim()
        : 'Пользователь';

    return (
        <AdminCardBase
            title={userName}
            subtitle={chat.user?.email}
            leading={(
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <MessageCircle className="h-5 w-5" />
                </span>
            )}
            meta={(
                <Badge className={cn('border px-2 py-0.5 text-xs', statusMeta.className)}>
                    {statusMeta.label}
                </Badge>
            )}
            tone={statusMeta.tone}
            onClick={onSelect ? () => onSelect(chat) : undefined}
            selected={isSelected}
            actions={
                unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                        {unreadCount}
                    </Badge>
                )
            }
            footer={(
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <div>Обновлено: {formattedTime}</div>
                </div>
            )}
        >
            <div className="space-y-2 text-sm text-gray-700">
                {chat.user?.schoolName && (
                    <div className="flex items-center gap-2 text-xs">
                        <MapPin className="h-3 w-3 text-orange-500" />
                        <span>{chat.user.schoolName}</span>
                    </div>
                )}
                {chat.user?.phone && (
                    <div className="flex items-center gap-2 text-xs">
                        <Phone className="h-3 w-3 text-green-500" />
                        <span>{chat.user.phone}</span>
                    </div>
                )}
                {chat.lastMessage && (
                    <div className="rounded-lg bg-gray-50 p-2 text-xs text-gray-600 line-clamp-2">
                        {chat.lastMessage}
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Создан: {new Date(chat.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
            </div>
        </AdminCardBase>
    );
};

export default ChatDialogCard;





