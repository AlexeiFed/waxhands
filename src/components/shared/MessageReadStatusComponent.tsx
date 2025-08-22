/**
 * @file: src/components/shared/MessageReadStatusComponent.tsx
 * @description: Компонент для отображения статуса прочтения сообщений
 * @dependencies: types/chat.ts
 * @created: 2024-12-19
 */

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { MessageReadStatus as MessageReadStatusType } from '../../types/chat';

interface MessageReadStatusProps {
    status: MessageReadStatusType;
    isOwnMessage: boolean;
    readAt?: string;
    readBy?: string[];
    className?: string;
}

export const MessageReadStatusComponent: React.FC<MessageReadStatusProps> = ({
    status,
    isOwnMessage,
    readAt,
    readBy,
    className = ''
}) => {
    // Если это не наше сообщение, не показываем статус
    if (!isOwnMessage) {
        return null;
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'sent':
                return <Check className="w-3 h-3 text-gray-400" />;
            case 'delivered':
                return <Check className="w-3 h-3 text-blue-400" />;
            case 'read':
                return <CheckCheck className="w-3 h-3 text-blue-500" />;
            default:
                return <Check className="w-3 h-3 text-gray-400" />;
        }
    };

    const getStatusTooltip = () => {
        switch (status) {
            case 'sent':
                return 'Отправлено';
            case 'delivered':
                return 'Доставлено';
            case 'read':
                return readAt ? `Прочитано ${new Date(readAt).toLocaleTimeString()}` : 'Прочитано';
            default:
                return 'Отправлено';
        }
    };

    return (
        <div
            className={`flex items-center gap-1 ${className}`}
            title={getStatusTooltip()}
        >
            {getStatusIcon()}
        </div>
    );
};
