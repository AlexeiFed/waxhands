/**
 * @file: src/components/ui/chat-card.tsx
 * @description: Карточка чата для админ-дашборда с счетчиком непрочитанных сообщений
 * @dependencies: use-chat.ts, types/chat.ts
 * @created: 2024-12-19
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { useAdminChat } from '../../hooks/use-chat';
import { MessageCircle, Users, Clock, AlertCircle } from 'lucide-react';

interface ChatCardProps {
    onOpenChat: () => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ onOpenChat }) => {
    const { chats, isLoadingChats, refetchChats } = useAdminChat();

    const pendingChats = chats.filter(c => c.status === 'pending');
    const activeChats = chats.filter(c => c.status === 'active');
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

    // Принудительно загружаем чаты при монтировании компонента
    React.useEffect(() => {
        console.log('ChatCard: Принудительная загрузка чатов');
        refetchChats();
    }, [refetchChats]);

    // Отладочная информация
    console.log('ChatCard - данные чатов:', {
        total: chats.length,
        pending: pendingChats.length,
        active: activeChats.length,
        unread: totalUnread,
        isLoading: isLoadingChats,
        chats: chats.map(c => ({ id: c.id, status: c.status, unreadCount: c.unreadCount }))
    });

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-900 flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>Чат поддержки</span>
                    </CardTitle>
                    {totalUnread > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {totalUnread} непрочитанных
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Статистика */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {isLoadingChats ? '...' : chats.length}
                        </div>
                        <div className="text-xs text-blue-700">Всего чатов</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                            {isLoadingChats ? '...' : pendingChats.length}
                        </div>
                        <div className="text-xs text-yellow-700">Ожидают</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {isLoadingChats ? '...' : activeChats.length}
                        </div>
                        <div className="text-xs text-green-700">Активные</div>
                    </div>
                </div>

                {/* Уведомления */}
                {totalUnread > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">
                                {totalUnread} непрочитанных сообщений
                            </span>
                        </div>
                        <p className="text-xs text-red-600 mt-1">
                            Требуют вашего внимания
                        </p>
                    </div>
                )}

                {/* Кнопка открытия чата */}
                <Button
                    onClick={onOpenChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Открыть чаты
                </Button>

                {/* Дополнительная информация */}
                <div className="text-xs text-blue-600 text-center">
                    {pendingChats.length > 0 && (
                        <p>⚠️ {pendingChats.length} чатов ожидают ответа</p>
                    )}
                    {totalUnread > 0 && (
                        <p>📬 {totalUnread} непрочитанных сообщений</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ChatCard;

